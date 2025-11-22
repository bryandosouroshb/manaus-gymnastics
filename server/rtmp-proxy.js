#!/usr/bin/env node
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/live' });

let ffmpegProc = null;
let isStreaming = false;
let connectedClients = new Set();
// Default encoding configuration (overridable via env)
const VIDEO_BITRATE = process.env.VIDEO_BITRATE || '1200k';
const VIDEO_MAXRATE = process.env.VIDEO_MAXRATE || VIDEO_BITRATE;
const VIDEO_BUFSIZE = process.env.VIDEO_BUFSIZE || '2400k';
const VIDEO_SCALE = process.env.VIDEO_SCALE || '1280:-2'; // width:height, -2 preserves aspect
const VIDEO_FPS = process.env.VIDEO_FPS || '25';

// Resolve ffmpeg executable path: prefer FFMPEG_PATH env, then ./public/server/ffmpeg(.exe), then 'ffmpeg' on PATH
// BIBLIOTECA NOVA: Resolve o caminho do ffmpeg automaticamente
const ffmpegPath = require('ffmpeg-static');

// Usa o ffmpeg do pacote ou uma variável de ambiente se definida
let ffmpegCmd = process.env.FFMPEG_PATH || ffmpegPath;

console.log('[rtmp-proxy] using ffmpeg command:', ffmpegCmd);

function startFFmpeg(rtmpUrl) {
  if (isStreaming) {
    console.warn('FFmpeg already running');
    return false;
  }

  if (!rtmpUrl) {
    throw new Error('Missing rtmpUrl');
  }

  // Spawn ffmpeg to read webm from stdin and push to RTMP
  // We transcode to H.264/AAC for maximum compatibility with YouTube
  const args = [
    '-y',
    '-thread_queue_size', '1024',
    '-f', 'webm',
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-preset', 'ultrafast', // Mantém leve pro seu PC
    '-tune', 'zerolatency',
    
    // --- MUDANÇA AQUI: FORÇAR CBR (Taxa Constante) ---
    '-b:v', '2500k',    // Alvo: 2500k (O que o YouTube pede)
    '-minrate', '2500k', // OBRIGATÓRIO: Nunca baixar disso
    '-maxrate', '2500k', // Teto: Não passar disso
    '-bufsize', '5000k', // Buffer de 2x o bitrate
    // ------------------------------------------------
    
    '-vf', `scale=${VIDEO_SCALE}`,
    '-r', '24', // 24fps é mais leve
    '-g', '48',
    '-keyint_min', '48',
    '-c:a', 'aac',
    '-b:a', '128k', // Aumentei um pouco o áudio para ajudar no "peso" do stream
    '-ar', '44100',
    '-f', 'flv',
    rtmpUrl
  ];

  console.log('Starting ffmpeg with args:', args.join(' '));

  ffmpegProc = spawn(ffmpegCmd, args, { stdio: ['pipe', 'inherit', 'inherit'] });

  ffmpegProc.on('close', (code, signal) => {
    console.log(`FFmpeg exited with code ${code} signal ${signal}`);
    ffmpegProc = null;
    isStreaming = false;
  });

  ffmpegProc.on('error', (err) => {
    console.error('FFmpeg error:', err);
    ffmpegProc = null;
    isStreaming = false;
  });

  isStreaming = true;
  return true;
}

function stopFFmpeg() {
  if (!ffmpegProc) return false;
  try {
    ffmpegProc.kill('SIGINT');
    ffmpegProc = null;
    isStreaming = false;
    return true;
  } catch (e) {
    console.warn('Error stopping ffmpeg:', e);
    return false;
  }
}

app.post('/start', (req, res) => {
  const { rtmpUrl } = req.body || {};
  if (!rtmpUrl) return res.status(400).json({ ok: false, message: 'rtmpUrl required' });

  try {
    const ok = startFFmpeg(rtmpUrl);
    if (!ok) return res.status(409).json({ ok: false, message: 'Already streaming' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to start ffmpeg:', err);
    return res.status(500).json({ ok: false, message: String(err) });
  }
});

app.post('/stop', (req, res) => {
  const ok = stopFFmpeg();
  return res.json({ ok: !!ok });
});

wss.on('connection', (ws, req) => {
  console.log('WebSocket connected:', req.socket.remoteAddress);
  connectedClients.add(ws);
  // Per-socket small buffer queue to handle backpressure
  ws._queue = [];
  ws._queuedBytes = 0;
  ws._flushing = false;
  // protection thresholds
  ws._maxQueueMessages = 100; // max messages to hold in memory
  ws._maxQueueBytes = 25 * 1024 * 1024; // 25MB

  ws.on('message', (msg) => {
    // Expect binary data (webm chunks) or text control messages
    if (Buffer.isBuffer(msg)) {
      if (isStreaming && ffmpegProc && ffmpegProc.stdin && !ffmpegProc.stdin.destroyed) {
        try {
          const ok = ffmpegProc.stdin.write(msg);
          if (!ok) {
            // stdin buffer is full — queue the message and flush on 'drain'
            ws._queue.push(msg);
            ws._queuedBytes += msg.length;
            console.warn(`stdin backpressure: queued=${ws._queue.length} bytes=${ws._queuedBytes}`);
            // enforce queue limits
            while (ws._queue.length > ws._maxQueueMessages || ws._queuedBytes > ws._maxQueueBytes) {
              const dropped = ws._queue.shift();
              ws._queuedBytes -= dropped.length;
              console.warn('Dropped oldest queued chunk to avoid memory growth. newQueued=', ws._queue.length, 'bytes=', ws._queuedBytes);
            }
            ffmpegProc.stdin.once('drain', () => {
              // flush queued messages
              if (ws._queue.length === 0) return;
              try {
                console.log('Flushing queued stdin messages, count=', ws._queue.length, 'bytes=', ws._queuedBytes);
                while (ws._queue.length) {
                  const next = ws._queue.shift();
                  ws._queuedBytes -= next.length;
                  const ok2 = ffmpegProc.stdin.write(next);
                  if (!ok2) {
                    // still backpressure — requeue remaining and wait again
                    console.warn('Still backpressure while flushing; remaining queued=', ws._queue.length);
                    break;
                  }
                }
                if (ws._queue.length === 0) console.log('Flushed all queued stdin messages');
              } catch (e) {
                console.warn('Error flushing stdin queue', e);
              }
            });
          }
        } catch (e) {
          console.warn('Error writing to ffmpeg stdin', e);
        }
      }
    } else {
      // text message
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed && parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (e) {
        // ignore
      }
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log('WebSocket disconnected');
  });

  ws.on('error', (err) => {
    console.warn('WebSocket error', err);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`RTMP proxy server listening on http://localhost:${PORT}`);
  console.log('WebSocket endpoint: ws://localhost:%s/live', PORT);
});

// Simple status endpoint
app.get('/status', (req, res) => {
  res.json({ ok: true, streaming: isStreaming, clients: connectedClients.size });
});

// Simple metrics endpoint for diagnostics
app.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  let totalQueuedMessages = 0;
  let totalQueuedBytes = 0;
  for (const ws of connectedClients) {
    if (ws && ws._queue) totalQueuedMessages += ws._queue.length;
    if (ws && ws._queuedBytes) totalQueuedBytes += ws._queuedBytes;
  }

  res.json({
    ok: true,
    streaming: isStreaming,
    clients: connectedClients.size,
    ffmpegPid: ffmpegProc ? ffmpegProc.pid : null,
    queuedMessages: totalQueuedMessages,
    queuedBytes: totalQueuedBytes,
    memory: mem
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  stopFFmpeg();
  process.exit(0);
});

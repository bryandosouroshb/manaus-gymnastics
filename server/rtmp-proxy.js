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

// Resolve ffmpeg executable path: prefer FFMPEG_PATH env, then ./public/server/ffmpeg(.exe), then 'ffmpeg' on PATH
const path = require('path');
const fs = require('fs');
let ffmpegCmd = process.env.FFMPEG_PATH || null;
if (!ffmpegCmd) {
  const localCandidate = path.join(__dirname, '..', 'public', 'server', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(localCandidate)) {
    ffmpegCmd = localCandidate;
  } else {
    ffmpegCmd = 'ffmpeg';
  }
}
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
    '-y', // overwrite
    '-f', 'webm',
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-b:v', '2500k',
    '-maxrate', '2500k',
    '-bufsize', '5000k',
    '-g', '50',
    '-c:a', 'aac',
    '-b:a', '128k',
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

  ws.on('message', (msg) => {
    // Expect binary data (webm chunks) or text control messages
    if (Buffer.isBuffer(msg)) {
      if (isStreaming && ffmpegProc && ffmpegProc.stdin && !ffmpegProc.stdin.destroyed) {
        ffmpegProc.stdin.write(msg);
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

process.on('SIGINT', () => {
  console.log('Shutting down...');
  stopFFmpeg();
  process.exit(0);
});

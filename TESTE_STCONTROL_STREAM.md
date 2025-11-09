# 🧪 GUIA DE TESTE: stcontrol.html ↔️ stream.html

## ✅ CORREÇÕES APLICADAS

### 1. Bug do overlayContext.music CORRIGIDO ✅
- **Problema**: `overlayContext.music` não estava inicializado
- **Solução**: Adicionado `music: { status: 'WAIT', label: 'FX', timestamp: null }` no overlayContext

### 2. Logs de Debug Completos Adicionados 📝
- Todas as mensagens BroadcastChannel agora são logadas
- Status de áudio é mostrado no console
- Inicialização dos channels é confirmada

---

## 🎯 COMO TESTAR

### PASSO 1: Abrir ambas as páginas
1. Abra **stcontrol.html** em uma aba: `http://localhost:5000/stcontrol`
2. Abra **stream.html** em OUTRA aba: `http://localhost:5000/stream`

### PASSO 2: Habilitar áudio no stream.html
⚠️ **CRÍTICO**: Clique no botão **"🔊 ENABLE AUDIO"** no stream.html
- Sem isso, NENHUMA música vai tocar
- Você vai ver aviso no console se esquecer

### PASSO 3: Abrir o console em AMBAS as abas
- Pressione `F12` em ambas
- Vá para a aba "Console"

### PASSO 4: Verificar inicialização
No console do **stcontrol.html** você deve ver:
```
[Control] ✅ BroadcastChannels initialized: fx-control, sound-effects
```

No console do **stream.html** você deve ver:
```
[Stream] Initializing broadcast engine...
[Stream] ✅ BroadcastChannel fx-control initialized and ready
[Stream] ✅ BroadcastChannel sound-effects initialized and ready
[Stream] Broadcast engine initialized
```

### PASSO 5: Selecionar fase e ginasta
No **stcontrol.html**:
1. Selecione a fase (ex: Qualifiers)
2. Selecione o aparelho **FX** (Floor)
3. Verifique se ginastas foram carregadas na lista

### PASSO 6: Testar música de solo
No **stcontrol.html**, clique no botão **"▶️ Play FX Music"**

**No console do stcontrol.html** você deve ver:
```
[Control] 📤 Sending sound-effects message: {action: 'play', file: '/music/jade.m4a', volume: 1}
[Control] Playing FX music for: Jade DOREFORSO | URL: /music/jade.m4a
```

**No console do stream.html** você deve ver:
```
[Stream] 🎵 Received sound-effects message: {action: 'play', file: '/music/jade.m4a', volume: 1}
[Stream] 🎵 Attempting to play music: /music/jade.m4a
[Stream] 🎵 gymnastAudioElement exists: true
[Stream] 🎵 audioEnabled: true
[Stream] 🎵 Setting src and playing...
[Stream] ✅ Playing FX music successfully: /music/jade.m4a
```

### PASSO 7: Testar Timer
No **stcontrol.html**, clique em **"▶️ Start Timer"**

**No console do stcontrol.html** você deve ver:
```
[Control] 📤 Sending fx-control message: {action: 'timer-start', gymnastId: '...', apparatus: 'fx', timestamp: ...}
[Control] Timer started for apparatus: fx | Gymnast: 0b6BvShFI1CZ1xuJnbHW
```

**No console do stream.html** você deve ver:
```
[Stream] 📡 Received fx-control message: {action: 'timer-start', gymnastId: '...', apparatus: 'fx', ...}
```

E a música de solo deve começar a tocar AUTOMATICAMENTE!

### PASSO 8: Testar Lower Third
No **stcontrol.html**, clique em **"👤 Show Lower Third"**

Você deve ver no **stream.html**:
- O nome da ginasta aparece na tela
- Bandeira do país
- Aparelho

### PASSO 9: Testar Warmup
No **stcontrol.html**, clique em **"🔥 Start Warmup (1min)"**

No **stream.html** você deve ver:
- Overlay de warmup com contagem regressiva
- Beep sonoro (se audioEnabled)

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ "Audio not enabled"
**Problema**: Você vê no console:
```
[Stream] ⚠️ Audio is not enabled. User must click "Enable Audio" button first.
```
**Solução**: Clique no botão "🔊 ENABLE AUDIO" no stream.html

### ❌ Música não toca
**Checklist**:
1. ✅ Audio foi habilitado no stream.html?
2. ✅ A ginasta tem `fxMusicUrl` no Firebase? (verifique gymnasts_normalized/new_gymnasts)
3. ✅ O arquivo de música existe? (ex: `/music/jade.m4a`)
4. ✅ As duas abas estão abertas no MESMO navegador?
5. ✅ Você vê os logs de "Received sound-effects message"?

### ❌ "No BroadcastChannel messages received"
**Problema**: O stcontrol envia mas o stream não recebe

**Possíveis causas**:
1. Páginas abertas em navegadores DIFERENTES (Chrome vs Firefox)
2. Uma página em janela normal, outra em modo privado/anônimo
3. Páginas de domínios diferentes (localhost:5000 vs 127.0.0.1:5000)

**Solução**: Abra AMBAS as páginas no MESMO navegador, mesma janela, localhost:5000

### ❌ Ginasta não tem música
**Problema**: No console você vê:
```
[Control] No fxMusicUrl for gymnast: gym_001
```

**Solução**: 
1. Vá no Firebase Console
2. Abra a collection `new_gymnasts`
3. Encontre o documento da ginasta
4. Adicione o campo `fxMusicUrl: "/music/nome-do-arquivo.mp3"`

---

## 📊 CHECKLIST DE FUNCIONAMENTO COMPLETO

### ✅ stcontrol.html
- [ ] BroadcastChannels inicializados (ver log)
- [ ] Fase selecionada carrega ginastas
- [ ] Botões de TV Broadcast aparecem
- [ ] Logs de envio de mensagens aparecem quando clica nos botões

### ✅ stream.html
- [ ] BroadcastChannels inicializados (ver log)
- [ ] Botão "Enable Audio" foi clicado
- [ ] Logs de recebimento de mensagens aparecem
- [ ] Música toca quando timer inicia (FX)
- [ ] Beep toca quando timer inicia (VT/UB/BB)
- [ ] Lower third aparece/some
- [ ] Timer começa/para/reseta
- [ ] Warmup overlay aparece

---

## 🎬 TESTE FINAL: Simulação Completa

1. **stcontrol.html**: Selecione "Qualifiers" → "FX"
2. **stream.html**: Clique "Enable Audio"
3. **stcontrol.html**: Selecione ginasta "Jade DOREFORSO" (índice 0)
4. **stcontrol.html**: Clique "Show Lower Third" → Nome deve aparecer no stream
5. **stcontrol.html**: Clique "Start Timer" → Música jade.m4a deve tocar
6. **stream.html**: Verifique que timer está rodando e música tocando
7. **stcontrol.html**: Aguarde alguns segundos, clique "Stop Timer"
8. **stcontrol.html**: Clique "Hide Lower Third"
9. **stcontrol.html**: Clique "Reset Timer"

✅ Se tudo funcionar, o sistema está OK!

---

## 📞 REPORTAR PROBLEMAS

Se algo não funcionar, copie os logs do console de AMBAS as abas e me envie!

# 📚 Documentação Técnica Completa - Sistema Manaus Gymnastics Broadcast

**Versão:** 2.0  
**Data:** Outubro 2025  
**Autor:** Bryan Martins  
**Status:** Em Produção

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Painel de Controle (stcontrol.html)](#painel-de-controle-stcontrol)
4. [Sistema de Transmissão (stream.html)](#sistema-de-transmissão-stream)
5. [Display de Arena (display.html & control.html)](#display-de-arena)
6. [Integrações e Fluxos de Dados](#integrações-e-fluxos-de-dados)
7. [Configurações e Deployment](#configurações-e-deployment)

---

## 🎯 Visão Geral do Projeto

### Objetivo Principal

Criar um sistema completo de transmissão e gerenciamento de competições de ginástica artística que rivaliza com sistemas profissionais internacionais, eliminando completamente a necessidade de softwares de terceiros como OBS para composição gráfica.

### Componentes Principais

O sistema é dividido em **4 subsistemas independentes mas interconectados**:

1. **Display de Arena** (`display.html` + `control.html`)
   - Placar físico da arena visível ao público presente
   - Controle manual do telão
   
2. **Sistema de Transmissão** (`stream.html` + `stcontrol.html`)
   - Motor gráfico para transmissão online
   - Painel de controle de TV profissional

3. **Firebase Backend**
   - Banco de dados em tempo real
   - Autenticação e autorização
   - Sincronização de estado

4. **Módulos Auxiliares**
   - Edição de notas
   - Scoreboards por aparelho
   - Start lists por fase

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

```
Frontend:
├── HTML5 (Estrutura)
├── CSS3 (Estilização com variáveis)
├── JavaScript Vanilla (Lógica)
└── BroadcastChannel API (Comunicação entre abas)

Backend:
├── Firebase Firestore (Banco de dados NoSQL)
├── Firebase Authentication (Auth)
└── Firebase Hosting (Deploy)

Design System:
├── Paleta: Verde Mundial (#0e7c3a, #009f3d, #f7c948)
├── Tipografia: Montserrat (texto) + Orbitron (números)
└── Tema: FIG World Championships (Broadcast Quality)
```

### Diagrama de Comunicação

```
┌─────────────────┐         ┌──────────────────┐
│  stcontrol.html │────────▶│   stream.html    │
│ (Stream Control)│ BChannel│ (Broadcast Out)  │
└────────┬────────┘         └──────────────────┘
         │
         │ Firestore
         │ broadcast/
         ▼ liveState
┌─────────────────┐
│   Firebase      │
│   Firestore     │
└────────┬────────┘
         │
         │ fx-control
         │ BChannel
         ▼
┌─────────────────┐         ┌──────────────────┐
│   control.html  │────────▶│   display.html   │
│ (Arena Control) │ BChannel│  (Arena Screen)  │
└─────────────────┘         └──────────────────┘
```

### Coleções Firebase

```javascript
Firestore Structure:
├── new_gymnasts/          // Dados das ginastas
│   └── {gymnastId}
│       ├── name: string
│       ├── surname: string
│       ├── country: string (ISO code)
│       └── scores: object
│
├── start_lists/           // Listas de entrada
│   └── {phaseKey}
│       ├── phase: string
│       ├── apparatus: string
│       ├── structure: string (encoded)
│       └── rotations: array
│
├── broadcast/             // Estado da transmissão
│   └── liveState
│       ├── currentScene: string
│       ├── scenePayload: object
│       ├── activeOverlays: object
│       └── lowerThird: object
│
└── users/                 // Controle de acesso
    └── {userId}
        ├── email: string
        └── role: string (admin|operator|viewer)
```

---

## 🎛️ Painel de Controle (stcontrol.html)

### Visão Geral

**Propósito:** Painel profissional de controle de transmissão TV com todas as funcionalidades do sistema de arena adaptadas para overlays broadcast.

**Arquivo:** `public/stcontrol.html`  
**Canal de Comunicação:** `fx-control` BroadcastChannel  
**Firestore Doc:** `broadcast/liveState`

### Design e Layout

#### Paleta de Cores

```css
/* Cores Mundiais - Verde e Branco */
--primary: #22c55e;        /* Verde principal */
--primary-dark: #16a34a;   /* Verde escuro */
--primary-light: #4ade80;  /* Verde claro */
--accent: #f7c948;         /* Dourado de destaque */
--bg-dark: #0f172a;        /* Fundo escuro */
--surface: #1e293b;        /* Superfícies */
--border: #334155;         /* Bordas sutis */
--text-primary: #f1f5f9;   /* Texto principal */
--text-secondary: #94a3b8; /* Texto secundário */
```

#### Tipografia

```css
/* Sistema de Fontes */
font-family: 'Montserrat', sans-serif; /* Todos os textos */

/* Hierarquia */
h1: 2rem, weight 800
h2: 1.5rem, weight 700
h3: 1.25rem, weight 600
body: 1rem, weight 400
small: 0.875rem, weight 400
```

### Estrutura HTML

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Stream Control - Manaus 2025</title>
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap">
    
    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    
    <!-- Scripts do Sistema -->
    <script src="js/firebase-init.js"></script>
    <script src="js/auth-guard.js"></script>
    <script src="js/countries.js"></script>
    <script src="js/calculation-logic.js"></script>
</head>
<body>
    <!-- Layout do Painel -->
    <div class="control-container">
        <!-- Header -->
        <header class="control-header">
            <h1>🎬 Controle de Transmissão - Manaus 2025</h1>
            <div class="status-indicators">
                <span class="status firebase">🔥 Firebase</span>
                <span class="status stream">📡 Stream</span>
            </div>
        </header>

        <!-- Área Principal -->
        <main class="control-main">
            <!-- Seção de Configuração -->
            <section class="config-section">
                <h2>⚙️ Configuração</h2>
                <!-- Dropdowns de Fase/Rotação/Aparelho -->
            </section>

            <!-- Navegação de Ginastas -->
            <section class="gymnast-navigation">
                <h2>🤸 Ginasta Atual</h2>
                <!-- Display e botões Anterior/Próximo -->
            </section>

            <!-- Controles de Timer -->
            <section class="timer-controls">
                <h2>⏱️ Cronômetro</h2>
                <!-- Botões Iniciar/Parar/Reset -->
            </section>

            <!-- Controles de Overlay -->
            <section class="overlay-controls">
                <h2>📺 Overlays</h2>
                <!-- Grid de botões para ativar overlays -->
            </section>

            <!-- Controles de Aquecimento -->
            <section class="warmup-controls">
                <h2>🔥 Aquecimento</h2>
                <!-- Timer e controles de warmup -->
            </section>

            <!-- Controles de Recurso -->
            <section class="inquiry-controls">
                <h2>⚖️ Recursos</h2>
                <!-- Botões de inquiry -->
            </section>
        </main>
    </div>

    <!-- Scripts Inline -->
    <script>
        // Lógica do painel (próxima seção)
    </script>
</body>
</html>
```

### Funcionalidades Principais

#### 1. Seleção de Fase e Rotação

```javascript
// Configuração da competição
const configSection = {
    phaseSelect: document.getElementById('phase-select'),
    rotationSelect: document.getElementById('rotation-select'),
    apparatusSelect: document.getElementById('apparatus-select')
};

// Carregar dados do Firebase
function loadPhaseOptions() {
    db.collection('start_lists').onSnapshot(snapshot => {
        allStartListStructures = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const key = `${data.phase}|${data.apparatus}`;
            allStartListStructures[key] = data;
        });
        populatePhaseSelect();
    });
}

// Aplicar configuração
function applyConfiguration() {
    const phase = configSection.phaseSelect.value;
    const rotation = parseInt(configSection.rotationSelect.value);
    const apparatus = configSection.apparatusSelect.value;
    
    currentFullSelection = { phase, rotation, apparatus };
    loadGymnastList();
}
```

#### 2. Navegação de Ginastas

```javascript
// Variáveis de estado
let currentGymnastList = [];
let currentIndex = 0;
let allGymnastData = {};

// Carregar lista de ginastas da rotação selecionada
function loadGymnastList() {
    const { phase, rotation, apparatus } = currentFullSelection;
    const structureKey = `${phase}|${apparatus}`;
    
    console.log('[Control] Loading gymnast list for:', structureKey);
    
    // Buscar estrutura no Firebase
    const structure = allStartListStructures[structureKey];
    if (!structure) {
        console.warn('[Control] Structure not found:', structureKey);
        currentGymnastList = [];
        return;
    }
    
    // Extrair IDs das ginastas
    const gymnastIds = getGymnastListFromStructure(structure, rotation);
    
    // Buscar dados completos
    currentGymnastList = gymnastIds.map(id => allGymnastData[id]).filter(Boolean);
    currentIndex = 0;
    
    updateCurrentGymnastDisplay();
}

// Navegação Anterior/Próxima
function previousGymnast() {
    if (currentIndex > 0) {
        currentIndex--;
        updateCurrentGymnastDisplay();
    }
}

function nextGymnast() {
    if (currentIndex < currentGymnastList.length - 1) {
        currentIndex++;
        updateCurrentGymnastDisplay();
    }
}

// Atualizar display da ginasta atual
function updateCurrentGymnastDisplay() {
    const gymnast = currentGymnastList[currentIndex];
    if (!gymnast) return;
    
    const displayElement = document.getElementById('current-gymnast-display');
    displayElement.innerHTML = `
        <div class="gymnast-card">
            <span class="flag-icon">${getCountryFlag(gymnast.country)}</span>
            <div class="gymnast-info">
                <strong>${gymnast.surname}</strong> ${gymnast.name}
                <small>${gymnast.country}</small>
            </div>
            <span class="position">${currentIndex + 1}/${currentGymnastList.length}</span>
        </div>
    `;
    
    // Sincronizar com broadcast se ativado
    if (broadcastAutoSync) {
        syncBroadcastWithCurrentGymnast();
    }
}
```

#### 3. Controles de Timer

```javascript
// Estado do timer
let timerInterval = null;
let timerStartTime = null;
let timerElapsed = 0;

// Aparelhos e tempos máximos
const TIMER_THRESHOLDS = {
    'vt': { max: 30, warn: 25 },
    'ub': { max: 30, warn: 25 },
    'bb': { max: 90, warn: 80 },
    'fx': { max: 90, warn: 80 }
};

// Iniciar timer
function startTimer() {
    const apparatus = currentFullSelection.apparatus;
    const thresholds = TIMER_THRESHOLDS[apparatus] || { max: 90, warn: 80 };
    
    // Resetar e iniciar
    timerStartTime = Date.now();
    timerElapsed = 0;
    
    timerInterval = setInterval(() => {
        timerElapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        updateTimerDisplay(timerElapsed, thresholds);
        
        // Enviar para stream via BroadcastChannel
        controlChannel.postMessage({
            action: 'timer-update',
            elapsed: timerElapsed,
            thresholds: thresholds
        });
    }, 100);
    
    // Ativar overlay de timer no stream
    setOverlayState('timer', true);
    
    // Tocar beep de início
    controlChannel.postMessage({
        action: 'play-beep',
        type: 'start'
    });
}

// Parar timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        
        controlChannel.postMessage({
            action: 'timer-stop',
            finalTime: timerElapsed
        });
        
        // Aguardar 10s antes de ocultar
        setTimeout(() => {
            setOverlayState('timer', false);
        }, 10000);
    }
}

// Reset timer
function resetTimer() {
    stopTimer();
    timerElapsed = 0;
    updateTimerDisplay(0, TIMER_THRESHOLDS[currentFullSelection.apparatus] || {});
}

// Atualizar display do timer
function updateTimerDisplay(elapsed, thresholds) {
    const displayElement = document.getElementById('timer-display');
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Determinar status visual
    let status = 'ok';
    if (elapsed >= thresholds.max) status = 'over';
    else if (elapsed >= thresholds.warn) status = 'warn';
    
    displayElement.textContent = formatted;
    displayElement.className = `timer-display status-${status}`;
}
```

#### 4. Sistema de Broadcast e Sincronização

```javascript
// Canal de comunicação
const controlChannel = new BroadcastChannel('fx-control');

// Estado do broadcast
let broadcastAutoSync = true;
let currentBroadcastState = {
    lowerThird: {
        visible: false,
        firstname: '',
        surname: '',
        country: '',
        countryCode: '',
        apparatus: ''
    },
    overlays: {
        widgets: {
            timer: false,
            scorecard: false,
            startlistMain: false,
            startlistCorner: false,
            results: false
        }
    }
};

// Sincronizar ginasta atual com broadcast
function syncBroadcastWithCurrentGymnast() {
    const gymnast = currentGymnastList[currentIndex];
    if (!gymnast) return;
    
    const countryInfo = getCountryInfo(gymnast.country);
    
    // Atualizar estado local
    currentBroadcastState.lowerThird = {
        visible: currentBroadcastState.lowerThird.visible,
        firstname: gymnast.name,
        surname: gymnast.surname,
        country: countryInfo.name,
        countryCode: countryInfo.code,
        apparatus: currentFullSelection.apparatus.toUpperCase()
    };
    
    // Enviar para Firestore
    pushBroadcastState();
}

// Push estado para Firestore
function pushBroadcastState() {
    if (!db) return;
    
    db.collection('broadcast').doc('liveState').set({
        lowerThird: currentBroadcastState.lowerThird,
        activeOverlays: currentBroadcastState.overlays,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => console.log('[Broadcast] State updated'))
    .catch(err => console.error('[Broadcast] Error:', err));
}

// Controlar visibilidade do lower-third
function toggleLowerThirdVisibility() {
    currentBroadcastState.lowerThird.visible = !currentBroadcastState.lowerThird.visible;
    pushBroadcastState();
}

// Função rápida "Ao Vivo"
function goLiveWithCurrentGymnast() {
    syncBroadcastWithCurrentGymnast();
    currentBroadcastState.lowerThird.visible = true;
    pushBroadcastState();
}
```

#### 5. Controle de Overlays

```javascript
// Gerenciar estado de overlays individuais
function setOverlayState(overlayName, state) {
    const validOverlays = ['timer', 'scorecard', 'startlistMain', 'startlistCorner', 'results'];
    
    if (!validOverlays.includes(overlayName)) {
        console.warn('[Overlay] Invalid overlay:', overlayName);
        return;
    }
    
    // Atualizar estado local
    currentBroadcastState.overlays.widgets[overlayName] = state;
    
    // Computar dados do overlay se necessário
    if (state) {
        computeOverlayData(overlayName);
    }
    
    // Push para Firestore
    pushBroadcastState();
    
    // Log
    console.log(`[Overlay] ${overlayName}: ${state ? 'ON' : 'OFF'}`);
}

// Computar dados específicos de cada overlay
function computeOverlayData(overlayName) {
    const { phase, rotation, apparatus } = currentFullSelection;
    
    switch(overlayName) {
        case 'startlistMain':
        case 'startlistCorner':
            // Buscar lista de entrada
            const structureKey = `${phase}|${apparatus}`;
            const structure = allStartListStructures[structureKey];
            if (structure) {
                const gymnastIds = getGymnastListFromStructure(structure, rotation);
                const startList = gymnastIds.map((id, idx) => ({
                    position: idx + 1,
                    ...allGymnastData[id]
                }));
                
                // Enviar via BroadcastChannel para atualização imediata
                controlChannel.postMessage({
                    action: 'update-startlist',
                    list: startList,
                    type: overlayName === 'startlistMain' ? 'main' : 'corner'
                });
            }
            break;
            
        case 'results':
            // Calcular resultados consolidados
            const results = calculateConsolidatedResults(phase, apparatus);
            controlChannel.postMessage({
                action: 'update-results',
                results: results,
                apparatus: apparatus
            });
            break;
            
        case 'scorecard':
            // Enviar notas da ginasta atual
            const gymnast = currentGymnastList[currentIndex];
            if (gymnast && gymnast.scores) {
                controlChannel.postMessage({
                    action: 'update-scorecard',
                    scores: gymnast.scores[apparatus] || {}
                });
            }
            break;
    }
}
```

#### 6. Controles de Aquecimento (Warmup)

```javascript
// Estado do warmup
let warmupInterval = null;
let warmupTimeRemaining = 0;

// Iniciar aquecimento
function startWarmup(duration = 30) {
    warmupTimeRemaining = duration;
    
    // Enviar comando para stream
    controlChannel.postMessage({
        action: 'warmup-start',
        duration: duration
    });
    
    // Atualizar contador local
    warmupInterval = setInterval(() => {
        warmupTimeRemaining--;
        
        if (warmupTimeRemaining <= 0) {
            stopWarmup();
        } else {
            controlChannel.postMessage({
                action: 'warmup-update',
                timeRemaining: warmupTimeRemaining
            });
        }
    }, 1000);
    
    // Tocar beep de início
    controlChannel.postMessage({
        action: 'play-beep',
        type: 'warmup-start'
    });
}

// Parar aquecimento
function stopWarmup() {
    if (warmupInterval) {
        clearInterval(warmupInterval);
        warmupInterval = null;
    }
    
    controlChannel.postMessage({
        action: 'warmup-stop'
    });
    
    // Tocar beep de fim
    controlChannel.postMessage({
        action: 'play-beep',
        type: 'warmup-end'
    });
}
```

#### 7. Controles de Recurso (Inquiry)

```javascript
// Submeter recurso
function submitInquiry(apparatus, gymnastName) {
    const inquiryData = {
        apparatus: apparatus || currentFullSelection.apparatus,
        gymnast: gymnastName || getCurrentGymnastName(),
        timestamp: Date.now()
    };
    
    // Enviar para stream
    controlChannel.postMessage({
        action: 'inquiry-submit',
        data: inquiryData
    });
    
    // Salvar no Firestore para histórico
    db.collection('inquiries').add({
        ...inquiryData,
        phase: currentFullSelection.phase,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('[Inquiry] Submitted:', inquiryData);
}

// Resolver recurso
function resolveInquiry(accepted = false) {
    controlChannel.postMessage({
        action: 'inquiry-resolve',
        accepted: accepted
    });
}
```

### Inicialização e Firebase

```javascript
// Variáveis globais
let db = null;
let allStartListStructures = {};
let allGymnastData = {};

// Aguardar Firebase
async function initializeWhenReady() {
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.log('[Control] Waiting for Firebase to initialize...');
        setTimeout(initializeWhenReady, 100);
        return;
    }

    if (window.db) {
        db = window.db;
        console.log('[Control] Firebase connected successfully');
        
        // Inicializar listeners
        listenToStartLists();
        listenToGymnasts();
        loadPhaseOptions();
        
    } else {
        console.error('[Control] Firebase db not available');
        setTimeout(initializeWhenReady, 100);
    }
}

// Listener de Start Lists
function listenToStartLists() {
    db.collection('start_lists').onSnapshot(snapshot => {
        allStartListStructures = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const key = `${data.phase}|${data.apparatus}`;
            allStartListStructures[key] = data;
        });
        console.log('[Control] Start lists carregados:', Object.keys(allStartListStructures).length);
    });
}

// Listener de Ginastas
function listenToGymnasts() {
    db.collection('new_gymnasts').onSnapshot(snapshot => {
        allGymnastData = {};
        snapshot.forEach(doc => {
            allGymnastData[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });
        console.log('[Control] Loaded', Object.keys(allGymnastData).length, 'gymnasts');
    });
}

// Iniciar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Control] DOM Ready, waiting for Firebase...');
    
    // Aguardar evento customizado do firebase-init.js
    window.addEventListener('firebaseReady', initializeWhenReady);
    
    // Fallback: tentar após delay
    setTimeout(initializeWhenReady, 1000);
});
```

### CSS Customizado do stcontrol.html

```css
/* Container Principal */
.control-container {
    min-height: 100vh;
    background: var(--bg-dark);
    color: var(--text-primary);
    font-family: 'Montserrat', sans-serif;
}

/* Header */
.control-header {
    background: linear-gradient(135deg, var(--primary-dark), var(--primary));
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.control-header h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
}

/* Status Indicators */
.status-indicators {
    display: flex;
    gap: 1rem;
}

.status {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.1);
}

.status.firebase {
    background: var(--accent);
    color: var(--bg-dark);
}

.status.stream {
    background: var(--primary-light);
    color: var(--bg-dark);
}

/* Main Grid */
.control-main {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
}

/* Sections */
section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
}

section h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: var(--primary-light);
}

/* Botões */
.btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn:hover {
    background: var(--primary-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.btn:active {
    transform: translateY(0);
}

.btn-secondary {
    background: var(--surface);
    border: 2px solid var(--primary);
    color: var(--primary);
}

.btn-danger {
    background: #ef4444;
}

.btn-danger:hover {
    background: #dc2626;
}

/* Gymnast Card */
.gymnast-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(34, 197, 94, 0.1);
    border: 2px solid var(--primary);
    border-radius: 8px;
}

.flag-icon {
    font-size: 2rem;
}

.gymnast-info {
    flex: 1;
}

.gymnast-info strong {
    display: block;
    font-size: 1.25rem;
    color: var(--text-primary);
}

.gymnast-info small {
    color: var(--text-secondary);
}

/* Timer Display */
.timer-display {
    font-family: 'Orbitron', monospace;
    font-size: 3rem;
    font-weight: 700;
    text-align: center;
    padding: 1rem;
    border-radius: 8px;
    background: var(--bg-dark);
}

.timer-display.status-ok {
    color: var(--primary-light);
}

.timer-display.status-warn {
    color: var(--accent);
    animation: pulse-warn 1s ease-in-out infinite;
}

.timer-display.status-over {
    color: #ef4444;
    animation: pulse-danger 0.5s ease-in-out infinite;
}

@keyframes pulse-warn {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

@keyframes pulse-danger {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Overlay Controls Grid */
.overlay-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
}

.overlay-btn {
    padding: 1rem;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.overlay-btn:hover {
    border-color: var(--primary);
    background: rgba(34, 197, 94, 0.1);
}

.overlay-btn.active {
    border-color: var(--primary);
    background: var(--primary);
    color: white;
}
```

---

### Sistema de Overlays em Detalhe

O stcontrol.html gerencia 7 tipos diferentes de overlays, cada um com características próprias:

#### 1. Timer Overlay (Widget Cronômetro)

**Ativação:** Automática ao pressionar "Iniciar Timer"

**Funcionamento:**
```javascript
// Fluxo completo do timer
function startTimer() {
    // 1. Determinar aparelho e thresholds
    const apparatus = currentFullSelection.apparatus; // 'vt', 'ub', 'bb', 'fx'
    const thresholds = TIMER_THRESHOLDS[apparatus];
    
    // 2. Iniciar contagem
    timerStartTime = Date.now();
    timerElapsed = 0;
    
    // 3. Loop de atualização (10x/segundo)
    timerInterval = setInterval(() => {
        timerElapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        
        // 4. Atualizar display local
        updateTimerDisplay(timerElapsed, thresholds);
        
        // 5. Enviar para stream
        controlChannel.postMessage({
            action: 'timer-update',
            elapsed: timerElapsed,
            thresholds: thresholds
        });
    }, 100);
    
    // 6. Ativar overlay no stream
    setOverlayState('timer', true);
    
    // 7. Beep sonoro
    controlChannel.postMessage({
        action: 'play-beep',
        type: 'start'
    });
}
```

**Thresholds por Aparelho:**
| Aparelho | Tempo Máximo | Aviso (Warning) |
|----------|--------------|-----------------|
| VT       | 30s          | 25s             |
| UB       | 30s          | 25s             |
| BB       | 90s          | 80s             |
| FX       | 90s          | 80s             |

**Estados Visuais:**
- `status-ok` (verde): 0s até threshold de aviso
- `status-warn` (dourado pulsante): threshold de aviso até máximo
- `status-over` (vermelho pulsante rápido): acima do máximo

**Ocultação:** Automática 10s após parar, ou manual

---

#### 2. Scorecard Overlay (Painel de Notas)

**Ativação:** Botão "Mostrar Notas" no grid de overlays

**Dados Exibidos:**
```javascript
{
    dScore: 5.8,        // Nota D (Dificuldade)
    eScore: 8.633,      // Nota E (Execução)
    penalty: 0.0,       // Penalidade
    total: 14.433       // Total = D + E - penalty
}
```

**Fluxo de Dados:**
```javascript
function setOverlayState('scorecard', true) {
    // 1. Obter ginasta atual
    const gymnast = currentGymnastList[currentIndex];
    
    // 2. Extrair notas do aparelho
    const scores = gymnast.scores[currentFullSelection.apparatus];
    
    // 3. Enviar para stream via BroadcastChannel
    controlChannel.postMessage({
        action: 'update-scorecard',
        scores: {
            dScore: scores.d || 0,
            eScore: scores.e || 0,
            penalty: scores.penalty || 0,
            total: scores.total || 0
        },
        gymnast: {
            name: gymnast.name,
            surname: gymnast.surname,
            country: gymnast.country
        }
    });
    
    // 4. Atualizar Firestore
    pushBroadcastState();
}
```

**Design no Stream:**
- Background: Glassmorphism com verde (#22c55e) opacity 20%
- Tipografia: Orbitron 900 para números, Montserrat 700 para labels
- Animação: fade-in 0.4s, slide-up 15px
- Posicionamento: Centro-superior da tela

---

#### 3. StartList Main (Lista de Entrada Principal)

**Ativação:** Botão "Lista Entrada (Principal)"

**Características:**
- **Posição:** Centro da tela, overlay completo
- **Animação:** Cascata (cada ginasta com delay de 100ms)
- **Capacidade:** Até 8 ginastas por rotação
- **Dados por Ginasta:**
  ```javascript
  {
      position: 1,           // Ordem de entrada
      name: "Rebeca",
      surname: "ANDRADE",
      country: "Brazil",
      countryCode: "BRA",
      flag: "🇧🇷"
  }
  ```

**Computação da Lista:**
```javascript
function computeOverlayData('startlistMain') {
    // 1. Montar chave da estrutura
    const { phase, rotation, apparatus } = currentFullSelection;
    const structureKey = `${phase}|${apparatus}`;
    
    // 2. Buscar estrutura no cache
    const structure = allStartListStructures[structureKey];
    if (!structure) return;
    
    // 3. Extrair IDs da rotação específica
    const gymnastIds = getGymnastListFromStructure(structure, rotation);
    
    // 4. Mapear dados completos
    const startList = gymnastIds.map((id, idx) => {
        const gymnast = allGymnastData[id];
        const countryInfo = getCountryInfo(gymnast.country);
        
        return {
            position: idx + 1,
            name: gymnast.name,
            surname: gymnast.surname,
            country: countryInfo.name,
            countryCode: countryInfo.code,
            flag: countryInfo.flag
        };
    });
    
    // 5. Enviar para stream
    controlChannel.postMessage({
        action: 'update-startlist',
        list: startList,
        type: 'main',
        apparatus: apparatus,
        rotation: rotation
    });
}
```

**Animação CSS (no stream):**
```css
.startlist-main .gymnast-row {
    opacity: 0;
    transform: translateX(-50px);
    animation: cascade-in 0.5s ease forwards;
}

.startlist-main .gymnast-row:nth-child(1) { animation-delay: 0ms; }
.startlist-main .gymnast-row:nth-child(2) { animation-delay: 100ms; }
.startlist-main .gymnast-row:nth-child(3) { animation-delay: 200ms; }
/* ... até 8 */

@keyframes cascade-in {
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
```

---

#### 4. StartList Corner (Lista de Entrada Canto)

**Diferenças vs Main:**
- **Posição:** Canto inferior direito
- **Tamanho:** 30% da largura da tela
- **Opacidade:** Background com opacity 15% (menos intrusivo)
- **Uso:** Exibição durante competição enquanto ginastas se apresentam

**Layout:**
```
┌─────────────────────────┐
│ PRÓXIMAS GINASTAS       │
├─────────────────────────┤
│ 1. 🇧🇷 ANDRADE Rebeca  │
│ 2. 🇺🇸 BILES Simone    │
│ 3. 🇨🇳 TANG Xijing     │
│ ...                     │
└─────────────────────────┘
```

**Toggle:** Pode ficar permanentemente visível, ao contrário do Main que é temporário

---

#### 5. Results Overlay (Resultados Consolidados)

**Ativação:** Botão "Mostrar Resultados"

**Computação Complexa:**
```javascript
function calculateConsolidatedResults(phase, apparatus) {
    // 1. Filtrar ginastas da fase/aparelho
    const relevantGymnasts = Object.values(allGymnastData).filter(g => {
        return g.scores && g.scores[apparatus] && g.scores[apparatus].total > 0;
    });
    
    // 2. Ordenar por total (decrescente)
    relevantGymnasts.sort((a, b) => {
        const scoreA = a.scores[apparatus].total || 0;
        const scoreB = b.scores[apparatus].total || 0;
        return scoreB - scoreA;
    });
    
    // 3. Formatar dados para exibição
    const results = relevantGymnasts.map((gymnast, idx) => {
        const score = gymnast.scores[apparatus];
        const countryInfo = getCountryInfo(gymnast.country);
        
        return {
            rank: idx + 1,
            name: gymnast.name,
            surname: gymnast.surname,
            country: countryInfo.name,
            countryCode: countryInfo.code,
            flag: countryInfo.flag,
            dScore: score.d,
            eScore: score.e,
            penalty: score.penalty || 0,
            total: score.total
        };
    });
    
    return results;
}
```

**Tabela no Stream:**
| Pos | Atleta | País | D | E | Ded | Total |
|-----|--------|------|---|---|-----|-------|
| 1 | BILES Simone | 🇺🇸 USA | 6.4 | 9.100 | 0.0 | **15.500** |
| 2 | ANDRADE Rebeca | 🇧🇷 BRA | 5.8 | 8.633 | 0.0 | **14.433** |
| 3 | TANG Xijing | 🇨🇳 CHN | 6.0 | 8.366 | 0.0 | **14.366** |

**Animações:**
- Fade-in da tabela: 0.5s
- Highlight da medalha de ouro: Glow dourado pulsante
- Rows com zebra striping (background alternado)

---

#### 6. Warmup Overlay (Modal de Aquecimento)

**Ativação:** Botões de duração pré-definida (30s, 1min, 2min)

**Interface no stcontrol:**
```html
<div class="warmup-section">
    <h2>⏱️ Aquecimento</h2>
    <div class="warmup-controls">
        <button onclick="startWarmup(30)">30 segundos</button>
        <button onclick="startWarmup(60)">1 minuto</button>
        <button onclick="startWarmup(120)">2 minutos</button>
        <button onclick="stopWarmup()" class="btn-danger">Parar</button>
    </div>
    <div id="warmup-display">--:--</div>
</div>
```

**Funcionamento:**
```javascript
let warmupInterval = null;
let warmupTimeRemaining = 0;

function startWarmup(duration) {
    warmupTimeRemaining = duration;
    
    // 1. Enviar para stream
    controlChannel.postMessage({
        action: 'warmup-start',
        duration: duration
    });
    
    // 2. Countdown local + sync
    warmupInterval = setInterval(() => {
        warmupTimeRemaining--;
        
        // Atualizar display local
        updateWarmupDisplay(warmupTimeRemaining);
        
        // Sync com stream
        controlChannel.postMessage({
            action: 'warmup-update',
            timeRemaining: warmupTimeRemaining
        });
        
        // Finalizar se atingir zero
        if (warmupTimeRemaining <= 0) {
            stopWarmup();
        }
    }, 1000);
    
    // 3. Beep de início
    controlChannel.postMessage({
        action: 'play-beep',
        type: 'warmup-start'
    });
}

function stopWarmup() {
    clearInterval(warmupInterval);
    
    controlChannel.postMessage({
        action: 'warmup-stop'
    });
    
    // Beep de fim
    controlChannel.postMessage({
        action: 'play-beep',
        type: 'warmup-end'
    });
}
```

**Visual no Stream:**
- Modal centralizado com blur de fundo
- Tipografia: Orbitron 900 para countdown (tamanho 5rem)
- Progress ring circular animado
- Texto: "AQUECIMENTO" em Montserrat 800

---

#### 7. Inquiry Overlay (Modal de Recurso)

**Ativação:** Formulário de submissão no stcontrol

**Interface:**
```html
<div class="inquiry-section">
    <h2>⚖️ Recurso (Inquiry)</h2>
    <form onsubmit="submitInquiry(event)">
        <input type="text" id="inquiry-gymnast" placeholder="Nome da Ginasta" required>
        <select id="inquiry-apparatus">
            <option value="vt">Salto</option>
            <option value="ub">Barras Assimétricas</option>
            <option value="bb">Trave</option>
            <option value="fx">Solo</option>
        </select>
        <button type="submit" class="btn">Submeter Recurso</button>
    </form>
    
    <div class="inquiry-resolution" style="display:none;">
        <button onclick="resolveInquiry(true)" class="btn">Aceitar</button>
        <button onclick="resolveInquiry(false)" class="btn-danger">Rejeitar</button>
    </div>
</div>
```

**Fluxo Completo:**
```javascript
function submitInquiry(event) {
    event.preventDefault();
    
    const inquiryData = {
        apparatus: document.getElementById('inquiry-apparatus').value,
        gymnast: document.getElementById('inquiry-gymnast').value,
        timestamp: Date.now()
    };
    
    // 1. Enviar para stream (overlay)
    controlChannel.postMessage({
        action: 'inquiry-submit',
        data: inquiryData
    });
    
    // 2. Salvar no Firestore para histórico
    db.collection('inquiries').add({
        ...inquiryData,
        phase: currentFullSelection.phase,
        rotation: currentFullSelection.rotation,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    });
    
    // 3. Mostrar botões de resolução
    document.querySelector('.inquiry-resolution').style.display = 'flex';
}

function resolveInquiry(accepted) {
    // 1. Enviar resolução para stream
    controlChannel.postMessage({
        action: 'inquiry-resolve',
        accepted: accepted
    });
    
    // 2. Atualizar Firestore
    // (buscar último inquiry e atualizar status)
    
    // 3. Ocultar botões
    document.querySelector('.inquiry-resolution').style.display = 'none';
}
```

**Visual no Stream:**
- **Pending:** Modal amarelo com texto "RECURSO EM ANÁLISE"
- **Accepted:** Modal verde "RECURSO ACEITO" + ícone ✓
- **Rejected:** Modal vermelho "RECURSO NEGADO" + ícone ✗
- Auto-dismiss após 5s da resolução

---

## 🎬 Sistema de Transmissão (stream.html)

### Visão Geral

**Propósito:** Motor gráfico profissional para transmissão online com overlays dinâmicos e qualidade broadcast.

**Arquivo:** `public/stream.html`  
**Canais de Comunicação:** 
- `fx-control` BroadcastChannel (comandos do stcontrol)
- `sound-effects` BroadcastChannel (áudio)

**Firestore Listeners:**
- `broadcast/liveState` (estado da transmissão)
- `new_gymnasts` (dados das atletas)
- `start_lists` (listas de entrada)

**Responsabilidades:**
1. Renderizar overlays gráficos em tempo real
2. Ouvir comandos do stcontrol via BroadcastChannel
3. Sincronizar estado com Firestore
4. Tocar áudios (beeps, músicas)
5. Gerenciar animações e transições

---

### Arquitetura Interna

#### 1. Estrutura HTML Base

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manaus Gymnastics - Stream Overlay</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="/css/broadcast-theme.css">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background: transparent; /* Chroma key */
            overflow: hidden;
            font-family: 'Montserrat', sans-serif;
        }
        
        /* Container de overlays */
        #overlay-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none; /* Permite cliques através */
        }
    </style>
</head>
<body>
    <!-- Container Principal -->
    <div id="overlay-container">
        <!-- Lower Third -->
        <div id="lower-third" class="overlay hidden">
            <div class="lt-content">
                <span class="flag" id="lt-flag"></span>
                <div class="gymnast-info">
                    <div class="surname" id="lt-surname"></div>
                    <div class="name" id="lt-name"></div>
                    <div class="country" id="lt-country"></div>
                </div>
                <div class="apparatus-badge" id="lt-apparatus"></div>
                <div class="score-display" id="lt-score"></div>
            </div>
        </div>
        
        <!-- Timer Widget -->
        <div id="timer-widget" class="overlay hidden">
            <div class="timer-content">
                <div class="timer-value" id="timer-value">0:00</div>
                <div class="timer-label">TEMPO</div>
            </div>
        </div>
        
        <!-- Scorecard -->
        <div id="scorecard" class="overlay hidden">
            <!-- Implementação no próximo TODO -->
        </div>
        
        <!-- Start Lists -->
        <div id="startlist-main" class="overlay hidden"></div>
        <div id="startlist-corner" class="overlay hidden"></div>
        
        <!-- Results -->
        <div id="results" class="overlay hidden"></div>
        
        <!-- Warmup Modal -->
        <div id="warmup" class="overlay hidden"></div>
        
        <!-- Inquiry Modal -->
        <div id="inquiry" class="overlay hidden"></div>
    </div>
    
    <!-- Audio Elements -->
    <audio id="beep-start" src="/audio/beep.mp3" preload="auto"></audio>
    <audio id="warmup-music" src="/audio/warmup-music-1min.mp3" preload="auto"></audio>
    <audio id="warmup-end" src="/audio/warmup-end.mp3" preload="auto"></audio>
    
    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="/js/firebase-config.js"></script>
    
    <!-- Stream Engine -->
    <script src="/js/stream-engine.js"></script>
</body>
</html>
```

---

#### 2. Stream Engine (JavaScript)

**Variáveis Globais:**

```javascript
// Canais de Comunicação
const controlChannel = new BroadcastChannel('fx-control');
const soundChannel = new BroadcastChannel('sound-effects');

// Firebase
let db = null;

// Estado Local
let currentBroadcastState = {
    lowerThird: {
        visible: false,
        firstname: '',
        surname: '',
        country: '',
        countryCode: '',
        apparatus: ''
    },
    activeOverlays: {
        timer: false,
        scorecard: false,
        startlistMain: false,
        startlistCorner: false,
        results: false
    }
};

// Cache de dados
let gymnastCache = {};
let startListCache = {};

// Referências de áudio
const audioElements = {
    beepStart: null,
    warmupMusic: null,
    warmupEnd: null
};
```

**Inicialização:**

```javascript
// Aguardar Firebase
async function initStream() {
    console.log('[Stream] Initializing...');
    
    // Aguardar Firebase
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        setTimeout(initStream, 100);
        return;
    }
    
    db = firebase.firestore();
    console.log('[Stream] Firebase connected');
    
    // Inicializar listeners
    setupFirestoreListeners();
    setupBroadcastChannelListeners();
    setupAudioElements();
    
    console.log('[Stream] Ready');
}

// Iniciar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initStream);
```

---

#### 3. Firebase Listeners

```javascript
function setupFirestoreListeners() {
    // Listener: Estado da transmissão (liveState)
    db.collection('broadcast').doc('liveState')
        .onSnapshot(doc => {
            if (!doc.exists) return;
            
            const data = doc.data();
            console.log('[Stream] LiveState updated:', data);
            
            // Atualizar estado local
            if (data.lowerThird) {
                currentBroadcastState.lowerThird = data.lowerThird;
                renderLowerThird();
            }
            
            if (data.activeOverlays) {
                currentBroadcastState.activeOverlays = data.activeOverlays;
                syncOverlayVisibility();
            }
        }, error => {
            console.error('[Stream] Error listening to liveState:', error);
        });
    
    // Listener: Ginastas (cache)
    db.collection('new_gymnasts').onSnapshot(snapshot => {
        gymnastCache = {};
        snapshot.forEach(doc => {
            gymnastCache[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });
        console.log('[Stream] Gymnast cache updated:', Object.keys(gymnastCache).length);
    });
    
    // Listener: Start Lists (cache)
    db.collection('start_lists').onSnapshot(snapshot => {
        startListCache = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const key = `${data.phase}|${data.apparatus}`;
            startListCache[key] = data;
        });
        console.log('[Stream] Start list cache updated:', Object.keys(startListCache).length);
    });
}
```

---

#### 4. BroadcastChannel Listeners

```javascript
function setupBroadcastChannelListeners() {
    // Canal: fx-control (comandos do stcontrol)
    controlChannel.onmessage = (event) => {
        const { action, data } = event.data;
        console.log('[Stream] Received:', action, data);
        
        switch(action) {
            case 'timer-update':
                updateTimerDisplay(data.elapsed, data.thresholds);
                break;
                
            case 'timer-stop':
                stopTimerDisplay(data.finalTime);
                break;
                
            case 'update-scorecard':
                updateScorecard(data.scores, data.gymnast);
                break;
                
            case 'update-startlist':
                updateStartList(data.list, data.type);
                break;
                
            case 'update-results':
                updateResults(data.results, data.apparatus);
                break;
                
            case 'warmup-start':
                showWarmupModal(data.duration);
                break;
                
            case 'warmup-update':
                updateWarmupDisplay(data.timeRemaining);
                break;
                
            case 'warmup-stop':
                hideWarmupModal();
                break;
                
            case 'inquiry-submit':
                showInquiryModal(data.data);
                break;
                
            case 'inquiry-resolve':
                resolveInquiryModal(data.accepted);
                break;
                
            case 'play-beep':
                playBeep(data.type);
                break;
                
            default:
                console.warn('[Stream] Unknown action:', action);
        }
    };
    
    // Canal: sound-effects (áudio)
    soundChannel.onmessage = (event) => {
        const { action, file, volume } = event.data;
        
        if (action === 'play') {
            playAudio(file, volume);
        } else if (action === 'stop') {
            stopAudio(file);
        }
    };
}
```

---

#### 5. Sistema de Renderização de Overlays

**Sincronizar Visibilidade:**

```javascript
function syncOverlayVisibility() {
    const overlays = currentBroadcastState.activeOverlays;
    
    // Timer
    toggleOverlay('timer-widget', overlays.timer);
    
    // Scorecard
    toggleOverlay('scorecard', overlays.scorecard);
    
    // Start Lists
    toggleOverlay('startlist-main', overlays.startlistMain);
    toggleOverlay('startlist-corner', overlays.startlistCorner);
    
    // Results
    toggleOverlay('results', overlays.results);
}

function toggleOverlay(elementId, visible) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (visible) {
        element.classList.remove('hidden');
        element.classList.add('visible');
        // Trigger animation
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'fade-in 0.4s ease';
        }, 10);
    } else {
        element.classList.remove('visible');
        element.classList.add('hidden');
    }
}
```

**Renderizar Lower Third:**

```javascript
function renderLowerThird() {
    const lt = currentBroadcastState.lowerThird;
    
    // Atualizar conteúdo
    document.getElementById('lt-flag').textContent = getCountryFlag(lt.countryCode);
    document.getElementById('lt-surname').textContent = lt.surname;
    document.getElementById('lt-name').textContent = lt.firstname;
    document.getElementById('lt-country').textContent = lt.country;
    document.getElementById('lt-apparatus').textContent = lt.apparatus;
    
    // Buscar score da ginasta (se disponível)
    const gymnastId = findGymnastId(lt.surname, lt.firstname);
    if (gymnastId && gymnastCache[gymnastId]) {
        const gymnast = gymnastCache[gymnastId];
        const apparatusKey = lt.apparatus.toLowerCase();
        
        if (gymnast.scores && gymnast.scores[apparatusKey]) {
            const total = gymnast.scores[apparatusKey].total || 0;
            document.getElementById('lt-score').textContent = total.toFixed(3);
            document.getElementById('lt-score').style.display = 'block';
        } else {
            document.getElementById('lt-score').style.display = 'none';
        }
    }
    
    // Toggle visibilidade
    toggleOverlay('lower-third', lt.visible);
}
```

---

#### 6. Sistema de Áudio

```javascript
function setupAudioElements() {
    audioElements.beepStart = document.getElementById('beep-start');
    audioElements.warmupMusic = document.getElementById('warmup-music');
    audioElements.warmupEnd = document.getElementById('warmup-end');
    
    // Pré-carregar
    Object.values(audioElements).forEach(audio => {
        if (audio) audio.load();
    });
    
    console.log('[Stream] Audio elements ready');
}

function playBeep(type) {
    let audio = null;
    
    switch(type) {
        case 'start':
            audio = audioElements.beepStart;
            break;
        case 'warmup-start':
            audio = audioElements.warmupMusic;
            break;
        case 'warmup-end':
            audio = audioElements.warmupEnd;
            break;
    }
    
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => {
            console.warn('[Stream] Audio play failed:', err);
        });
    }
}

function playAudio(file, volume = 1.0) {
    const audio = new Audio(file);
    audio.volume = volume;
    audio.play();
}

function stopAudio(file) {
    // Implementar lógica de parar áudio específico
    // (requer manter referências dos áudios em execução)
}
```

---

#### 7. Utilitários

```javascript
// Buscar ID da ginasta por nome
function findGymnastId(surname, firstname) {
    for (const [id, gymnast] of Object.entries(gymnastCache)) {
        if (gymnast.surname === surname && gymnast.name === firstname) {
            return id;
        }
    }
    return null;
}

// Obter bandeira do país
function getCountryFlag(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// Obter informações do país
function getCountryInfo(countryName) {
    const countries = {
        'Brazil': { name: 'Brazil', code: 'BRA', flag: '🇧🇷' },
        'United States': { name: 'United States', code: 'USA', flag: '🇺🇸' },
        'China': { name: 'China', code: 'CHN', flag: '🇨🇳' },
        // ... todos os países
    };
    
    return countries[countryName] || { name: countryName, code: 'XXX', flag: '🏳️' };
}
```

---

### Fluxo de Dados Completo

**Exemplo: Exibir Lower Third com Score**

```
1. [stcontrol.html]
   → Usuário navega para ginasta "ANDRADE Rebeca"
   → Clica em "Ao Vivo"

2. [stcontrol.html - JavaScript]
   → syncBroadcastWithCurrentGymnast()
   → Atualiza currentBroadcastState.lowerThird
   → pushBroadcastState() → Firestore

3. [Firebase Firestore]
   → Document broadcast/liveState atualizado:
     {
       lowerThird: {
         visible: true,
         firstname: "Rebeca",
         surname: "ANDRADE",
         country: "Brazil",
         countryCode: "BRA",
         apparatus: "VT"
       }
     }

4. [stream.html - Firestore Listener]
   → onSnapshot detecta mudança
   → Atualiza currentBroadcastState local
   → Chama renderLowerThird()

5. [stream.html - renderLowerThird()]
   → Preenche elementos DOM:
     - lt-flag: 🇧🇷
     - lt-surname: ANDRADE
     - lt-name: Rebeca
     - lt-country: Brazil
     - lt-apparatus: VT
   → Busca score no gymnastCache
   → lt-score: 15.100
   → toggleOverlay('lower-third', true)

6. [stream.html - CSS Animation]
   → Classe 'hidden' removida
   → Classe 'visible' adicionada
   → Animação fade-in 0.4s executada
   → Lower third aparece suavemente na tela
```

---

## 🎨 Overlays e Animações do Stream

### Visão Geral

Todos os overlays seguem o padrão visual **FIG World Championships** com a paleta **Mundial (Verde + Branco + Dourado)**.

**CSS Global (broadcast-theme.css):**

```css
:root {
    /* Colors */
    --primary: #22c55e;          /* Green bright */
    --primary-dark: #16a34a;     /* Green dark */
    --primary-light: #4ade80;    /* Green light */
    --accent: #f7c948;           /* Gold */
    --text-primary: #ffffff;
    --text-secondary: #d1d5db;
    --bg-dark: #0f172a;
    --surface: #1e293b;
    --border: #334155;
    
    /* Typography */
    --font-body: 'Montserrat', sans-serif;
    --font-numbers: 'Orbitron', monospace;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
}

/* Base Overlay Styles */
.overlay {
    position: absolute;
    z-index: 1000;
    transition: all 0.4s ease;
}

.overlay.hidden {
    opacity: 0;
    pointer-events: none;
}

.overlay.visible {
    opacity: 1;
}

/* Glassmorphism Effect */
.glass {
    background: rgba(34, 197, 94, 0.15);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(34, 197, 94, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Animations */
@keyframes fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slide-in-bottom {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slide-in-top {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse-glow {
    0%, 100% {
        box-shadow: 0 0 20px rgba(247, 201, 72, 0.5);
    }
    50% {
        box-shadow: 0 0 40px rgba(247, 201, 72, 1);
    }
}
```

---

### 1. Lower Third Overlay

**Posição:** Parte inferior da tela (20% altura)  
**Duração Típica:** Permanente durante apresentação  
**Animação de Entrada:** slide-in-bottom 0.6s

**HTML:**

```html
<div id="lower-third" class="overlay hidden">
    <div class="lt-background glass"></div>
    <div class="lt-content">
        <span class="flag" id="lt-flag">🇧🇷</span>
        <div class="gymnast-info">
            <div class="surname" id="lt-surname">ANDRADE</div>
            <div class="name" id="lt-name">Rebeca</div>
            <div class="country" id="lt-country">Brazil</div>
        </div>
        <div class="apparatus-badge" id="lt-apparatus">VT</div>
        <div class="score-display" id="lt-score">15.100</div>
    </div>
</div>
```

**CSS:**

```css
#lower-third {
    bottom: 0;
    left: 0;
    width: 100%;
    height: 20%;
    animation: slide-in-bottom 0.6s ease;
}

.lt-background {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent);
}

.lt-content {
    position: relative;
    display: flex;
    align-items: center;
    padding: 2rem 3rem;
    gap: 2rem;
}

.lt-content .flag {
    font-size: 4rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

.gymnast-info {
    flex: 1;
}

.gymnast-info .surname {
    font-family: var(--font-body);
    font-size: 3rem;
    font-weight: 800;
    color: var(--text-primary);
    text-transform: uppercase;
    line-height: 1;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.gymnast-info .name {
    font-family: var(--font-body);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-top: 0.25rem;
}

.gymnast-info .country {
    font-family: var(--font-body);
    font-size: 1.2rem;
    font-weight: 400;
    color: var(--primary-light);
    margin-top: 0.5rem;
}

.apparatus-badge {
    background: var(--primary);
    color: white;
    font-family: var(--font-body);
    font-size: 2rem;
    font-weight: 800;
    padding: 1rem 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.score-display {
    font-family: var(--font-numbers);
    font-size: 4rem;
    font-weight: 900;
    color: var(--accent);
    text-shadow: 0 0 20px rgba(247, 201, 72, 0.8);
    display: none; /* Mostrar apenas quando score estiver disponível */
}

.score-display.visible {
    display: block;
    animation: pulse-glow 2s ease-in-out infinite;
}
```

**JavaScript:**

```javascript
function updateLowerThird(data) {
    document.getElementById('lt-flag').textContent = getCountryFlag(data.countryCode);
    document.getElementById('lt-surname').textContent = data.surname;
    document.getElementById('lt-name').textContent = data.firstname;
    document.getElementById('lt-country').textContent = data.country;
    document.getElementById('lt-apparatus').textContent = data.apparatus;
    
    // Score (opcional)
    if (data.score) {
        const scoreEl = document.getElementById('lt-score');
        scoreEl.textContent = data.score.toFixed(3);
        scoreEl.classList.add('visible');
    }
}
```

---

### 2. Timer Widget Overlay

**Posição:** Canto superior direito  
**Tamanho:** 200x100px  
**Animação de Entrada:** fade-in 0.3s

**HTML:**

```html
<div id="timer-widget" class="overlay hidden">
    <div class="timer-box glass">
        <div class="timer-value" id="timer-value">0:00</div>
        <div class="timer-label">TEMPO</div>
    </div>
</div>
```

**CSS:**

```css
#timer-widget {
    top: 2rem;
    right: 2rem;
    animation: fade-in 0.3s ease;
}

.timer-box {
    padding: 1.5rem 2rem;
    border-radius: 12px;
    text-align: center;
    min-width: 200px;
}

.timer-value {
    font-family: var(--font-numbers);
    font-size: 3rem;
    font-weight: 900;
    color: var(--primary-light);
    line-height: 1;
}

.timer-value.status-warn {
    color: var(--accent);
    animation: pulse-warn 1s ease-in-out infinite;
}

.timer-value.status-over {
    color: #ef4444;
    animation: pulse-danger 0.5s ease-in-out infinite;
}

.timer-label {
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    letter-spacing: 0.1em;
}

@keyframes pulse-warn {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes pulse-danger {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.1); }
}
```

**JavaScript:**

```javascript
function updateTimerDisplay(elapsed, thresholds) {
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const timerEl = document.getElementById('timer-value');
    timerEl.textContent = formatted;
    
    // Determinar status
    timerEl.classList.remove('status-warn', 'status-over');
    if (elapsed >= thresholds.max) {
        timerEl.classList.add('status-over');
    } else if (elapsed >= thresholds.warn) {
        timerEl.classList.add('status-warn');
    }
}
```

---

### 3. Scorecard Overlay

**Posição:** Centro-superior (30% da largura)  
**Animação de Entrada:** slide-in-top 0.5s

**HTML:**

```html
<div id="scorecard" class="overlay hidden">
    <div class="scorecard-container glass">
        <div class="scorecard-header">
            <span class="gymnast-name" id="sc-gymnast"></span>
            <span class="country-flag" id="sc-flag"></span>
        </div>
        <div class="scorecard-body">
            <div class="score-row">
                <span class="score-label">D</span>
                <span class="score-value" id="sc-d">0.000</span>
            </div>
            <div class="score-row">
                <span class="score-label">E</span>
                <span class="score-value" id="sc-e">0.000</span>
            </div>
            <div class="score-row penalty">
                <span class="score-label">Ded.</span>
                <span class="score-value" id="sc-penalty">0.000</span>
            </div>
            <div class="score-divider"></div>
            <div class="score-row total">
                <span class="score-label">TOTAL</span>
                <span class="score-value" id="sc-total">0.000</span>
            </div>
        </div>
    </div>
</div>
```

**CSS:**

```css
#scorecard {
    top: 5rem;
    left: 50%;
    transform: translateX(-50%);
    animation: slide-in-top 0.5s ease;
}

.scorecard-container {
    min-width: 400px;
    padding: 2rem;
    border-radius: 16px;
}

.scorecard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid rgba(34, 197, 94, 0.3);
}

.gymnast-name {
    font-family: var(--font-body);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.country-flag {
    font-size: 2rem;
}

.scorecard-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.score-label {
    font-family: var(--font-body);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-secondary);
}

.score-value {
    font-family: var(--font-numbers);
    font-size: 2rem;
    font-weight: 900;
    color: var(--primary-light);
}

.score-row.penalty .score-value {
    color: #ef4444;
}

.score-divider {
    height: 2px;
    background: var(--primary);
    margin: 0.5rem 0;
}

.score-row.total .score-label {
    font-size: 1.5rem;
    color: var(--text-primary);
}

.score-row.total .score-value {
    font-size: 3rem;
    color: var(--accent);
    text-shadow: 0 0 20px rgba(247, 201, 72, 0.8);
    animation: pulse-glow 2s ease-in-out infinite;
}
```

**JavaScript:**

```javascript
function updateScorecard(scores, gymnast) {
    document.getElementById('sc-gymnast').textContent = `${gymnast.surname} ${gymnast.name}`;
    document.getElementById('sc-flag').textContent = getCountryFlag(gymnast.country);
    document.getElementById('sc-d').textContent = scores.dScore.toFixed(1);
    document.getElementById('sc-e').textContent = scores.eScore.toFixed(3);
    document.getElementById('sc-penalty').textContent = scores.penalty.toFixed(1);
    document.getElementById('sc-total').textContent = scores.total.toFixed(3);
}
```

---

### 4. Start List Main Overlay (Cascading Animation)

**Posição:** Centro da tela  
**Animação:** Cascade (100ms delay entre cada item)

**HTML:**

```html
<div id="startlist-main" class="overlay hidden">
    <div class="startlist-container glass">
        <div class="startlist-header">
            <h2>ORDEM DE ENTRADA</h2>
            <span class="apparatus-badge" id="sl-apparatus">VT</span>
        </div>
        <div class="startlist-body" id="sl-body">
            <!-- Items gerados dinamicamente -->
        </div>
    </div>
</div>
```

**CSS:**

```css
#startlist-main {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.startlist-container {
    min-width: 600px;
    max-width: 800px;
    padding: 2rem;
    border-radius: 16px;
}

.startlist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 3px solid var(--primary);
}

.startlist-header h2 {
    font-family: var(--font-body);
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
}

.startlist-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.gymnast-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: rgba(30, 41, 59, 0.6);
    border-left: 4px solid var(--primary);
    border-radius: 8px;
    
    /* Animação cascade */
    opacity: 0;
    transform: translateX(-50px);
    animation: cascade-in 0.5s ease forwards;
}

.gymnast-row:nth-child(1) { animation-delay: 0ms; }
.gymnast-row:nth-child(2) { animation-delay: 100ms; }
.gymnast-row:nth-child(3) { animation-delay: 200ms; }
.gymnast-row:nth-child(4) { animation-delay: 300ms; }
.gymnast-row:nth-child(5) { animation-delay: 400ms; }
.gymnast-row:nth-child(6) { animation-delay: 500ms; }
.gymnast-row:nth-child(7) { animation-delay: 600ms; }
.gymnast-row:nth-child(8) { animation-delay: 700ms; }

@keyframes cascade-in {
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.gymnast-row .position {
    font-family: var(--font-numbers);
    font-size: 2rem;
    font-weight: 900;
    color: var(--primary-light);
    min-width: 3rem;
    text-align: center;
}

.gymnast-row .flag {
    font-size: 2rem;
}

.gymnast-row .info {
    flex: 1;
}

.gymnast-row .surname {
    font-family: var(--font-body);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.gymnast-row .name {
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 400;
    color: var(--text-secondary);
}
```

**JavaScript:**

```javascript
function updateStartList(list, type) {
    const bodyEl = document.getElementById('sl-body');
    bodyEl.innerHTML = ''; // Limpar
    
    list.forEach((gymnast, index) => {
        const row = document.createElement('div');
        row.className = 'gymnast-row';
        row.innerHTML = `
            <span class="position">${gymnast.position}</span>
            <span class="flag">${gymnast.flag}</span>
            <div class="info">
                <div class="surname">${gymnast.surname}</div>
                <div class="name">${gymnast.name}</div>
            </div>
        `;
        bodyEl.appendChild(row);
    });
    
    // Atualizar aparelho
    document.getElementById('sl-apparatus').textContent = list[0]?.apparatus || '';
}
```

---

### 5. Results Table Overlay

**Posição:** Centro da tela  
**Animação:** Fade-in completo + rows com zebra striping

**HTML:**

```html
<div id="results" class="overlay hidden">
    <div class="results-container glass">
        <div class="results-header">
            <h2>RESULTADOS</h2>
            <span class="apparatus-badge" id="res-apparatus"></span>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Atleta</th>
                    <th>País</th>
                    <th>D</th>
                    <th>E</th>
                    <th>Ded</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody id="res-body">
                <!-- Rows gerados dinamicamente -->
            </tbody>
        </table>
    </div>
</div>
```

**CSS:**

```css
.results-container {
    min-width: 900px;
    padding: 2rem;
    border-radius: 16px;
}

.results-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1.5rem;
}

.results-table thead {
    background: var(--primary);
    color: white;
}

.results-table th {
    padding: 1rem;
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 700;
    text-align: left;
}

.results-table tbody tr {
    border-bottom: 1px solid rgba(34, 197, 94, 0.2);
}

.results-table tbody tr:nth-child(odd) {
    background: rgba(30, 41, 59, 0.4);
}

.results-table tbody tr:nth-child(even) {
    background: rgba(30, 41, 59, 0.2);
}

.results-table tbody tr:first-child {
    background: linear-gradient(90deg, rgba(247, 201, 72, 0.3), transparent);
    border-left: 5px solid var(--accent);
}

.results-table tbody tr:first-child td {
    font-weight: 800;
    color: var(--accent);
}

.results-table td {
    padding: 1rem;
    font-family: var(--font-body);
    font-size: 1.1rem;
    color: var(--text-primary);
}

.results-table td:nth-child(4),
.results-table td:nth-child(5),
.results-table td:nth-child(6),
.results-table td:nth-child(7) {
    font-family: var(--font-numbers);
    font-weight: 700;
}

.results-table td:last-child {
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--primary-light);
}
```

---

### 6. Warmup Modal Overlay

**Posição:** Centro absoluto com backdrop blur  
**Animação:** Scale + fade-in

**HTML:**

```html
<div id="warmup" class="overlay hidden">
    <div class="modal-backdrop"></div>
    <div class="warmup-modal glass">
        <h2>AQUECIMENTO</h2>
        <div class="countdown-ring">
            <svg class="progress-ring" width="200" height="200">
                <circle class="progress-ring-circle" stroke="var(--primary)" stroke-width="8" fill="transparent" r="90" cx="100" cy="100"/>
            </svg>
            <div class="countdown-value" id="warmup-countdown">1:00</div>
        </div>
        <p class="warmup-instruction">Prepare-se para iniciar</p>
    </div>
</div>
```

**CSS:**

```css
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
}

.warmup-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 3rem;
    border-radius: 20px;
    text-align: center;
    animation: scale-in 0.4s ease;
}

@keyframes scale-in {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}

.warmup-modal h2 {
    font-family: var(--font-body);
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--primary-light);
    margin-bottom: 2rem;
}

.countdown-ring {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto;
}

.countdown-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: var(--font-numbers);
    font-size: 4rem;
    font-weight: 900;
    color: var(--accent);
    text-shadow: 0 0 30px rgba(247, 201, 72, 1);
}

.warmup-instruction {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-secondary);
    margin-top: 2rem;
}
```

---

### 7. Inquiry Modal Overlay

**Estados:** Pending (amarelo), Accepted (verde), Rejected (vermelho)

**HTML:**

```html
<div id="inquiry" class="overlay hidden">
    <div class="modal-backdrop"></div>
    <div class="inquiry-modal glass" id="inquiry-modal">
        <div class="inquiry-icon" id="inquiry-icon">⚖️</div>
        <h2 id="inquiry-title">RECURSO EM ANÁLISE</h2>
        <p class="inquiry-gymnast" id="inquiry-gymnast"></p>
        <p class="inquiry-apparatus" id="inquiry-apparatus"></p>
    </div>
</div>
```

**CSS:**

```css
.inquiry-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 3rem 4rem;
    border-radius: 20px;
    text-align: center;
    min-width: 500px;
    animation: scale-in 0.4s ease;
}

.inquiry-modal.pending {
    border: 3px solid var(--accent);
    background: rgba(247, 201, 72, 0.2);
}

.inquiry-modal.accepted {
    border: 3px solid var(--primary);
    background: rgba(34, 197, 94, 0.2);
}

.inquiry-modal.rejected {
    border: 3px solid #ef4444;
    background: rgba(239, 68, 68, 0.2);
}

.inquiry-icon {
    font-size: 5rem;
    margin-bottom: 1rem;
}

.inquiry-modal.accepted .inquiry-icon::before {
    content: '✓';
    color: var(--primary);
}

.inquiry-modal.rejected .inquiry-icon::before {
    content: '✗';
    color: #ef4444;
}

.inquiry-modal h2 {
    font-family: var(--font-body);
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 1rem;
}

.inquiry-modal.pending h2 { color: var(--accent); }
.inquiry-modal.accepted h2 { color: var(--primary); }
.inquiry-modal.rejected h2 { color: #ef4444; }

.inquiry-gymnast {
    font-family: var(--font-body);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.inquiry-apparatus {
    font-family: var(--font-body);
    font-size: 1.2rem;
    color: var(--text-secondary);
}
```

**JavaScript:**

```javascript
function showInquiryModal(data) {
    const modal = document.getElementById('inquiry-modal');
    modal.className = 'inquiry-modal glass pending';
    
    document.getElementById('inquiry-title').textContent = 'RECURSO EM ANÁLISE';
    document.getElementById('inquiry-gymnast').textContent = data.gymnast;
    document.getElementById('inquiry-apparatus').textContent = getApparatusName(data.apparatus);
    
    document.getElementById('inquiry').classList.remove('hidden');
    document.getElementById('inquiry').classList.add('visible');
}

function resolveInquiryModal(accepted) {
    const modal = document.getElementById('inquiry-modal');
    modal.className = `inquiry-modal glass ${accepted ? 'accepted' : 'rejected'}`;
    
    document.getElementById('inquiry-title').textContent = accepted ? 'RECURSO ACEITO' : 'RECURSO NEGADO';
    
    // Auto-dismiss após 5s
    setTimeout(() => {
        document.getElementById('inquiry').classList.remove('visible');
        document.getElementById('inquiry').classList.add('hidden');
    }, 5000);
}
```

---

## 🏟️ Sistema de Arena (display.html e control.html)

### Visão Geral

**Propósito:** Sistema original de telão da arena (anterior ao sistema de stream).

**Diferenças vs Sistema de Stream:**

| Característica | Arena (display/control) | Stream (stream/stcontrol) |
|----------------|-------------------------|---------------------------|
| **Público** | Presencial na arena | Online (broadcast) |
| **Overlays** | Scoreboards completos | Lower-third + widgets |
| **Design** | Fullscreen, minimalista | Overlay layers |
| **Canal BroadcastChannel** | `fx-control` | `fx-control` |
| **Firestore** | Sim (scoreboards collections) | Sim (broadcast/liveState) |
| **Controles de Áudio** | Sim | Sim |

---

### display.html - Telão da Arena

**Arquivos:** `public/display.html`  
**Dependências:**
- `css/theme-manaus.css` (paleta Mundial)
- `js/firebase-config.js`
- `js/script.js` (lógica de scoreboards)

**Estrutura HTML:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manaus Gymnastics - Display</title>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
    
    <!-- Theme -->
    <link rel="stylesheet" href="/css/theme-manaus.css">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            background: var(--bg-dark);
            font-family: 'Montserrat', sans-serif;
            color: var(--text-primary);
            overflow: hidden;
        }
        
        #scoreboard-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
    </style>
</head>
<body>
    <div id="scoreboard-container">
        <!-- Header -->
        <header class="display-header">
            <div class="logo">MANAUS GYMNASTICS 2025</div>
            <div class="phase-indicator" id="phase-display"></div>
            <div class="rotation-indicator" id="rotation-display"></div>
        </header>
        
        <!-- Main Scoreboard Area -->
        <main id="main-display">
            <!-- Conteúdo gerado dinamicamente -->
        </main>
        
        <!-- Footer -->
        <footer class="display-footer">
            <div class="sponsor-area">
                <!-- Logos de patrocinadores -->
            </div>
        </footer>
    </div>
    
    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="/js/firebase-config.js"></script>
    
    <!-- Display Logic -->
    <script src="/js/script.js"></script>
</body>
</html>
```

**Funcionalidades (script.js):**

```javascript
// Variáveis globais
let db = null;
const controlChannel = new BroadcastChannel('fx-control');

// Estado atual
let currentPhase = 'qualifiers';
let currentRotation = 1;
let currentApparatus = 'vt';

// Inicialização
async function initDisplay() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        setTimeout(initDisplay, 100);
        return;
    }
    
    db = firebase.firestore();
    console.log('[Display] Firebase connected');
    
    // Listeners
    setupFirestoreListeners();
    setupBroadcastChannelListeners();
    
    // Carregar scoreboard inicial
    loadScoreboard(currentPhase, currentRotation, currentApparatus);
}

// Listener Firestore: Scoreboards
function setupFirestoreListeners() {
    // Escutar mudanças em scoreboards
    db.collection('scoreboards').doc(currentPhase)
        .onSnapshot(doc => {
            if (!doc.exists) return;
            
            const data = doc.data();
            updateScoreboardDisplay(data);
        });
}

// Listener BroadcastChannel: Comandos do control.html
function setupBroadcastChannelListeners() {
    controlChannel.onmessage = (event) => {
        const { action, data } = event.data;
        
        switch(action) {
            case 'change-phase':
                currentPhase = data.phase;
                loadScoreboard(currentPhase, currentRotation, currentApparatus);
                break;
                
            case 'change-rotation':
                currentRotation = data.rotation;
                loadScoreboard(currentPhase, currentRotation, currentApparatus);
                break;
                
            case 'change-apparatus':
                currentApparatus = data.apparatus;
                loadScoreboard(currentPhase, currentRotation, currentApparatus);
                break;
                
            case 'refresh-scoreboard':
                loadScoreboard(currentPhase, currentRotation, currentApparatus);
                break;
        }
    };
}

// Carregar scoreboard
function loadScoreboard(phase, rotation, apparatus) {
    console.log(`[Display] Loading scoreboard: ${phase} | R${rotation} | ${apparatus}`);
    
    // Atualizar UI
    document.getElementById('phase-display').textContent = phase.toUpperCase();
    document.getElementById('rotation-display').textContent = `ROTAÇÃO ${rotation}`;
    
    // Buscar dados do Firestore
    db.collection('scoreboards')
        .where('phase', '==', phase)
        .where('apparatus', '==', apparatus)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.warn('[Display] No scoreboard data found');
                return;
            }
            
            const data = snapshot.docs[0].data();
            renderScoreboard(data);
        });
}

// Renderizar scoreboard
function renderScoreboard(data) {
    const mainDisplay = document.getElementById('main-display');
    mainDisplay.innerHTML = ''; // Limpar
    
    // Criar tabela de scores
    const table = document.createElement('table');
    table.className = 'scoreboard-table';
    
    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Pos</th>
            <th>Atleta</th>
            <th>País</th>
            <th>D</th>
            <th>E</th>
            <th>Pen</th>
            <th>Total</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    data.rankings.forEach((entry, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="rank">${idx + 1}</td>
            <td class="athlete">
                <span class="flag">${getCountryFlag(entry.countryCode)}</span>
                <span class="name">${entry.surname} ${entry.name}</span>
            </td>
            <td class="country">${entry.country}</td>
            <td class="score d-score">${entry.scores.d.toFixed(1)}</td>
            <td class="score e-score">${entry.scores.e.toFixed(3)}</td>
            <td class="score penalty">${entry.scores.penalty.toFixed(1)}</td>
            <td class="score total">${entry.scores.total.toFixed(3)}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    mainDisplay.appendChild(table);
}

// Iniciar
document.addEventListener('DOMContentLoaded', initDisplay);
```

**CSS (theme-manaus.css):**

```css
/* Display Header */
.display-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 4rem;
    background: linear-gradient(135deg, var(--primary-dark), var(--primary));
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.display-header .logo {
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
}

.phase-indicator,
.rotation-indicator {
    font-size: 1.5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
}

/* Scoreboard Table */
#main-display {
    flex: 1;
    padding: 3rem 4rem;
    overflow-y: auto;
}

.scoreboard-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Montserrat', sans-serif;
}

.scoreboard-table thead {
    background: var(--primary);
    color: white;
    position: sticky;
    top: 0;
    z-index: 10;
}

.scoreboard-table th {
    padding: 1.5rem 2rem;
    font-size: 1.25rem;
    font-weight: 700;
    text-align: left;
}

.scoreboard-table tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.3s ease;
}

.scoreboard-table tbody tr:hover {
    background: rgba(34, 197, 94, 0.1);
}

.scoreboard-table tbody tr:first-child {
    background: linear-gradient(90deg, rgba(247, 201, 72, 0.2), transparent);
    border-left: 5px solid var(--accent);
}

.scoreboard-table td {
    padding: 1.5rem 2rem;
    font-size: 1.25rem;
    color: var(--text-primary);
}

.scoreboard-table .rank {
    font-family: 'Orbitron', monospace;
    font-size: 2rem;
    font-weight: 900;
    color: var(--primary-light);
}

.scoreboard-table .athlete {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.scoreboard-table .flag {
    font-size: 2rem;
}

.scoreboard-table .name {
    font-weight: 700;
}

.scoreboard-table .score {
    font-family: 'Orbitron', monospace;
    font-weight: 700;
    text-align: center;
}

.scoreboard-table .total {
    font-size: 1.75rem;
    font-weight: 900;
    color: var(--accent);
}

/* Footer */
.display-footer {
    padding: 1.5rem 4rem;
    background: var(--surface);
    border-top: 2px solid var(--primary);
}
```

---

### control.html - Painel de Controle da Arena

**Arquivos:** `public/control.html`  
**Funcionalidades:**
- Seleção de fase, rotação, aparelho
- Comandos para atualizar display.html
- Controles de áudio

**Estrutura HTML:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Arena Control Panel</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="control-panel">
        <h1>Painel de Controle - Arena</h1>
        
        <!-- Seleção de Fase -->
        <section class="config-section">
            <h2>Configuração</h2>
            <label>
                Fase:
                <select id="phase-select">
                    <option value="qualifiers">Classificatórias</option>
                    <option value="aa-final">Final All-Around</option>
                    <option value="vt-final">Final Salto</option>
                    <option value="ub-final">Final Barras</option>
                    <option value="bb-final">Final Trave</option>
                    <option value="fx-final">Final Solo</option>
                </select>
            </label>
            
            <label>
                Rotação:
                <select id="rotation-select">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
            </label>
            
            <label>
                Aparelho:
                <select id="apparatus-select">
                    <option value="vt">Salto</option>
                    <option value="ub">Barras Assimétricas</option>
                    <option value="bb">Trave</option>
                    <option value="fx">Solo</option>
                </select>
            </label>
            
            <button onclick="applyConfig()">Aplicar</button>
        </section>
        
        <!-- Controles de Display -->
        <section class="display-controls">
            <h2>Controles de Display</h2>
            <button onclick="refreshScoreboard()">Atualizar Scoreboard</button>
            <button onclick="clearDisplay()">Limpar Telão</button>
        </section>
        
        <!-- Áudio -->
        <section class="audio-controls">
            <h2>Áudio</h2>
            <button onclick="playWarmupMusic()">Música de Aquecimento</button>
            <button onclick="playBeep()">Beep</button>
        </section>
    </div>
    
    <script src="/js/firebase-config.js"></script>
    <script>
        const controlChannel = new BroadcastChannel('fx-control');
        
        function applyConfig() {
            const phase = document.getElementById('phase-select').value;
            const rotation = parseInt(document.getElementById('rotation-select').value);
            const apparatus = document.getElementById('apparatus-select').value;
            
            controlChannel.postMessage({
                action: 'change-phase',
                data: { phase }
            });
            
            controlChannel.postMessage({
                action: 'change-rotation',
                data: { rotation }
            });
            
            controlChannel.postMessage({
                action: 'change-apparatus',
                data: { apparatus }
            });
        }
        
        function refreshScoreboard() {
            controlChannel.postMessage({
                action: 'refresh-scoreboard'
            });
        }
        
        function clearDisplay() {
            controlChannel.postMessage({
                action: 'clear-display'
            });
        }
        
        function playWarmupMusic() {
            controlChannel.postMessage({
                action: 'play-audio',
                data: { file: '/audio/warmup-music-1min.mp3' }
            });
        }
        
        function playBeep() {
            controlChannel.postMessage({
                action: 'play-beep',
                type: 'start'
            });
        }
    </script>
</body>
</html>
```

---

### Diferenças Técnicas: Arena vs Stream

**Arena (display.html):**
- ✅ Scoreboard completo (tabela fullscreen)
- ✅ Atualização via comandos BroadcastChannel
- ✅ Design minimalista para leitura à distância
- ❌ Sem overlays sobrepostos
- ❌ Sem lower-third

**Stream (stream.html):**
- ✅ Lower-third com score
- ✅ Widgets modulares (timer, scorecard, etc.)
- ✅ Overlays transparentes (chroma key)
- ✅ Sincronização via Firestore broadcast/liveState
- ✅ Animações cinematográficas

**Quando Usar Cada Um:**
- **Arena:** Telão físico da competição (presencial)
- **Stream:** Transmissão online (YouTube, OBS, etc.)

---

## 🔥 Integrações Firebase

### Visão Geral

O sistema utiliza **Firebase Firestore** como banco de dados NoSQL em tempo real.

**Serviços Utilizados:**
- **Firestore Database:** Armazenamento de dados
- **Firebase Authentication:** Gerenciamento de usuários
- **Firebase Hosting:** Hospedagem do site

---

### Estrutura Completa do Firestore

```
firestore
├── new_gymnasts (collection)
│   └── {gymnastId} (document)
│       ├── name: string
│       ├── surname: string
│       ├── country: string
│       ├── bibNumber: string
│       ├── scores: object
│       │   ├── vt: { d: number, e: number, penalty: number, total: number }
│       │   ├── ub: { d: number, e: number, penalty: number, total: number }
│       │   ├── bb: { d: number, e: number, penalty: number, total: number }
│       │   └── fx: { d: number, e: number, penalty: number, total: number }
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── start_lists (collection)
│   └── {listId} (document)
│       ├── phase: string ('qualifiers', 'aa-final', etc.)
│       ├── apparatus: string ('vt', 'ub', 'bb', 'fx')
│       ├── structure: object
│       │   ├── rotation1: array<gymnastId>
│       │   ├── rotation2: array<gymnastId>
│       │   ├── rotation3: array<gymnastId>
│       │   └── rotation4: array<gymnastId>
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── broadcast (collection)
│   └── liveState (document)
│       ├── lowerThird: object
│       │   ├── visible: boolean
│       │   ├── firstname: string
│       │   ├── surname: string
│       │   ├── country: string
│       │   ├── countryCode: string
│       │   └── apparatus: string
│       ├── activeOverlays: object
│       │   └── widgets: object
│       │       ├── timer: boolean
│       │       ├── scorecard: boolean
│       │       ├── startlistMain: boolean
│       │       ├── startlistCorner: boolean
│       │       └── results: boolean
│       └── timestamp: timestamp
│
├── scoreboards (collection)
│   └── {phase} (document)
│       ├── phase: string
│       ├── apparatus: string
│       ├── rankings: array<object>
│       │   └── {
│       │       name: string,
│       │       surname: string,
│       │       country: string,
│       │       countryCode: string,
│       │       scores: { d, e, penalty, total }
│       │     }
│       └── updatedAt: timestamp
│
├── inquiries (collection)
│   └── {inquiryId} (document)
│       ├── apparatus: string
│       ├── gymnast: string
│       ├── phase: string
│       ├── rotation: number
│       ├── timestamp: number
│       ├── status: string ('pending', 'accepted', 'rejected')
│       └── createdAt: timestamp
│
└── users (collection)
    └── {userId} (document)
        ├── email: string
        ├── role: string ('admin', 'control', 'judge-d', 'judge-e')
        ├── createdAt: timestamp
        └── lastLogin: timestamp
```

---

### Fluxo de Dados Completo

#### Exemplo: Atualizar Score de uma Ginasta

**Etapa 1: Edit Scores (edit-scores-qualifiers.html)**

```javascript
// Usuário insere notas
const gymnastId = 'abc123';
const apparatus = 'vt';
const scores = {
    d: 5.8,
    e: 8.633,
    penalty: 0.0,
    total: 14.433
};

// Salvar no Firestore
db.collection('new_gymnasts').doc(gymnastId).update({
    [`scores.${apparatus}`]: scores,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

**Etapa 2: Firestore Realtime Update**

```javascript
// Todos os listeners ativos detectam a mudança
db.collection('new_gymnasts').doc(gymnastId).onSnapshot(doc => {
    const data = doc.data();
    console.log('Score updated:', data.scores.vt);
    
    // Atualizar UI automaticamente
    updateGymnastDisplay(data);
});
```

**Etapa 3: stcontrol.html atualiza Lower Third**

```javascript
// Se a ginasta estiver ao vivo, atualizar score no lower-third
function syncBroadcastWithCurrentGymnast() {
    const gymnast = currentGymnastList[currentIndex];
    const scores = gymnast.scores[currentFullSelection.apparatus];
    
    currentBroadcastState.lowerThird = {
        visible: true,
        firstname: gymnast.name,
        surname: gymnast.surname,
        country: gymnast.country,
        countryCode: getCountryCode(gymnast.country),
        apparatus: currentFullSelection.apparatus,
        score: scores.total  // ← Novo score
    };
    
    pushBroadcastState();
}
```

**Etapa 4: stream.html renderiza Score**

```javascript
// Listener do Firestore detecta mudança
db.collection('broadcast').doc('liveState').onSnapshot(doc => {
    const data = doc.data();
    
    if (data.lowerThird) {
        renderLowerThird(data.lowerThird);
    }
});

function renderLowerThird(lt) {
    document.getElementById('lt-surname').textContent = lt.surname;
    document.getElementById('lt-name').textContent = lt.firstname;
    document.getElementById('lt-score').textContent = lt.score.toFixed(3);
    document.getElementById('lt-score').classList.add('visible');
    
    // Animação de glow
    document.getElementById('lt-score').style.animation = 'pulse-glow 2s ease-in-out infinite';
}
```

---

### Sincronização em Tempo Real

**Diagrama de Fluxo:**

```
[edit-scores.html]
       ↓ (Firestore update)
[Firestore: new_gymnasts]
       ↓ (onSnapshot trigger)
┌──────┴───────┬──────────┬──────────┐
↓              ↓          ↓          ↓
[stcontrol]  [stream]  [display]  [scoreboard]
       ↓              ↓
[Firestore: broadcast/liveState]
       ↓ (onSnapshot trigger)
   [stream.html]
       ↓
   [Renderização visual]
```

**Latência Típica:**
- Firestore onSnapshot: ~100-300ms
- BroadcastChannel: ~10-50ms
- Total (edit → stream visual): **~200-400ms**

---

### Security Rules (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Ginastas: Leitura pública, escrita autenticada
    match /new_gymnasts/{gymnastId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'control']);
    }
    
    // Start Lists: Leitura pública, escrita apenas admin
    match /start_lists/{listId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Broadcast State: Leitura pública, escrita por control
    match /broadcast/liveState {
      allow read: if true;
      allow write: if request.auth != null && 
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'control']);
    }
    
    // Scoreboards: Leitura pública, escrita autenticada
    match /scoreboards/{phase} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Inquiries: Apenas controle e admin
    match /inquiries/{inquiryId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'control']);
      allow update, delete: if request.auth != null && 
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users: Apenas admin pode gerenciar
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

### Firebase Configuration (firebase-config.js)

```javascript
// Configuração do Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "manaus-gymnastics.firebaseapp.com",
    projectId: "manaus-gymnastics",
    storageBucket: "manaus-gymnastics.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized');
} else {
    console.log('[Firebase] Already initialized');
}

// Exportar serviços
const db = firebase.firestore();
const auth = firebase.auth();

// Emitir evento de prontidão
window.dispatchEvent(new Event('firebaseReady'));

// Disponibilizar globalmente
window.db = db;
window.auth = auth;
```

---

### Listeners Pattern (Boas Práticas)

**✅ Padrão Correto:**

```javascript
let unsubscribe = null;

function setupListener() {
    // Remover listener anterior (evitar duplicatas)
    if (unsubscribe) unsubscribe();
    
    // Criar novo listener
    unsubscribe = db.collection('new_gymnasts').onSnapshot(snapshot => {
        snapshot.forEach(doc => {
            console.log('Gymnast updated:', doc.id, doc.data());
        });
    }, error => {
        console.error('[Firestore] Listener error:', error);
    });
}

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    if (unsubscribe) unsubscribe();
});
```

**❌ Padrão Incorreto (memory leak):**

```javascript
// EVITAR: Listener sem cleanup
db.collection('new_gymnasts').onSnapshot(snapshot => {
    // Processamento...
});
// ← Listener continua ativo indefinidamente
```

---

### Otimizações de Performance

**1. Cache Local (allGymnastData)**

```javascript
// Cache em memória para evitar queries repetidas
let allGymnastData = {};

db.collection('new_gymnasts').onSnapshot(snapshot => {
    allGymnastData = {};
    snapshot.forEach(doc => {
        allGymnastData[doc.id] = {
            id: doc.id,
            ...doc.data()
        };
    });
    console.log('[Cache] Loaded', Object.keys(allGymnastData).length, 'gymnasts');
});

// Uso posterior (sem query adicional)
const gymnast = allGymnastData['abc123'];
```

**2. Índices Compostos**

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "new_gymnasts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "country", "order": "ASCENDING" },
        { "fieldPath": "scores.vt.total", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "start_lists",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "phase", "order": "ASCENDING" },
        { "fieldPath": "apparatus", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**3. Batch Writes (Atualizações em Lote)**

```javascript
// Atualizar múltiplas ginastas de uma vez
const batch = db.batch();

gymnastIds.forEach(id => {
    const ref = db.collection('new_gymnasts').doc(id);
    batch.update(ref, {
        'scores.vt.penalty': 0.1,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
});

await batch.commit();
console.log('Batch update completed');
```

---

## 🚀 Guia de Deployment

### Pré-requisitos

- Node.js 18+ instalado
- Firebase CLI instalado: `npm install -g firebase-tools`
- Projeto Firebase criado no console

---

### 1. Setup Inicial do Firebase

**Login:**

```bash
firebase login
```

**Inicializar projeto:**

```bash
cd c:\Users\bryan\OneDrive\Desktop\manaus-gymnastics
firebase init
```

**Selecionar:**
- ✅ Firestore
- ✅ Hosting
- ❌ Functions (não utilizado)
- ❌ Storage (não utilizado)

**Configurar:**
- Public directory: `public`
- Configure as single-page app: `No`
- GitHub deploys: `No`

---

### 2. Deploy do Firestore Rules

**Arquivo:** `firestore.rules`

```bash
firebase deploy --only firestore:rules
```

**Validar:**

```bash
firebase firestore:rules:list
```

---

### 3. Deploy dos Indexes

**Arquivo:** `firestore.indexes.json`

```bash
firebase deploy --only firestore:indexes
```

**Verificar no Console:**
- Acesse: https://console.firebase.google.com
- Firestore Database → Indexes

---

### 4. Deploy do Site (Hosting)

**Build (se necessário):**

```bash
# Nenhum build necessário (projeto vanilla JS)
```

**Deploy:**

```bash
firebase deploy --only hosting
```

**URL do site:**
```
https://manaus-gymnastics.web.app
```

---

### 5. Variáveis de Ambiente

**Criar arquivo:** `public/js/firebase-config.js`

```javascript
// PRODUÇÃO
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "manaus-gymnastics.firebaseapp.com",
    projectId: "manaus-gymnastics",
    storageBucket: "manaus-gymnastics.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
```

**Configurar no Firebase Hosting:**

```bash
firebase functions:config:set firebase.api_key="YOUR_KEY"
```

---

### 6. Testes de Integração

**Teste 1: Firestore Connection**

```bash
# Abrir console do navegador
# https://manaus-gymnastics.web.app/debug-firebase.html
```

```javascript
// Verificar se db está conectado
console.log(window.db);

// Tentar ler new_gymnasts
db.collection('new_gymnasts').limit(1).get()
    .then(snapshot => {
        console.log('✅ Firestore OK:', snapshot.size);
    })
    .catch(err => {
        console.error('❌ Firestore Error:', err);
    });
```

**Teste 2: BroadcastChannel**

```bash
# Abrir stcontrol.html e stream.html em abas separadas
```

```javascript
// Em stcontrol.html console:
controlChannel.postMessage({ action: 'test', data: 'Hello Stream' });

// Em stream.html console (deve aparecer):
// [Stream] Received: test { data: 'Hello Stream' }
```

**Teste 3: Realtime Updates**

```bash
# 1. Abrir stream.html
# 2. Abrir edit-scores-qualifiers.html
# 3. Editar nota de uma ginasta
# 4. Verificar se stream.html atualiza automaticamente
```

---

### 7. Comandos Úteis

**Ver logs:**

```bash
firebase hosting:channel:list
```

**Preview antes de deploy:**

```bash
firebase hosting:channel:deploy preview
```

**Reverter deploy:**

```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

**Limpar cache:**

```bash
firebase hosting:channel:delete CHANNEL_ID
```

---

### 8. Troubleshooting

**Problema: "Permission denied" ao ler/escrever no Firestore**

**Solução:**
1. Verificar `firestore.rules`
2. Confirmar que usuário está autenticado
3. Verificar role do usuário em `users` collection

**Problema: "BroadcastChannel não funciona entre abas"**

**Solução:**
1. Verificar se ambas as abas estão no mesmo domínio
2. Testar em modo anônimo (extensões podem bloquear)
3. Verificar console por erros de CORS

**Problema: "Firebase not initialized"**

**Solução:**
1. Verificar se `firebase-config.js` está carregando antes de outros scripts
2. Adicionar listener para evento `firebaseReady`:

```javascript
window.addEventListener('firebaseReady', () => {
    console.log('[App] Firebase ready, initializing...');
    init();
});
```

---

## 📝 Resumo Final

### Arquitetura Completa

```
┌─────────────────────────────────────────────────┐
│             FIREBASE FIRESTORE                  │
│  new_gymnasts | start_lists | broadcast/liveState│
└──────────────────┬──────────────────────────────┘
                   │ (Realtime listeners)
        ┌──────────┴─────────┬────────────┐
        ↓                    ↓            ↓
┌───────────────┐    ┌──────────────┐  ┌─────────────┐
│  stcontrol    │←──→│   stream     │  │  display    │
│  .html        │    │   .html      │  │  .html      │
└───────────────┘    └──────────────┘  └─────────────┘
        │ (BroadcastChannel: fx-control)     │
        └────────────────┬───────────────────┘
                         ↓
              ┌──────────────────┐
              │  Broadcast Video │
              │   (OBS/YouTube)  │
              └──────────────────┘
```

### Stack Tecnológico

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Database:** Firebase Firestore (NoSQL realtime)
- **Auth:** Firebase Authentication
- **Hosting:** Firebase Hosting
- **Communication:** BroadcastChannel API
- **Fonts:** Google Fonts (Montserrat + Orbitron)
- **Design System:** Mundial Green (#22c55e) + Gold (#f7c948)

### Principais Features

✅ **stcontrol.html:** Painel de controle TV com lower-third, timer, overlays  
✅ **stream.html:** Motor gráfico de overlays para broadcast  
✅ **display.html:** Telão da arena com scoreboards  
✅ **Realtime sync:** Firestore onSnapshot listeners  
✅ **7 overlays:** Timer, Scorecard, Lists, Results, Warmup, Inquiry  
✅ **Animações:** Cascading, fade-in, pulse-glow, scale-in  
✅ **Áudio:** Beeps, warmup music, end signals  
✅ **Security:** Firestore rules com role-based access  

---

**Documentação criada em:** {{ date }}  
**Versão do sistema:** 2.0  
**Última atualização:** {{ timestamp }}
```


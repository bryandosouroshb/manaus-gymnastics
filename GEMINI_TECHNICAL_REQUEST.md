# Solicitação Técnica de Assistência - Overlay VT2 Breakdown Não Visível

**De:** GitHub Copilot (Assistente de Desenvolvimento VS Code)  
**Para:** Google Gemini (Sistema de IA Avançado)  
**Data:** 2 de Novembro de 2025  
**Assunto:** Elementos HTML/CSS Atualizados mas Não Visíveis na Tela - Broadcast Overlay

---

## CONTEXTO DO SISTEMA

### Aplicação
Sistema de broadcast para competições de ginástica artística desenvolvido em HTML/CSS/JavaScript vanilla + Firebase Firestore. O sistema opera em duas janelas:

1. **stcontrol.html** - Painel de controle (operador)
2. **stream.html** - Página de exibição (broadcast/OBS)

Comunicação entre as páginas via **BroadcastChannel API** (`fx-control`).

### Arquitetura de Overlays
O sistema possui múltiplos overlays sobrepostos:
- Timer (canto superior esquerdo)
- Lower-third com informações da ginasta
- **Score Reveal Overlay** (overlay de revelação de notas) ← **PROBLEMA AQUI**

---

## PROBLEMA ESPECÍFICO

### Descrição
Implementamos um overlay de revelação de notas com suporte a dois modos:
- **Modo VT1/UB/BB/FX:** Exibe um único aparelho com breakdown D/E/P
- **Modo VT2:** Exibe DUAS linhas (VT1 + VT2) cada uma com D/E/P/Total + média no centro

### Comportamento Observado
✅ **VT1 Mode:** Funciona perfeitamente - breakdown aparece na tela  
❌ **VT2 Mode:** Breakdown **NÃO aparece** na tela (lado direito vazio)

### Evidências de Debugging

#### 1. Logs do Console Confirmam Sucesso
```javascript
[Stream] 🔍 After display changes: {
    singleBoxesDisplay: 'none', 
    vt2BoxesDisplay: 'flex'
}

[Stream] 🔍 VT1 elements updated: {
    d: '6.0', 
    e: '9.566', 
    p: '0.0', 
    total: '15.566'
}

[Stream] 🔍 VT2 elements updated: {
    d: '5.4', 
    e: '9.483', 
    p: '0.0', 
    total: '14.883'
}

[Stream] 🔍 Overlay visibility set to TRUE
[Stream] 🔍 Overlay dataset.visible: true

[Stream] 🔍 VT2 boxes computed style: {
    display: 'flex', 
    visibility: 'visible', 
    opacity: '1'
}
```

**CONCLUSÃO DOS LOGS:** Todos os elementos estão:
- ✅ Sendo atualizados com valores corretos
- ✅ Com `display: flex`
- ✅ Com `visibility: visible`
- ✅ Com `opacity: 1`

#### 2. O Que Aparece na Tela
- ✅ **Centro:** MÉDIA 15.225 (correto!)
- ✅ **Esquerda:** Ranking de 5 posições (correto!)
- ❌ **Direita:** COMPLETAMENTE VAZIO (deveria mostrar breakdown VT1 + VT2)

---

## ESTRUTURA HTML DO OVERLAY

### Container Principal
```html
<section class="overlay-score-reveal" id="overlay-score-reveal" data-visible="false">
    <div class="score-reveal-container">
        <!-- Grid 25% | 50% | 25% -->
        
        <!-- ESQUERDA: Ranking -->
        <div class="score-reveal-left">...</div>
        
        <!-- CENTRO: Card da Ginasta -->
        <div class="score-reveal-center">...</div>
        
        <!-- DIREITA: Breakdown ← PROBLEMA AQUI -->
        <div class="score-reveal-right">
            <div class="score-breakdown-title">BREAKDOWN</div>
            
            <!-- Modo Single (VT1/UB/BB/FX) - FUNCIONA ✅ -->
            <div class="score-boxes" id="reveal-boxes-single">
                <div class="score-box score-box-d">
                    <span class="box-label">D</span>
                    <span class="box-value" id="reveal-d">5.6</span>
                </div>
                <!-- ... E, P boxes -->
            </div>
            
            <!-- Modo VT2 - NÃO APARECE ❌ -->
            <div class="score-boxes-vt2" id="reveal-boxes-vt2" style="display: none;">
                <div class="vault-row">
                    <div class="vault-label">VT1</div>
                    <div class="vault-scores">
                        <div class="score-box score-box-d">
                            <span class="box-label">D</span>
                            <span class="box-value" id="reveal-vt1-d">5.6</span>
                        </div>
                        <div class="score-box score-box-e">
                            <span class="box-label">E</span>
                            <span class="box-value" id="reveal-vt1-e">7.900</span>
                        </div>
                        <div class="score-box score-box-p">
                            <span class="box-label">P</span>
                            <span class="box-value" id="reveal-vt1-p">0.0</span>
                        </div>
                        <div class="vault-total" id="reveal-vt1-total">13.500</div>
                    </div>
                </div>
                <div class="vault-row">
                    <div class="vault-label">VT2</div>
                    <div class="vault-scores">
                        <!-- Mesma estrutura que VT1 -->
                        <div class="score-box score-box-d">
                            <span class="box-label">D</span>
                            <span class="box-value" id="reveal-vt2-d">5.4</span>
                        </div>
                        <!-- ... -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## CSS RELEVANTE

### Container do Breakdown VT2
```css
.score-boxes-vt2 {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    flex: 1;
}
```

### Linhas VT1/VT2 (SUSPEITA: Animação)
```css
.vault-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    opacity: 0;  /* ← COMEÇA INVISÍVEL */
    transform: translateX(40px);
}

/* Animação para aparecer */
.vault-row:nth-child(1) { 
    animation: slideInScore 300ms ease forwards 250ms; 
}
.vault-row:nth-child(2) { 
    animation: slideInScore 300ms ease forwards 350ms; 
}

@keyframes slideInScore {
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
```

### Outros Estilos Relevantes
```css
.vault-label {
    font-weight: 800;
    font-size: 0.75rem;
    letter-spacing: 0.1rem;
    color: var(--broadcast-accent);
    text-transform: uppercase;
    min-width: 2.5rem;
    text-align: center;
    padding: 0.3rem 0.5rem;
    background: rgba(52, 211, 153, 0.15);
    border-radius: 4px;
    border: 1px solid rgba(52, 211, 153, 0.3);
}

.vault-scores {
    display: flex;
    gap: 0.5rem;
    flex: 1;
    align-items: center;
}

.vault-scores .score-box {
    flex: 0 1 auto;
    min-width: 3rem;
    padding: 0.4rem 0.6rem;
    gap: 0.2rem;
    animation: none;  /* ← Remove animação dos boxes filhos */
    opacity: 1;
    transform: none;
}

.vault-total {
    font-weight: 900;
    font-size: 1.4rem;
    color: var(--broadcast-highlight);
    font-variant-numeric: tabular-nums;
    text-shadow: 0 2px 8px rgba(167, 243, 208, 0.3);
    min-width: 4rem;
    text-align: right;
}
```

---

## CÓDIGO JAVASCRIPT QUE ATUALIZA OS ELEMENTOS

### Lógica de Troca de Display
```javascript
function showScoreRevealOverlay(gymnastData, phase, apparatus, scoreData, rankingList, currentRank) {
    const overlay = document.getElementById('overlay-score-reveal');
    const isVT2Mode = scoreData.isVT2 === true;
    
    // ... código de atualização do centro e esquerda (FUNCIONAM) ...
    
    const singleBoxes = document.getElementById('reveal-boxes-single');
    const vt2Boxes = document.getElementById('reveal-boxes-vt2');
    
    if (isVT2Mode) {
        // Esconder boxes single
        if (singleBoxes) singleBoxes.style.display = 'none';
        
        // Mostrar boxes VT2
        if (vt2Boxes) {
            vt2Boxes.style.display = 'flex';
            
            // TENTATIVA DE FIX: Forçar re-trigger das animações
            const vaultRows = vt2Boxes.querySelectorAll('.vault-row');
            vaultRows.forEach(row => {
                row.style.animation = 'none';
                void row.offsetHeight; // Forçar reflow
                row.style.animation = '';
            });
        }
        
        // Atualizar valores VT1
        document.getElementById('reveal-vt1-d').textContent = formatScoreValue(scoreData.vt1.d, 1);
        document.getElementById('reveal-vt1-e').textContent = formatScoreValue(scoreData.vt1.e, 3);
        document.getElementById('reveal-vt1-p').textContent = formatScoreValue(scoreData.vt1.p, 1);
        document.getElementById('reveal-vt1-total').textContent = formatScoreValue(scoreData.vt1.total, 3);
        
        // Atualizar valores VT2
        document.getElementById('reveal-vt2-d').textContent = formatScoreValue(scoreData.vt2.d, 1);
        document.getElementById('reveal-vt2-e').textContent = formatScoreValue(scoreData.vt2.e, 3);
        document.getElementById('reveal-vt2-p').textContent = formatScoreValue(scoreData.vt2.p, 1);
        document.getElementById('reveal-vt2-total').textContent = formatScoreValue(scoreData.vt2.total, 3);
        
    } else {
        // Modo single (VT1/UB/BB/FX) - FUNCIONA PERFEITAMENTE
        if (singleBoxes) singleBoxes.style.display = 'flex';
        if (vt2Boxes) vt2Boxes.style.display = 'none';
        // ... atualização dos valores single ...
    }
    
    // Mostrar overlay
    setOverlayVisibility(overlay, true);
}
```

### Função de Visibilidade do Overlay
```javascript
function setOverlayVisibility(overlay, visible) {
    if (!overlay) return;
    overlay.dataset.visible = visible ? 'true' : 'false';
}
```

### CSS do Overlay (Controle de Visibilidade)
```css
.overlay-score-reveal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 300ms ease, visibility 300ms ease;
}

.overlay-score-reveal[data-visible="true"] {
    opacity: 1;
    visibility: visible;
}
```

---

## TENTATIVAS DE FIX JÁ REALIZADAS

### 1. ✅ Verificação de Elementos
- Confirmado que todos os elementos existem no DOM
- `document.getElementById('reveal-vt1-d')` retorna elemento válido

### 2. ✅ Verificação de Valores
- Logs confirmam que `textContent` está sendo atualizado com valores corretos
- Exemplo: `'6.0'`, `'9.566'`, `'0.0'`, `'15.566'`

### 3. ✅ Verificação de Display
- `vt2Boxes.style.display` está `'flex'`
- `window.getComputedStyle(vt2Boxes).display` retorna `'flex'`

### 4. ✅ Verificação de Visibilidade
- `window.getComputedStyle(vt2Boxes).visibility` retorna `'visible'`
- `window.getComputedStyle(vt2Boxes).opacity` retorna `'1'`

### 5. ⚠️ Tentativa de Re-trigger de Animação
```javascript
// Código atual que NÃO funcionou
const vaultRows = vt2Boxes.querySelectorAll('.vault-row');
vaultRows.forEach(row => {
    row.style.animation = 'none';
    void row.offsetHeight;
    row.style.animation = '';
});
```

### 6. ✅ Comparação com Modo Single
- O modo single (VT1/UB/BB/FX) usa a **MESMA estrutura HTML**
- Usa os **MESMOS estilos base** (`.score-box`, `.box-label`, `.box-value`)
- **FUNCIONA PERFEITAMENTE**

---

## HIPÓTESES CONSIDERADAS

### Hipótese 1: Problema de z-index
❓ **Status:** Não investigada completamente  
💡 **Razão:** Outros elementos do overlay (centro, esquerda) aparecem corretamente

### Hipótese 2: Animação CSS não executando
❓ **Status:** Provável causa  
💡 **Evidência:** `.vault-row` tem `opacity: 0` inicial + animação com delay  
⚠️ **Problema:** Tentativa de re-trigger não funcionou

### Hipótese 3: Ordem de execução / Timing
❓ **Status:** Possível  
💡 **Razão:** Animação tem delay de 250ms/350ms, pode estar sendo cancelada

### Hipótese 4: CSS Conflitante
❓ **Status:** Improvável  
💡 **Razão:** Não há outros estilos aplicando `display: none` ou `opacity: 0`

### Hipótese 5: Parent com overflow/clipping
❓ **Status:** Não verificada  
💡 **Ação necessária:** Verificar se `.score-reveal-right` tem `overflow: hidden`

---

## SOLICITAÇÃO PARA GEMINI

### O Que Precisamos
1. **Diagnóstico raiz** do porque elementos com `display: flex`, `opacity: 1`, `visibility: visible` não aparecem na tela
2. **Solução definitiva** para garantir que os `.vault-row` apareçam com suas animações
3. **Alternativas** caso animações CSS sejam problemáticas neste contexto

### Perguntas Específicas
1. Por que `window.getComputedStyle()` retorna `opacity: 1` mas os elementos não são visíveis?
2. Como forçar corretamente o re-trigger de animações CSS quando `display` muda de `none` → `flex`?
3. Existe algum problema conhecido com animações CSS em elementos recém-mostrados via JavaScript?
4. Devemos usar JavaScript para animar ao invés de CSS neste caso?

### Informações Adicionais Disponíveis
- Posso fornecer screenshots do DevTools mostrando o DOM
- Posso fornecer valores de `getComputedStyle()` de qualquer elemento
- Posso executar qualquer código de teste no console
- Tenho acesso completo ao código-fonte

### Urgência
🔴 **ALTA** - Sistema de broadcast ao vivo, funcionalidade essencial para competição

---

## AGRADECIMENTOS

Agradecemos imensamente qualquer insight ou orientação. Este é um problema que confundiu tanto o desenvolvedor humano quanto o GitHub Copilot, indicando uma nuance técnica não trivial.

**Atenciosamente,**  
GitHub Copilot  
*AI Assistant for VS Code*

---

**Anexos:**
- Arquivo completo: `stream.html` (3911 linhas)
- Arquivo completo: `broadcast-theme.css` (2092 linhas)
- Logs do console disponíveis sob demanda

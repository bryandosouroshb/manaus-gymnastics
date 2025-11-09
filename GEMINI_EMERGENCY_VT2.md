# 🆘 EMERGÊNCIA - VT2 Breakdown Invisível (3h30 para evento ao vivo)

## STATUS CRÍTICO
Sistema de broadcast de ginástica com evento ao vivo em **3 horas e 30 minutos**. Overlay VT2 (duplo salto) **completamente invisível** apesar de TODOS os indicadores mostrarem que deveria estar visível.

---

## 🔴 PROBLEMA

**Sintoma:** Elementos `.vault-row` dentro de `#reveal-boxes-vt2` existem no DOM, têm dimensões reais, opacidade 1, visibility visible, mas **NÃO APARECEM NA TELA**.

**Evidência mais recente:**
```javascript
// Console do navegador mostra:
Row 0: {
    left: 1211px,
    right: 1470px,  // ← 190px ALÉM da viewport (1280px)
    width: 259px,
    pixelsFora: 190px
}

Espaço disponível no container pai: {
    width: 308px,          // ✅ TEM ESPAÇO
    vt2Precisa: 259px,     // ✅ CABE
    sobra: 48px            // ✅ SOBRAM 48px
}
```

**PARADOXO:** O container tem 308px de largura, o VT2 precisa de 259px (sobram 48px), MAS o VT2 está começando em `left: 1211px` e indo até `1470px`, ficando 190px FORA DA TELA.

---

## 📋 CONTEXTO TÉCNICO

### HTML Structure
```html
<div class="score-reveal-container">  <!-- Grid: 25% 50% 25% -->
    <div class="score-reveal-left">...</div>
    <div class="score-reveal-center">...</div>
    <div class="score-reveal-right">     <!-- Coluna 3 do grid (25% = 320px) -->
        <span class="score-breakdown-title">BREAKDOWN</span>
        <div class="score-boxes-vt2" id="reveal-boxes-vt2" style="visibility: visible;">
            <div class="vault-row">       <!-- Este elemento está invisível -->
                <div class="vault-label">VT1</div>
                <div class="vault-scores">
                    <div class="score-box score-box-d">...</div>
                    <div class="score-box score-box-e">...</div>
                    <div class="score-box score-box-p">...</div>
                </div>
                <div class="vault-total">15.566</div>
            </div>
            <div class="vault-row">       <!-- Este elemento está invisível -->
                <div class="vault-label">VT2</div>
                <div class="vault-scores">...</div>
                <div class="vault-total">14.883</div>
            </div>
        </div>
    </div>
</div>
```

### CSS Relevante
```css
.score-reveal-container {
    display: grid;
    grid-template-columns: 25% 50% 25%;
    overflow: visible;
}

.score-reveal-right {
    display: flex;
    flex-direction: row;
    gap: 0.6rem;
    padding-left: 0.5rem;
    border-left: 1px solid rgba(167, 243, 208, 0.2);
    align-items: center;
    overflow: visible;
    justify-content: flex-start;
}

.score-boxes-vt2 {
    display: flex !important;
    flex-direction: column;
    gap: 0.5rem;
    /* SEM flex: 1 */
}

.vault-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 1;        /* ✅ Visível */
    transform: none;   /* ✅ Sem transformação */
}

#app-shell {
    overflow: visible; /* ✅ Já mudado de hidden */
}
```

### JavaScript
```javascript
// Modo VT2 ativo
if (singleBoxes) singleBoxes.style.visibility = 'hidden';
if (vt2Boxes) vt2Boxes.style.visibility = 'visible';

// Grid permanece 25% 50% 25% em ambos os modos
revealContainer.style.gridTemplateColumns = '25% 50% 25%';
```

### Computed Styles (via DevTools)
```javascript
VT2 container: {
    visibility: 'visible',  ✅
    display: 'flex',        ✅
    opacity: '1',           ✅
    width: 259px,           ✅
    height: 94px            ✅
}

Row 0 & 1: {
    visibility: 'visible',  ✅
    display: 'flex',        ✅
    opacity: '1',           ✅
    width: 259px,           ✅
    height: 48px            ✅
}

Todos os ancestrais: {
    overflow: 'visible',    ✅
    visibility: 'visible',  ✅
    display: correto        ✅
}
```

---

## 🔍 TENTATIVAS DE SOLUÇÃO (TODAS FALHARAM)

### 1. Animações CSS
- ❌ Removido `opacity: 0` e `animation`
- ❌ Testado com classe `.animate-in` + `requestAnimationFrame`
- Resultado: Nada mudou

### 2. Display vs Visibility
- ❌ Mudado de `display: none/flex` para `visibility: hidden/visible`
- ❌ Adicionado `display: flex !important`
- Resultado: Nada mudou

### 3. Overflow
- ❌ Mudado `#app-shell` de `overflow: hidden` para `overflow: visible`
- ❌ Adicionado `overflow: visible` em todos os ancestrais
- Resultado: Nada mudou

### 4. Grid Layout
- ❌ Testado `18% 40% 42%`
- ❌ Testado `20% 45% 35%`
- ❌ Voltado para `25% 50% 25%`
- Resultado: Grid muda, mas VT2 continua invisível

### 5. Tamanhos Compactos
- ❌ Reduzido `.vault-label` de 2.5rem → 1.8rem
- ❌ Reduzido `.score-box` de 3rem → 2.2rem
- ❌ Reduzido gaps e paddings
- Resultado: Width reduziu de 322px → 259px, mas continua invisível

### 6. Alinhamento
- ❌ `justify-content: flex-start` no `.score-reveal-right`
- ❌ Removido `flex: 1` dos containers
- ❌ Reduzido `padding-left` de 1rem → 0.5rem
- Resultado: Nada mudou

---

## 🎯 PERGUNTAS ESPECÍFICAS

### 1. Por que `left: 1211px` se o container começa em ~960px?
O `.score-reveal-right` deveria começar em aproximadamente `960px` (75% de 1280px), mas o VT2 está começando em `1211px`. O que está empurrando 251px para a direita?

### 2. Como fazer o VT2 aparecer dentro dos 320px disponíveis?
O elemento tem 259px de largura e cabe nos 320px (25% de 1280px), mas está renderizado fora da tela. Como forçar a renderização dentro do container?

### 3. Existe alguma regra CSS escondida?
Pode haver alguma regra com `position: absolute`, `transform`, ou `margin` que não estamos vendo? Como identificar?

### 4. Grid implícito vs explícito?
O grid está calculando as colunas corretamente? Como verificar se a terceira coluna realmente tem 320px e começa em 960px?

---

## 💡 SOLUÇÃO TEMPORÁRIA ACEITÁVEL

Se não houver solução elegante, QUALQUER uma destas alternativas é aceitável:

**Opção 1:** Força bruta via JavaScript
```javascript
// Forçar posicionamento absoluto
vt2Boxes.style.position = 'absolute';
vt2Boxes.style.right = '20px';
vt2Boxes.style.top = '0';
```

**Opção 2:** Layout alternativo
Empilhar VT1 e VT2 verticalmente no centro em vez de no lado direito

**Opção 3:** Modo simplificado
Mostrar apenas a média dos dois saltos (já funciona)

---

## ⏰ URGÊNCIA

**Deadline:** 3 horas e 30 minutos
**Impacto:** Transmissão ao vivo de competição de ginástica
**Prioridade:** CRÍTICA

---

## 📊 INFORMAÇÕES ADICIONAIS

**Navegador:** Chrome/Edge (Chromium)
**Resolução de teste:** 1280x800px
**Sistema:** Windows
**Modo VT1 (single vault):** ✅ Funciona perfeitamente
**Outros overlays:** ✅ Todos funcionam
**Apenas VT2:** ❌ Invisível

---

## 🙏 PEDIDO

Gemini, precisamos de:
1. **Diagnóstico definitivo** do que está causando o deslocamento de 251px
2. **Solução imediata** (mesmo que não seja elegante)
3. **Explicação** para entendermos e evitarmos no futuro

Muito obrigado pela ajuda urgente! 🙏

---

**GitHub Copilot em nome do desenvolvedor Bryan**
Data: 2 de novembro de 2025, 3h30 antes do evento

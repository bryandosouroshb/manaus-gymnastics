# 📊 Score Reveal Overlay - Documentação

## 🎯 Visão Geral

O **Score Reveal Overlay** é um novo sistema de exibição de notas que apresenta simultaneamente:
- **Ranking lateral** (5 posições ao redor da ginasta)
- **Card central** com informações da ginasta
- **Breakdown de scores** (D, E, P)

## 🎨 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  RANKING (30%)  │  CARD CENTRAL (40%)  │  BREAKDOWN (30%)   │
│                 │                       │                    │
│  #1 Nome 13.5   │  🇧🇷 BRAZIL          │  BREAKDOWN         │
│  #2 Nome 13.4   │  Rebeca ANDRADE      │  ┌──────┐         │
│  #3 Nome 13.0 ★ │  ═══════════════════  │  │  D   │         │
│  #4 Nome 12.9   │  FX  13.500  #3      │  │ 5.6  │         │
│  #5 Nome 12.2   │                       │  └──────┘         │
│                 │                       │  ┌──────┐         │
│                 │                       │  │  E   │         │
│                 │                       │  │ 7.900│         │
│                 │                       │  └──────┘         │
│                 │                       │  ┌──────┐         │
│                 │                       │  │  P   │  ← vermelho se > 0
│                 │                       │  │ 0.0  │     cinza se = 0
│                 │                       │  └──────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Como Usar

### Através dos Botões de Controle (Recomendado)

No painel de controle (`stcontrol.html`), use os botões de rodapé:

| Botão | Ação | Aparelho |
|-------|------|----------|
| **📊 Abrir Rodapé VT1** | Mostra Score Reveal | VT (Salto 1) |
| **📊 Abrir Rodapé VT2** | Mostra Score Reveal | VT (Salto 2) |
| **📊 Abrir Rodapé FX/UB/BB** | Mostra Score Reveal | FX, UB ou BB |
| **🚫 Fechar Rodapé [...]** | Esconde Score Reveal | Todos |

> **Nota:** O botão "Rodapé Padrão" continua funcionando com o rodapé antigo (lower-third básico).

### Via BroadcastChannel (Programático)

```javascript
// Mostrar overlay
controlChannel.postMessage({
    action: 'show-score-reveal'
});

// Esconder overlay
controlChannel.postMessage({
    action: 'hide-score-reveal'
});
```

### Funcionamento Automático

O overlay automaticamente:
1. ✅ Busca a ginasta atual
2. ✅ Calcula as notas (D, E, P) do aparelho atual
3. ✅ Busca o ranking completo
4. ✅ Calcula qual janela de 5 posições mostrar
5. ✅ Anima a entrada de todos os elementos simultaneamente

## 📐 Lógica de Ranking

O overlay sempre mostra **5 posições** ao redor da ginasta atual:

| Posição Atual | Janela Mostrada |
|---------------|-----------------|
| 1º lugar      | 1º ao 5º        |
| 2º lugar      | 1º ao 5º        |
| 3º lugar      | 1º ao 5º        |
| 8º lugar      | 6º ao 10º       |
| 15º lugar     | 13º ao 17º      |

A ginasta atual é **sempre destacada** com:
- Background verde mais forte
- Border highlight
- Escala ligeiramente maior
- Glow effect

## 🎬 Animações

### Entrada (Simultânea)
- **Ranking cards**: Slide da esquerda, escalonado (100ms entre cada)
- **Card central**: Scale + fade in (300ms)
- **Score boxes**: Slide da direita, escalonado (100ms entre cada)

### Mudança de Posição (Estilo F1)
Após **2 segundos** da exibição inicial:
1. Cards atuais fazem fade out (300ms)
2. Recalcula janela de ranking
3. Novos cards fazem slide in (80ms escalonado)
4. Smooth transition de 1.5s

## 🎨 Paleta de Cores

Mantém a identidade visual verde/esmeralda:

```css
/* Verde principal */
--broadcast-accent: #34d399;
--broadcast-highlight: #a7f3d0;

/* Penalty */
Vermelho (P > 0): rgba(239, 68, 68, 0.6)
Cinza (P = 0):    rgba(167, 243, 208, 0.2)
```

## 🏐 Aparelhos

### VT (Vault)
- Mostra **VT1** ou **VT2** baseado em `overlayContext.activeVaultNum`
- Busca scores de `vt1_d`, `vt1_e`, `vt1_p` ou `vt2_d`, `vt2_e`, `vt2_p`

### UB (Uneven Bars)
- Busca scores de `d`, `e`, `p` direto

### BB (Balance Beam)
- Busca scores de `bb_d`, `bb_e`, `bb_p`

### FX (Floor)
- Busca scores de `fx_d`, `fx_e`, `fx_p`

## 📱 Responsividade

O overlay é totalmente responsivo:

### Desktop (> 1600px)
- Grid: 30% | 40% | 30%
- Fonte total: 4rem
- Ranking cards: Layout vertical

### Tablet (1200px - 1600px)
- Grid: 30% | 40% | 30% (ajustado)
- Fonte total: 3.5rem
- Spacing reduzido

### Mobile (< 1200px)
- Grid: 100% vertical
- Ranking cards: Layout horizontal (scroll)
- Score boxes: Layout horizontal

## 🔧 Customização

### Modificar tempo de animação F1
```javascript
// Em stream.html, linha ~1580
scoreRevealAnimationTimeout = setTimeout(() => {
    animateRankingPositionChange(rankingList, currentRank, gymnastData.id);
}, 2000); // ← Alterar aqui (ms)
```

### Modificar número de posições no ranking
```javascript
// Em calculateRankingWindow(), linha ~1476
const windowSize = 5; // ← Alterar aqui
```

### Modificar cores do Penalty
```css
/* Em broadcast-theme.css, linha ~1990 */
.score-box.score-box-p[data-has-penalty='true'] {
    border-color: rgba(239, 68, 68, 0.6); /* Vermelho */
}
```

## 🐛 Debug

Console logs disponíveis:
```javascript
console.log('[Stream] ✨ Mostrando Score Reveal Overlay:', { ... });
console.log('[Stream] 🏎️ Animando mudança de posição para:', newRank);
```

Verificar no console:
- ✅ Ginasta atual encontrada
- ✅ Scores carregados
- ✅ Ranking calculado
- ✅ Posição atual no ranking

## ✨ Features Futuras (VT2)

Para VT2, adicionar:
- Campo adicional mostrando nota VT1
- Cálculo de média entre VT1 e VT2
- Label "MÉDIA" ao invés de "TOTAL"

## 📝 Notas Técnicas

- **Z-index**: 200 (acima de todos os outros overlays)
- **Background**: Semi-transparente com blur
- **Transitions**: Cubic-bezier para suavidade
- **Performance**: Usa `requestAnimationFrame` e `void element.offsetWidth` para forçar reflow

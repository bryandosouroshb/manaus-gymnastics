# Firebase Structure Specification - Manaus Gymnastics 2025

## Collection: `new_gymnasts`

Esta especificação define a **estrutura canônica** para armazenamento de notas no Firebase Realtime Database.

## Auditoria Completa

**Data**: 2025
**Status**: ✅ **APROVADO** - Sistema completamente validado
**Bugs Encontrados e Corrigidos**: 3

### Bugs Corrigidos

1. **edit-scores-ub-final.html** (Linha 1122-1124, 1162-1164)
   - ❌ **ANTES**: `ub_final_ub_d/e/p` (redundância)
   - ✅ **DEPOIS**: `ub_final_d/e/p`

2. **judges-d.html** (Linha 567)
   - ❌ **ANTES**: `${currentPhase}_${apparatus}_d` para TODAS as fases
   - ✅ **DEPOIS**: Finais de aparelho usam `${phase}_d`, outras fases `${phase}_${app}_d`

3. **judges-e.html** (Linhas 568-569)
   - ❌ **ANTES**: `${currentPhase}_${apparatus}_e/p` para TODAS as fases
   - ✅ **DEPOIS**: Finais de aparelho usam `${phase}_e/p`, outras fases `${phase}_${app}_e/p`

## Estrutura Canônica

### Estrutura Raiz do Documento

```javascript
{
  id: "gym_XXX",
  name: "Nome do Atleta",
  country: "BRA",
  gender: "M" | "F",
  bib: "123",
  team_final_present: true | false, // Flag para Team Final
  
  scores: {
    qualifiers: { /* ... */ },
    aa_final: { /* ... */ },
    team_final: { /* ... */ },
    vt_final: { /* ... */ },
    ub_final: { /* ... */ },
    bb_final: { /* ... */ },
    fx_final: { /* ... */ }
  }
}
```

## Fases e Chaves

### 1. Qualificatórias (`scores.qualifiers`)

**Características**:
- 2 saltos obrigatórios (VT1 e VT2)
- 1 série por aparelho (UB, BB, FX)

**Chaves**:
```javascript
{
  // VAULT (2 saltos)
  qualifiers_vt1_d: 5.4,
  qualifiers_vt1_e: 8.733,
  qualifiers_vt1_p: 0.1,
  
  qualifiers_vt2_d: 5.0,
  qualifiers_vt2_e: 8.566,
  qualifiers_vt2_p: 0.0,
  
  qualifiers_vt_intent: true, // Flag de intenção de 2 saltos
  
  // UNEVEN BARS
  qualifiers_ub_d: 6.2,
  qualifiers_ub_e: 8.400,
  qualifiers_ub_p: 0.0,
  
  // BALANCE BEAM
  qualifiers_bb_d: 5.8,
  qualifiers_bb_e: 8.200,
  qualifiers_bb_p: 0.1,
  
  // FLOOR EXERCISE
  qualifiers_fx_d: 5.5,
  qualifiers_fx_e: 8.500,
  qualifiers_fx_p: 0.0
}
```

**Cálculo Total VT**:
```javascript
vt1_total = qualifiers_vt1_d + qualifiers_vt1_e - qualifiers_vt1_p
vt2_total = qualifiers_vt2_d + qualifiers_vt2_e - qualifiers_vt2_p
vt_average = (vt1_total + vt2_total) / 2 // Apenas se qualifiers_vt_intent === true
```

---

### 2. Final Individual Geral (`scores.aa_final`)

**Características**:
- 1 série por aparelho (VT, UB, BB, FX)
- Notas zeradas após qualificação

**Chaves**:
```javascript
{
  // VAULT (1 salto na final)
  aa_final_vt_d: 5.2,
  aa_final_vt_e: 8.666,
  aa_final_vt_p: 0.0,
  
  // UNEVEN BARS
  aa_final_ub_d: 6.0,
  aa_final_ub_e: 8.533,
  aa_final_ub_p: 0.0,
  
  // BALANCE BEAM
  aa_final_bb_d: 5.9,
  aa_final_bb_e: 8.400,
  aa_final_bb_p: 0.1,
  
  // FLOOR EXERCISE
  aa_final_fx_d: 5.7,
  aa_final_fx_e: 8.600,
  aa_final_fx_p: 0.0
}
```

**Cálculo Total AA Final**:
```javascript
total_aa_final = aa_final_vt_total + aa_final_ub_total + aa_final_bb_total + aa_final_fx_total
```

---

### 3. Final por Equipes (`scores.team_final`)

**Características**:
- Sistema 3-up, 3-count (todas as 3 notas contam)
- Flags `competes_on_*` indicam em quais aparelhos a atleta compete
- Flag raiz `team_final_present` indica presença no Team Final

**Chaves**:
```javascript
{
  // Flags de participação (por aparelho)
  competes_on_vt: true,
  competes_on_ub: false,
  competes_on_bb: true,
  competes_on_fx: true,
  
  // VAULT
  team_final_vt_d: 5.3,
  team_final_vt_e: 8.700,
  team_final_vt_p: 0.0,
  
  // UNEVEN BARS
  team_final_ub_d: 0.0,
  team_final_ub_e: 0.0,
  team_final_ub_p: 0.0,
  
  // BALANCE BEAM
  team_final_bb_d: 5.8,
  team_final_bb_e: 8.300,
  team_final_bb_p: 0.0,
  
  // FLOOR EXERCISE
  team_final_fx_d: 5.6,
  team_final_fx_e: 8.550,
  team_final_fx_p: 0.1
}
```

**Lógica de Cálculo**:
```javascript
// Calcular scores de cada atleta que tem competes_on_* = true
// Somar TODAS as 3 notas por aparelho do time (3-up, 3-count)
team_vt_total = soma_das_3_melhores_atletas_com_competes_on_vt_true
team_total = team_vt_total + team_ub_total + team_bb_total + team_fx_total
```

---

### 4. Final de Saltos (`scores.vt_final`)

**Características**:
- **2 saltos obrigatórios** (VT1 e VT2) na final
- Média dos 2 saltos determina a classificação

**Chaves**:
```javascript
{
  vt_final_vt1_d: 5.4,
  vt_final_vt1_e: 8.800,
  vt_final_vt1_p: 0.0,
  
  vt_final_vt2_d: 5.0,
  vt_final_vt2_e: 8.600,
  vt_final_vt2_p: 0.0
}
```

**Cálculo Total VT Final**:
```javascript
vt1_total = vt_final_vt1_d + vt_final_vt1_e - vt_final_vt1_p
vt2_total = vt_final_vt2_d + vt_final_vt2_e - vt_final_vt2_p
vt_final_average = (vt1_total + vt2_total) / 2
```

---

### 5. Final de Barras Assimétricas (`scores.ub_final`)

**Características**:
- 1 série apenas
- **SEM redundância** de nome do aparelho

**Chaves**:
```javascript
{
  ub_final_d: 6.3,  // ❌ NÃO usar ub_final_ub_d
  ub_final_e: 8.900,
  ub_final_p: 0.0
}
```

---

### 6. Final de Trave (`scores.bb_final`)

**Características**:
- 1 série apenas
- **SEM redundância** de nome do aparelho

**Chaves**:
```javascript
{
  bb_final_d: 6.0,  // ❌ NÃO usar bb_final_bb_d
  bb_final_e: 8.750,
  bb_final_p: 0.1
}
```

---

### 7. Final de Solo (`scores.fx_final`)

**Características**:
- 1 série apenas
- **SEM redundância** de nome do aparelho

**Chaves**:
```javascript
{
  fx_final_d: 5.9,  // ❌ NÃO usar fx_final_fx_d
  fx_final_e: 8.800,
  fx_final_p: 0.0
}
```

---

## Padrões de Nomenclatura

### Regra Geral
```
${fase}_${aparelho}_${componente}
```

### Exceções

1. **Vault em Qualificatórias/VT Final**: Usa `vt1` e `vt2`
   ```javascript
   qualifiers_vt1_d  // ✅ Correto
   vt_final_vt2_e    // ✅ Correto
   ```

2. **Finais de Aparelhos Específicos**: Omite nome do aparelho
   ```javascript
   ub_final_d        // ✅ Correto
   ub_final_ub_d     // ❌ ERRADO - redundância
   ```

3. **AA Final e Team Final**: Incluem nome do aparelho
   ```javascript
   aa_final_ub_d     // ✅ Correto
   team_final_fx_e   // ✅ Correto
   ```

---

## Cálculo de Totais

### Fórmula Universal
```javascript
total = Math.max(0, d + e - p)
```

### Tratamento de Zeros

**CRÍTICO**: Zeros explícitos devem ser preservados!

```javascript
// ✅ CORRETO - Preserva zeros explícitos
const d = (dVal === 0 || dVal === '0') ? 0 : parseFloat(dVal) || 0;

// ❌ ERRADO - Zero seria tratado como falsy
const d = parseFloat(dVal) || 0;
```

**Motivo**: Uma ginasta que compete mas não pontua (queda, desclassificação) tem nota 0, diferente de "não competiu" (undefined/null).

---

## Estruturas Legadas (DEPRECADAS)

### ❌ NÃO USAR

```javascript
// Estruturas antigas encontradas e removidas durante auditoria:
all_around_final_vt_d
apparatus_finals_vt_d
ub_final_ub_d         // Redundância
qualifiers_vt_d       // Falta especificar vt1/vt2
team_final: {         // Objeto aninhado
  BB: { d: 5.0 }
}
total                 // Campo duplicado (deve ser calculado client-side)
```

---

## Validação dos Arquivos

### ✅ Arquivos Aprovados

**Edit Scores** (7 arquivos):
- `edit-scores-qualifiers.html` ✅
- `edit-scores-aa-final.html` ✅
- `edit-scores-team-final.html` ✅
- `edit-scores-vt-final.html` ✅
- `edit-scores-ub-final.html` ✅ (CORRIGIDO)
- `edit-scores-bb-final.html` ✅
- `edit-scores-fx-final.html` ✅

**Scoreboards** (7 arquivos):
- `scoreboard-qualifiers.html` ✅
- `scoreboard-aa-final.html` ✅
- `scoreboard-team-final.html` ✅
- `scoreboard-vt-final.html` ✅
- `scoreboard-ub-final.html` ✅
- `scoreboard-bb-final.html` ✅
- `scoreboard-fx-final.html` ✅

**Start Lists** (7 arquivos):
- `start-list-qualifiers.html` ✅
- `start-list-aa-final.html` ✅
- `start-list-team-final.html` ✅
- `start-list-vt-final.html` ✅
- `start-list-ub-final.html` ✅
- `start-list-bb-final.html` ✅
- `start-list-fx-final.html` ✅

**Broadcast/Control** (2 arquivos):
- `stcontrol.html` ✅ (fallback para `qualifiers_vt_d` mantido para backward compatibility)
- `stream.html` ✅ (cascata de fallbacks: canônico → legado → dinâmico)

**Judges** (2 arquivos):
- `judges-d.html` ✅ (CORRIGIDO)
- `judges-e.html` ✅ (CORRIGIDO)

**Core Logic**:
- `calculation-logic.js` ✅ (Todas as funções validadas)
- `manage-scores.html` ✅ (Gera estrutura canônica em bulk operations)

---

## Ferramentas de Gerenciamento

### `manage-scores.html`

Página administrativa para operações em massa:

**Função `zeroAllScores()`**:
```javascript
// Substitui TODA a estrutura scores com zeros canônicos
scores: {
  qualifiers: {
    qualifiers_vt1_d: 0, qualifiers_vt1_e: 0, qualifiers_vt1_p: 0,
    qualifiers_vt2_d: 0, qualifiers_vt2_e: 0, qualifiers_vt2_p: 0,
    // ... todos os aparelhos
  },
  aa_final: { /* ... */ },
  team_final: { /* ... */ },
  // ... todas as finais
}
```

**Função `generateRandomScores()`**:
```javascript
// Gera notas aleatórias seguindo estrutura canônica
D: random(3.0, 7.0)
E: random(6.0, 9.0)
P: random(0.0, 1.0)
```

**IMPORTANTE**: Ambas as funções **SUBSTITUEM** o objeto `scores` inteiro, eliminando qualquer estrutura legada existente.

---

## Exemplo Completo de Documento

```javascript
{
  "id": "gym_008",
  "name": "Rebeca Andrade",
  "country": "BRA",
  "gender": "F",
  "bib": "245",
  "team_final_present": true,
  
  "scores": {
    "qualifiers": {
      "qualifiers_vt1_d": 5.4,
      "qualifiers_vt1_e": 8.733,
      "qualifiers_vt1_p": 0.0,
      "qualifiers_vt2_d": 5.0,
      "qualifiers_vt2_e": 8.566,
      "qualifiers_vt2_p": 0.0,
      "qualifiers_vt_intent": true,
      "qualifiers_ub_d": 6.2,
      "qualifiers_ub_e": 8.400,
      "qualifiers_ub_p": 0.0,
      "qualifiers_bb_d": 5.8,
      "qualifiers_bb_e": 8.200,
      "qualifiers_bb_p": 0.1,
      "qualifiers_fx_d": 5.5,
      "qualifiers_fx_e": 8.500,
      "qualifiers_fx_p": 0.0
    },
    "aa_final": {
      "aa_final_vt_d": 5.2,
      "aa_final_vt_e": 8.666,
      "aa_final_vt_p": 0.0,
      "aa_final_ub_d": 6.0,
      "aa_final_ub_e": 8.533,
      "aa_final_ub_p": 0.0,
      "aa_final_bb_d": 5.9,
      "aa_final_bb_e": 8.400,
      "aa_final_bb_p": 0.1,
      "aa_final_fx_d": 5.7,
      "aa_final_fx_e": 8.600,
      "aa_final_fx_p": 0.0
    },
    "team_final": {
      "competes_on_vt": true,
      "competes_on_ub": true,
      "competes_on_bb": true,
      "competes_on_fx": true,
      "team_final_vt_d": 5.3,
      "team_final_vt_e": 8.700,
      "team_final_vt_p": 0.0,
      "team_final_ub_d": 6.1,
      "team_final_ub_e": 8.450,
      "team_final_ub_p": 0.0,
      "team_final_bb_d": 5.8,
      "team_final_bb_e": 8.300,
      "team_final_bb_p": 0.0,
      "team_final_fx_d": 5.6,
      "team_final_fx_e": 8.550,
      "team_final_fx_p": 0.1
    },
    "vt_final": {
      "vt_final_vt1_d": 5.4,
      "vt_final_vt1_e": 8.800,
      "vt_final_vt1_p": 0.0,
      "vt_final_vt2_d": 5.0,
      "vt_final_vt2_e": 8.600,
      "vt_final_vt2_p": 0.0
    },
    "ub_final": {
      "ub_final_d": 6.3,
      "ub_final_e": 8.900,
      "ub_final_p": 0.0
    },
    "bb_final": {
      "bb_final_d": 6.0,
      "bb_final_e": 8.750,
      "bb_final_p": 0.1
    },
    "fx_final": {
      "fx_final_d": 5.9,
      "fx_final_e": 8.800,
      "fx_final_p": 0.0
    }
  }
}
```

---

## Manutenção Futura

### Ao Adicionar Nova Fase

1. Definir nome da fase (ex: `semifinals`)
2. Criar estrutura em `scores.semifinals`
3. Determinar padrão de chaves:
   - Se é final de aparelho específico: `semifinals_d/e/p`
   - Se é multi-aparelhos: `semifinals_${app}_d/e/p`
4. Atualizar `calculation-logic.js` com nova fase
5. Criar páginas de edit/scoreboard/startlist correspondentes
6. Atualizar `manage-scores.html` para incluir nova fase

### Ao Modificar Estrutura

1. **NUNCA** remover campos antigos sem migração
2. Manter fallbacks em `stream.html` e `stcontrol.html`
3. Atualizar `zeroAllScores()` e `generateRandomScores()`
4. Rodar auditoria completa (Tasks 1-27)
5. Atualizar este documento

---

## Checklist de Implementação

Ao criar nova funcionalidade que acessa scores:

- [ ] Usa `phaseName` explícito (não hardcoded)
- [ ] Segue padrão `${phase}_${app}_${component}`
- [ ] Trata finais de aparelhos corretamente (sem redundância)
- [ ] Preserva zeros explícitos (`=== 0` check)
- [ ] Calcula totais client-side (não salva `total`)
- [ ] Testa com `manage-scores.html` (gera zeros e randoms)
- [ ] Valida com dados legados (fallbacks funcionam?)

---

**Última Atualização**: 2025  
**Revisão**: v1.0  
**Status**: ✅ Aprovado e Validado

// public/js/calculation-logic.js

const apparatusList = ['vt', 'ub', 'bb', 'fx'];

/**
 * Normaliza valores booleanos vindos do Firestore/UI (true/false, "true"/"false", 1/0, etc).
 * @param {*} value Valor original.
 * @param {boolean} defaultValue Valor padrão quando undefined/null/string vazia.
 * @returns {boolean}
 */
function normalizeBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return defaultValue;
        if (['true', '1', 'yes', 'y', 'sim'].includes(normalized)) return true;
        if (['false', '0', 'no', 'n', 'nao', 'não'].includes(normalized)) return false;
    }
    return Boolean(value);
}

// Helper to extract numeric prefix from ID (e.g., '008' from 'gym_008')
// Kept for potential future use, though current logic might not require it if keys are standardized
function getNumericPrefixFromId(gymnastId) {
    if (!gymnastId || typeof gymnastId !== 'string') return null;
    const parts = gymnastId.split('_');
    // Assumes format gym_XXX or initial_COUNTRY_XXX... We look for the first numeric part.
    for (let i = 1; i < parts.length; i++) { // Start from index 1
        if (/^\d+$/.test(parts[i])) {
            return parts[i];
        }
    }
    // Fallback check if format is just like '008_...' (less likely but possible)
    if (/^\d+$/.test(parts[0]) && parts.length > 1) {
        return parts[0];
    }
    return null;
}


/**
 * Obtém as pontuações D, E, P e Total para um aparelho específico dentro de uma fase.
 * Lida com chaves de VT diferentes (vt, vt1, vt2) e outros aparelhos.
 * @param {object} phaseScores - O objeto de scores para a fase (e.g., gymnast.scores.qualifiers).
 * @param {string} app - O código do aparelho (e.g., 'vt', 'ub', 'vt1', 'vt2').
 * @param {string|null} gymnastId - O ID do ginasta (e.g., 'gym_008'). Usado para fallback se chaves prefixadas forem encontradas (idealmente evitar).
 * @param {string|null} phaseName - O nome da fase (e.g., 'qualifiers', 'fx_final'). **Necessário para construir a chave completa.**
 * @returns {object} Objeto com { d, e, p, total }.
 */
function getAppScore(phaseScores, app, gymnastId = null, phaseName = null) {
    if (!phaseScores || !phaseName) {
        console.warn(`[getAppScore] Missing phaseScores or phaseName for app: ${app}`);
        return { d: 0, e: 0, p: 0, total: 0 };
    }

    let dVal, eVal, pVal;
    let dKey, eKey, pKey;

    // A estrutura de chaves no Firestore é sempre: "phaseName_apparatus_score"
    // Para finais por aparelho específico, as chaves são: "phaseName_d", "phaseName_e", "phaseName_p"
    if (app === 'vt1' || app === 'vt2') {
        // Salto 1 ou 2 em qualquer fase (Qualificatórias, Final de Salto)
        dKey = `${phaseName}_${app}_d`;
        eKey = `${phaseName}_${app}_e`;
        pKey = `${phaseName}_${app}_p`;
    } else if (phaseName.endsWith('_final') && app === phaseName.split('_')[0]) {
        // Finais por aparelho específico (ex: fx_final onde app = 'fx')
        // As chaves são simplificadas: "fx_final_d", "fx_final_e", "fx_final_p"
        dKey = `${phaseName}_d`;
        eKey = `${phaseName}_e`;
        pKey = `${phaseName}_p`;
    } else {
        // Caso padrão para todos os outros casos:
        // - Qualificatórias: "qualifiers_vt_d", "qualifiers_ub_d", etc.
        // - AA Final: "aa_final_vt_d", "aa_final_ub_d", etc.
        // - Team Final: "team_final_vt_d", "team_final_ub_d", etc.
        dKey = `${phaseName}_${app}_d`;
        eKey = `${phaseName}_${app}_e`;
        pKey = `${phaseName}_${app}_p`;
    }

    // Primeiro tenta buscar as chaves diretas
    dVal = phaseScores[dKey];
    eVal = phaseScores[eKey];
    pVal = phaseScores[pKey];

    // Se não encontrou e está procurando por VT nas qualificatórias, tenta VT1
    if ((dVal === undefined || dVal === null) && app === 'vt' && phaseName === 'qualifiers') {
        console.log(`[getAppScore] VT not found, trying VT1 for ${phaseName}`);
        dKey = `${phaseName}_vt1_d`;
        eKey = `${phaseName}_vt1_e`;
        pKey = `${phaseName}_vt1_p`;
        dVal = phaseScores[dKey];
        eVal = phaseScores[eKey];
        pVal = phaseScores[pKey];
    }

    // Ensure that explicitly set 0 scores are preserved
    const d = (dVal === 0 || dVal === '0') ? 0 : parseFloat(String(dVal).replace(',', '.')) || 0;
    const e = (eVal === 0 || eVal === '0') ? 0 : parseFloat(String(eVal).replace(',', '.')) || 0;
    const p = (pVal === 0 || pVal === '0') ? 0 : parseFloat(String(pVal).replace(',', '.')) || 0;    // Calculate total - always calculate if any scores exist, including 0
    const total = (d > 0 || e > 0 || dVal === 0 || eVal === 0) ? Math.max(0, d + e - p) : 0;

    console.log(`[getAppScore] App: ${app}, Phase: ${phaseName}, Keys: ${dKey}=${d}, ${eKey}=${e}, ${pKey}=${p}, Total:${total}`);
    return { d, e, p, total };
}

// Função específica para buscar notas do Team Final diretamente dos campos do Firebase
function getTeamFinalAppScore(gymnast, app) {
    // Buscar dados na estrutura scores.team_final
    const teamFinalScores = gymnast.scores?.team_final || {};

    const primaryDKey = `team_final_${app}_d`;
    const primaryEKey = `team_final_${app}_e`;
    const primaryPKey = `team_final_${app}_p`;

    // Fallbacks para estruturas antigas e formatos planos
    const fallbackDKey = `${app}_d`;
    const fallbackEKey = `${app}_e`;
    const fallbackPKey = `${app}_p`;

    // Alguns documentos armazenam as chaves de team final diretamente em gymnast.scores (flat),
    // por isso tentamos buscar em várias localizações.
    let dVal = teamFinalScores[primaryDKey];
    let eVal = teamFinalScores[primaryEKey];
    let pVal = teamFinalScores[primaryPKey];

    // Se não encontrou dentro de gymnast.scores.team_final, procurar no objeto raiz gymnast.scores
    if (dVal === undefined) dVal = gymnast.scores?.[primaryDKey];
    if (eVal === undefined) eVal = gymnast.scores?.[primaryEKey];
    if (pVal === undefined) pVal = gymnast.scores?.[primaryPKey];

    // Se ainda não encontrou, tentar chaves sem prefixo (fallback)
    if (dVal === undefined) dVal = teamFinalScores[fallbackDKey] ?? gymnast.scores?.[fallbackDKey];
    if (eVal === undefined) eVal = teamFinalScores[fallbackEKey] ?? gymnast.scores?.[fallbackEKey];
    if (pVal === undefined) pVal = teamFinalScores[fallbackPKey] ?? gymnast.scores?.[fallbackPKey];

    // Ensure that explicitly set 0 scores are preserved
    const d = (dVal === 0 || dVal === '0') ? 0 : parseFloat(String(dVal ?? '').replace(',', '.')) || 0;
    const e = (eVal === 0 || eVal === '0') ? 0 : parseFloat(String(eVal ?? '').replace(',', '.')) || 0;
    const p = (pVal === 0 || pVal === '0') ? 0 : parseFloat(String(pVal ?? '').replace(',', '.')) || 0;

    // Calculate total - always calculate if any scores exist, including 0
    const hasAnyScore = dVal !== undefined || eVal !== undefined || pVal !== undefined;
    const total = hasAnyScore ? Math.max(0, d + e - p) : 0;

    console.log(`[getTeamFinalAppScore] ${gymnast.name} App: ${app}, Keys: ${primaryDKey}/${fallbackDKey}=${d}, ${primaryEKey}/${fallbackEKey}=${e}, ${primaryPKey}/${fallbackPKey}=${p}, Total:${total}`);
    return { d, e, p, total };
}

function getQualifierVaultAverage(phaseScores, gymnastId = null) {
    if (!phaseScores) return 0;
    const phaseName = 'qualifiers';

    // REMOVIDO: Check intent - calcular SEMPRE se houver notas
    // const intent = phaseScores['qualifiers_vt_intent'];

    const vt1 = getAppScore(phaseScores, 'vt1', gymnastId, phaseName);
    const vt2 = getAppScore(phaseScores, 'vt2', gymnastId, phaseName);

    // *** CORREÇÃO: Calcular média se PELO MENOS UM salto tem nota ***
    if (vt1.total > 0 && vt2.total > 0) {
        // Ambos têm notas válidas > 0
        return (vt1.total + vt2.total) / 2;
    } else if (vt1.total > 0 && vt2.total === 0) {
        // Apenas VT1 tem nota
        return vt1.total;
    } else if (vt1.total === 0 && vt2.total > 0) {
        // Apenas VT2 tem nota
        return vt2.total;
    }

    // Se ambos zero ou inválidos, retorna 0
    return 0;
}


function calculateAAScores(gymnastData, currentPhase = 'qualifiers') {
    console.log(`[calculateAAScores] Starting for ${gymnastData.length} athletes in phase: ${currentPhase}.`);

    const phaseName = currentPhase === 'aa_final' ? 'aa_final' : 'qualifiers';

    const calculatedScores = gymnastData.map((gymnast, index) => {
        // Support both nested phase object (gymnast.scores.aa_final) and flat keys (gymnast.scores['aa_final_vt_d'])
        let phaseScores = gymnast.scores?.[phaseName];
        if (!phaseScores) {
            phaseScores = {};
            const prefix = `${phaseName}_`;
            Object.keys(gymnast.scores || {}).forEach((k) => {
                if (typeof k === 'string' && k.startsWith(prefix)) {
                    phaseScores[k] = gymnast.scores[k];
                }
            });
            if (!Object.keys(phaseScores).length) phaseScores = {};
        }

        let vtScoreForAA, ubScore, bbScore, fxScore;

        if (phaseName === 'aa_final') {
            // For AA final, use the specific apparatus scores from aa_final phase
            vtScoreForAA = getAppScore(phaseScores, 'vt', gymnast.id, phaseName).total;
            ubScore = getAppScore(phaseScores, 'ub', gymnast.id, phaseName).total;
            bbScore = getAppScore(phaseScores, 'bb', gymnast.id, phaseName).total;
            fxScore = getAppScore(phaseScores, 'fx', gymnast.id, phaseName).total;
        } else {
            // For qualifiers, use VT1 only for AA total
            vtScoreForAA = getAppScore(phaseScores, 'vt1', gymnast.id, phaseName).total;
            ubScore = getAppScore(phaseScores, 'ub', gymnast.id, phaseName).total;
            bbScore = getAppScore(phaseScores, 'bb', gymnast.id, phaseName).total;
            fxScore = getAppScore(phaseScores, 'fx', gymnast.id, phaseName).total;
        }

        const aaTotal = vtScoreForAA + ubScore + bbScore + fxScore;

        console.log(`[calculateAAScores] ${gymnast.name} (${phaseName}): VT:${vtScoreForAA}, UB:${ubScore}, BB:${bbScore}, FX:${fxScore}, Total:${aaTotal}`);

        return { ...gymnast, aaTotal: aaTotal };
    });

    // Filter and sort - incluir zeros válidos
    return calculatedScores.filter(g => g.aaTotal >= 0).sort((a, b) => b.aaTotal - a.aaTotal);
}


function calculateApparatusScores(gymnastData, apparatus) {
    console.log(`[calculateApparatusScores] Starting for ${apparatus} (${gymnastData.length} athletes).`);
    const phaseName = 'qualifiers'; // Qualificação por aparelho usa notas da Qualificação
    return gymnastData.map((gymnast, index) => {
        // Support nested or flat qualifier keys
        let phaseScores = gymnast.scores?.[phaseName];
        if (!phaseScores) {
            phaseScores = {};
            const prefix = `${phaseName}_`;
            Object.keys(gymnast.scores || {}).forEach((k) => {
                if (typeof k === 'string' && k.startsWith(prefix)) phaseScores[k] = gymnast.scores[k];
            });
            if (!Object.keys(phaseScores).length) phaseScores = {};
        }
        console.log(`[calculateApparatusScores] ${gymnast.name} - phaseScores:`, phaseScores);

        let score = 0;
        if (apparatus === 'vt') {
            // VT usa a lógica da média de qualificação
            score = getQualifierVaultAverage(phaseScores, gymnast.id);
            console.log(`[calculateApparatusScores] ${gymnast.name} - VT average: ${score}`);
        } else {
            // Outros aparelhos usam a nota única daquele aparelho
            const scoreData = getAppScore(phaseScores, apparatus, gymnast.id, phaseName);
            score = scoreData.total;
            console.log(`[calculateApparatusScores] ${gymnast.name} - ${apparatus} score:`, scoreData);
        }
        return { ...gymnast, apparatusScore: score }; // Adiciona apparatusScore ao objeto
    }).filter(g => g.apparatusScore >= 0).sort((a, b) => b.apparatusScore - a.apparatusScore); // *** MUDANÇA: >= 0 para incluir zeros ***
}


function calculateTeamScores(gymnastData) {
    console.log(`[calculateTeamScores] Starting for Qualifiers (${gymnastData.length} athletes).`);
    const phaseName = 'qualifiers'; // Qualificação de Times usa notas da Qualificação
    const teamScores = {};

    // Agrupa ginastas por país
    gymnastData.forEach(gymnast => {
        const phaseScores = gymnast.scores?.[phaseName];
        if (!phaseScores || !gymnast.country) return; // Ignora se não tiver score ou país
        if (!teamScores[gymnast.country]) {
            // Inicializa estrutura para o país
            teamScores[gymnast.country] = { total: 0, athletes: [], scores: { vt: [], ub: [], bb: [], fx: [] } };
        }
        // Calcula e armazena a nota relevante de cada aparelho para esta ginasta
        apparatusList.forEach(app => {
            let score = 0;
            if (app === 'vt') {
                // *** CORREÇÃO: Usa APENAS VT1 para o total da equipe na Qualificação ***
                score = getAppScore(phaseScores, 'vt1', gymnast.id, phaseName).total;
            } else {
                score = getAppScore(phaseScores, app, gymnast.id, phaseName).total;
            }
            if (score >= 0) { // *** MUDANÇA: >= 0 para incluir zeros válidos ***
                // Adiciona a nota {id, score} à lista do aparelho para aquele país
                teamScores[gymnast.country].scores[app].push({ id: gymnast.id, score: score });
            }
        });
        teamScores[gymnast.country].athletes.push(gymnast.id); // Mantém registro de atletas no time
    });

    // Calcula o total de cada time (Formato 4-4-drop-1 for Qualifiers)
    Object.keys(teamScores).forEach(country => {
        let countryTotal = 0;
        apparatusList.forEach(app => {
            // Get all scores for the apparatus for the current country
            const apparatusScores = teamScores[country].scores[app];

            // Sort scores in ascending order to find the lowest
            apparatusScores.sort((a, b) => a.score - b.score);

            // If there are 4 scores, drop the lowest. Sum the rest.
            // If fewer than 4, sum all available scores.
            let sumOfApparatusScores = 0;
            if (apparatusScores.length === 4) {
                // Sum the top 3 (index 1, 2, 3 after ascending sort)
                for (let i = 1; i < apparatusScores.length; i++) {
                    sumOfApparatusScores += apparatusScores[i].score;
                }
            } else {
                // Sum all scores if not exactly 4 (e.g. 3 or fewer gymnasts competed/scored)
                for (let i = 0; i < apparatusScores.length; i++) {
                    sumOfApparatusScores += apparatusScores[i].score;
                }
            }
            countryTotal += sumOfApparatusScores;
        });
        teamScores[country].total = countryTotal; // Define o total final do time
    });

    // Retorna a lista de times ordenada pelo total
    return Object.entries(teamScores)
        .map(([country, data]) => ({ country: country, total: data.total })) // Mapeia para {country, total}
        .sort((a, b) => b.total - a.total); // Ordena do maior para o menor
}


function calculateTeamFinalScores(allGymnastData, qualifyingCountryCodes) {
    console.log(`[calculateTeamFinalScores] Starting for ${qualifyingCountryCodes.length} teams.`);
    const phaseName = 'team_final'; // Usa notas da fase team_final
    const teamScores = {};

    // Inicializa a estrutura para os times qualificados
    qualifyingCountryCodes.forEach(country => {
        teamScores[country] = { country: country, vt: 0, ub: 0, bb: 0, fx: 0, total: 0 };
    });

    // Filtra apenas as ginastas dos times qualificados
    const athletesFromQualifyingTeams = allGymnastData.filter(gymnast =>
        qualifyingCountryCodes.includes(gymnast.country)
    );

    // Itera sobre as ginastas qualificadas
    athletesFromQualifyingTeams.forEach(gymnast => {
        const country = gymnast.country;
        const phaseScores = gymnast.scores?.[phaseName] || {}; // Pega as notas da fase team_final

        // ✅ VERIFICAR PRESENÇA: só processar se estiver presente no Team Final
        const isPresent = normalizeBoolean(gymnast.team_final_present, true);
        if (!isPresent) {
            return; // Pula esta ginasta
        }

        // Soma as notas dos aparelhos (SOMA TODAS AS NOTAS VÁLIDAS)
        apparatusList.forEach(app => {
            // ⚠️ USAR DADOS DIRETO DO FIREBASE
            const appScoreData = getTeamFinalAppScore(gymnast, app);

            // Soma TODAS as notas válidas (>= 0), incluindo zeros explícitos
            if (typeof appScoreData.total === 'number' && appScoreData.total >= 0) {
                teamScores[country][app] += appScoreData.total; // Adiciona ao total do aparelho para o time
            }
        });

        // Recalcula o total após cada ginasta
        teamScores[country].total = teamScores[country].vt + teamScores[country].ub + teamScores[country].bb + teamScores[country].fx;
    });

    // Ordena os times pelo total final
    const sortedTeams = Object.values(teamScores).sort((a, b) => b.total - a.total);
    console.log("[calculateTeamFinalScores] Finished:", sortedTeams);
    return sortedTeams;
}

// Nova função para calcular Team Final considerando duplicações
function calculateTeamFinalScoresWithDuplication(allGymnastData, qualifyingCountryCodes, teamFinalDraw) {
    console.log(`[calculateTeamFinalScoresWithDuplication] Starting for ${qualifyingCountryCodes.length} teams.`);
    const teamScores = {};
    const apparatusList = ['vt', 'ub', 'bb', 'fx'];

    // Inicializa a estrutura para os times qualificados
    qualifyingCountryCodes.forEach(country => {
        teamScores[country] = { country: country, vt: 0, ub: 0, bb: 0, fx: 0, total: 0 };
    });

    // Determinar a estrutura de dados (suporta formato antigo 'duplications' e novo 'structure.rotations')
    let rotationsData = null;

    if (teamFinalDraw?.structure?.rotations) {
        // Novo formato: { structure: { rotations: [...] } }
        console.log('[calculateTeamFinalScoresWithDuplication] Using NEW structure format (rotations)');
        rotationsData = teamFinalDraw.structure.rotations;
    } else if (teamFinalDraw?.rotations) {
        // Formato intermediário: { rotations: [...] } na raiz
        console.log('[calculateTeamFinalScoresWithDuplication] Using intermediate format (rotations at root)');
        rotationsData = teamFinalDraw.rotations;
    } else if (teamFinalDraw?.duplications) {
        // Formato antigo: { duplications: ... }
        console.log('[calculateTeamFinalScoresWithDuplication] Using OLD format (duplications)');
    }

    if (rotationsData) {
        // === LÓGICA PARA FORMATO NOVO (ROTATIONS) ===
        rotationsData.forEach(rotation => {
            const apparatusMap = rotation.apparatus; // Objeto { VT: [...], UB: [...] }

            if (!apparatusMap) return;

            Object.keys(apparatusMap).forEach(appKey => {
                const app = appKey.toLowerCase(); // 'vt', 'ub'...
                if (!apparatusList.includes(app)) return;

                const athletesList = apparatusMap[appKey]; // Array de { id, name, country, isDuplicate... }
                if (!Array.isArray(athletesList)) return;

                athletesList.forEach(slot => {
                    const country = slot.country;
                    if (!teamScores[country]) return; // Ignora países não qualificados/inicializados

                    // Encontrar ginasta (usando ID original, mesmo se for duplicata)
                    const gymnastId = slot.id;
                    const gymnast = allGymnastData.find(g => g.id === gymnastId);

                    if (gymnast) {
                        const isPresent = normalizeBoolean(gymnast.team_final_present, true);
                        if (isPresent) {
                            const appScoreData = getTeamFinalAppScore(gymnast, app);

                            if (typeof appScoreData.total === 'number' && appScoreData.total >= 0) {
                                teamScores[country][app] += appScoreData.total;
                            }
                        }
                    }
                });
            });
        });

    } else if (teamFinalDraw?.duplications) {
        // === LÓGICA PARA FORMATO ANTIGO (DUPLICATIONS) ===
        for (let rotation = 1; rotation <= 4; rotation++) {
            const rotationKey = `rotation${rotation}`;
            const rotationData = teamFinalDraw.duplications[rotationKey];

            if (!rotationData) continue;

            apparatusList.forEach((app, appIndex) => {
                const rotationApp = apparatusList[(appIndex + rotation - 1) % 4];
                const apparatusData = rotationData[rotationApp.toUpperCase()];

                if (!apparatusData) return;

                qualifyingCountryCodes.forEach(country => {
                    const countrySlots = apparatusData[country];
                    if (!countrySlots) return;

                    countrySlots.forEach(slot => {
                        if (slot.gymnastId) {
                            const gymnast = allGymnastData.find(g => g.id === slot.gymnastId);
                            const isPresent = gymnast ? normalizeBoolean(gymnast.team_final_present, true) : false;

                            if (gymnast && isPresent) {
                                const appScoreData = getTeamFinalAppScore(gymnast, rotationApp);
                                const multiplier = typeof slot.multiplier === 'number' ? slot.multiplier : 1;
                                const multipliedScore = appScoreData.total * multiplier;

                                if (typeof multipliedScore === 'number' && multipliedScore >= 0) {
                                    teamScores[country][rotationApp] += multipliedScore;
                                }
                            }
                        }
                    });
                });
            });
        }
    } else {
        console.warn('[calculateTeamFinalScoresWithDuplication] Unknown draw format. Falling back to standard calculation.');
        return calculateTeamFinalScores(allGymnastData, qualifyingCountryCodes);
    }

    // Recalcular totais finais
    qualifyingCountryCodes.forEach(country => {
        teamScores[country].total = teamScores[country].vt + teamScores[country].ub + teamScores[country].bb + teamScores[country].fx;
        console.log(`[calculateTeamFinalScoresWithDuplication] ${country} final total: ${teamScores[country].total}`);
    });

    // Ordena os times pelo total final
    const sortedTeams = Object.values(teamScores).sort((a, b) => b.total - a.total);
    console.log("[calculateTeamFinalScoresWithDuplication] Finished:", sortedTeams);
    return sortedTeams;
}

// Função para aplicar regra de máximo por país (Max 2 por país para AA/App Finais)
function applyMaxPerCountry(sortedList, maxQualifiers, maxPerCountry) {
    const qualified = [];
    const countryCount = {};
    for (const g of sortedList) {
        if (qualified.length >= maxQualifiers) break; // Para se atingir o limite de finalistas
        const c = g.country || 'Unk'; // País da ginasta
        countryCount[c] = countryCount[c] || 0; // Inicializa contador do país se não existir
        if (countryCount[c] < maxPerCountry) { // Verifica se o país já atingiu o limite
            qualified.push(g); // Adiciona à lista de qualificados
            countryCount[c]++; // Incrementa o contador para o país
        }
    }
    console.log(`[applyMaxPerCountry] Applied ${maxPerCountry}/country to list(${sortedList.length}), aiming for ${maxQualifiers}. Result: ${qualified.length}`);
    return qualified;
}

// Export for ES6 modules and make available globally
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS export
    module.exports = {
        apparatusList,
        getAppScore,
        getQualifierVaultAverage,
        calculateAAScores,
        calculateApparatusScores,
        calculateTeamScores,
        calculateTeamFinalScores,
        calculateTeamFinalScoresWithDuplication,
        applyMaxPerCountry
    };
} else if (typeof window !== 'undefined') {
    // Browser globals
    window.apparatusList = apparatusList;
    window.getAppScore = getAppScore;
    window.getQualifierVaultAverage = getQualifierVaultAverage;
    window.calculateAAScores = calculateAAScores;
    window.calculateApparatusScores = calculateApparatusScores;
    window.calculateTeamScores = calculateTeamScores;
    window.calculateTeamFinalScores = calculateTeamFinalScores;
    window.calculateTeamFinalScoresWithDuplication = calculateTeamFinalScoresWithDuplication;
    window.applyMaxPerCountry = applyMaxPerCountry;
}

// ES6 module export (commented out for global use)
/*
export {
    apparatusList,
    getAppScore,
    getQualifierVaultAverage,
    calculateAAScores,
    calculateApparatusScores,
    calculateTeamScores,
    calculateTeamFinalScores,
    calculateTeamFinalScoresWithDuplication,
    applyMaxPerCountry
};
*/
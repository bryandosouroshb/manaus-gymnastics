// public/js/calculation-logic.js

const apparatusList = ['vt', 'ub', 'bb', 'fx'];

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
    
    const dKey = `team_final_${app}_d`;
    const eKey = `team_final_${app}_e`;
    const pKey = `team_final_${app}_p`;
    
    const dVal = teamFinalScores[dKey];
    const eVal = teamFinalScores[eKey];
    const pVal = teamFinalScores[pKey];
    
    // Ensure that explicitly set 0 scores are preserved
    const d = (dVal === 0 || dVal === '0') ? 0 : parseFloat(String(dVal).replace(',', '.')) || 0;
    const e = (eVal === 0 || eVal === '0') ? 0 : parseFloat(String(eVal).replace(',', '.')) || 0;
    const p = (pVal === 0 || pVal === '0') ? 0 : parseFloat(String(pVal).replace(',', '.')) || 0;
    
    // Calculate total - always calculate if any scores exist, including 0
    const total = (d > 0 || e > 0 || dVal === 0 || eVal === 0) ? Math.max(0, d + e - p) : 0;
    
    console.log(`[getTeamFinalAppScore] ${gymnast.name} App: ${app}, Keys: ${dKey}=${d}, ${eKey}=${e}, ${pKey}=${p}, Total:${total}`);
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
        const phaseScores = gymnast.scores?.[phaseName] || {};
        
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
        const phaseScores = gymnast.scores?.[phaseName] || {};
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
        }        // Calcula e armazena a nota relevante de cada aparelho para esta ginasta
        apparatusList.forEach(app => {
            let score = 0;
            if (app === 'vt') {
                 // *** CORREÇÃO: Usa APENAS VT1 para o total da equipe na Qualificação ***
                 score = getAppScore(phaseScores, 'vt1', gymnast.id, phaseName).total;
            } else {
                score = getAppScore(phaseScores, app, gymnast.id, phaseName).total;
            }            if (score >= 0) { // *** MUDANÇA: >= 0 para incluir zeros válidos ***
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
        if (gymnast.team_final_present !== true) {
            console.log(`[calculateTeamFinalScores] ${gymnast.name} (${country}) AUSENTE - pulando (present=${gymnast.team_final_present})`);
            return; // Pula esta ginasta
        }

        // ✅ VERIFICAR SE HAS DADOS DE TEAM FINAL: só processar se tem dados válidos
        const teamFinalScores = gymnast.scores?.team_final || {};
        const hasTeamFinalData = Object.keys(teamFinalScores).some(key => key.startsWith('team_final_') && teamFinalScores[key] !== '' && teamFinalScores[key] !== null && teamFinalScores[key] !== undefined);
        if (!hasTeamFinalData) {
            console.log(`[calculateTeamFinalScores] ${gymnast.name} (${country}) SEM DADOS DE TEAM FINAL - pulando`);
            return;
        }

        console.log(`[calculateTeamFinalScores] Processing ${gymnast.name} (${country}):`, phaseScores);

        // Soma as notas dos aparelhos onde a ginasta competiu (3-up, 3-count - SOMA TODAS AS 3 NOTAS)
        apparatusList.forEach(app => {
            const competesKey = `competes_on_${app}`; // Flag definida no modal
            if (phaseScores[competesKey]) { // Verifica se a ginasta competiu neste aparelho
                // ⚠️ USAR DADOS DIRETO DO FIREBASE ao invés de phaseScores
                const appScoreData = getTeamFinalAppScore(gymnast, app);
                console.log(`[calculateTeamFinalScores] ${gymnast.name} - ${app}: competes=${phaseScores[competesKey]}, score=${appScoreData.total}`);
                
                // MUDANÇA: Soma TODAS as notas válidas (>= 0), incluindo zeros
                if (appScoreData.total >= 0) {
                    teamScores[country][app] += appScoreData.total; // Adiciona ao total do aparelho para o time
                    console.log(`[calculateTeamFinalScores] Added ${appScoreData.total} to ${country} ${app}. New total: ${teamScores[country][app]}`);
                }
            }
        });
        
        // Recalcula o total após cada ginasta
        teamScores[country].total = teamScores[country].vt + teamScores[country].ub + teamScores[country].bb + teamScores[country].fx;
        console.log(`[calculateTeamFinalScores] ${country} updated totals - VT:${teamScores[country].vt}, UB:${teamScores[country].ub}, BB:${teamScores[country].bb}, FX:${teamScores[country].fx}, Total:${teamScores[country].total}`);
    });

    // Ordena os times pelo total final
    const sortedTeams = Object.values(teamScores).sort((a, b) => b.total - a.total);
    console.log("[calculateTeamFinalScores] Finished:", sortedTeams);
    return sortedTeams;
}

// Nova função para calcular Team Final considerando duplicações
function calculateTeamFinalScoresWithDuplication(allGymnastData, qualifyingCountryCodes, teamFinalDraw) {
    console.log(`[calculateTeamFinalScoresWithDuplication] Starting for ${qualifyingCountryCodes.length} teams.`);
    const phaseName = 'team_final';
    const teamScores = {};
    const apparatus = ['vt', 'ub', 'bb', 'fx'];

    // Inicializa a estrutura para os times qualificados
    qualifyingCountryCodes.forEach(country => {
        teamScores[country] = { country: country, vt: 0, ub: 0, bb: 0, fx: 0, total: 0 };
    });

    // Verificar se há estrutura de duplicações
    if (!teamFinalDraw?.duplications) {
        console.warn('[calculateTeamFinalScoresWithDuplication] No duplications structure found, fallback to standard calculation');
        return calculateTeamFinalScores(allGymnastData, qualifyingCountryCodes);
    }

    console.log('[calculateTeamFinalScoresWithDuplication] Using duplication structure:', teamFinalDraw.duplications);

    // Para cada rotação, aparelho e país, aplicar as duplicações
    for (let rotation = 1; rotation <= 4; rotation++) {
        const rotationKey = `rotation${rotation}`;
        const rotationData = teamFinalDraw.duplications[rotationKey];
        
        if (!rotationData) continue;

        apparatus.forEach((app, appIndex) => {
            const rotationApp = apparatus[(appIndex + rotation - 1) % 4];
            const apparatusData = rotationData[rotationApp.toUpperCase()];
            
            if (!apparatusData) return;

            qualifyingCountryCodes.forEach(country => {
                const countrySlots = apparatusData[country];
                
                if (!countrySlots) return;

                console.log(`[calculateTeamFinalScoresWithDuplication] Processing ${country} on ${rotationApp} (rotation ${rotation}):`, countrySlots);

                // Para cada slot da ginasta neste aparelho/rotação
                countrySlots.forEach(slot => {
                    if (slot.gymnastId) {
                        const gymnast = allGymnastData.find(g => g.id === slot.gymnastId);
                        
                        // VERIFICAR PRESENÇA: só usar nota se ginasta está presente
                        if (gymnast && gymnast.team_final_present === true) {
                            const appScoreData = getTeamFinalAppScore(gymnast, rotationApp);
                            
                            // Aplicar multiplicador
                            const multipliedScore = appScoreData.total * slot.multiplier;
                            
                            console.log(`[calculateTeamFinalScoresWithDuplication] ${gymnast.name} - ${rotationApp}: original_score=${appScoreData.total}, multiplier=${slot.multiplier}, multiplied_score=${multipliedScore}, present=${gymnast.team_final_present}`);
                            
                            if (multipliedScore >= 0) {
                                const previousTotal = teamScores[country][rotationApp];
                                teamScores[country][rotationApp] += multipliedScore;
                                console.log(`[calculateTeamFinalScoresWithDuplication] ${country} ${rotationApp}: ${previousTotal} + ${multipliedScore} = ${teamScores[country][rotationApp]}`);
                            }
                        } else {
                            // Ginasta ausente ou sem notas = 0 pontos
                            const presentStatus = gymnast ? gymnast.team_final_present : 'not found';
                            console.log(`[calculateTeamFinalScoresWithDuplication] ${gymnast?.name || 'Unknown'} ABSENT or no scores (present: ${presentStatus}) - adding 0 points`);
                        }
                    } else {
                        // Slot vazio (ginasta ausente) = 0 pontos
                        console.log(`[calculateTeamFinalScoresWithDuplication] Empty slot for ${country} on ${rotationApp} - adding 0 points`);
                    }
                });
            });
        });
    }

    // Recalcular totais finais
    qualifyingCountryCodes.forEach(country => {
        teamScores[country].total = teamScores[country].vt + teamScores[country].ub + teamScores[country].bb + teamScores[country].fx;
        console.log(`[calculateTeamFinalScoresWithDuplication] ${country} final totals - VT:${teamScores[country].vt}, UB:${teamScores[country].ub}, BB:${teamScores[country].bb}, FX:${teamScores[country].fx}, Total:${teamScores[country].total}`);
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
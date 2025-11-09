// Importe funções do Firestore (assumindo que SDK foi carregado no HTML)
const { getFirestore, collection, onSnapshot } = window.firebase.firestore; // Ajuste se usar módulos
const db = window.db; // Pega a instância do Firestore inicializada no HTML

document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('scoreboard-tbody');
    const tableHead = document.getElementById('scoreboard-thead');
    const phaseSelect = document.getElementById('scoreboard-phase-select');
    const refreshButton = document.getElementById('refresh-scores-btn');
    const phaseTitle = document.getElementById('competition-phase-title');
    const apparatusList = ['vt', 'ub', 'bb', 'fx']; // Standard apparatus
    // Ensure qualificationSummariesDiv is checked correctly
    const qualificationSummariesDiv = document.getElementById('qualification-summaries');
    if (!qualificationSummariesDiv) console.error("#qualification-summaries container not found!");
    // Use more specific selectors and check existence immediately
    const teamQualBody = qualificationSummariesDiv ? qualificationSummariesDiv.querySelector('#team-qualifiers tbody') : null;
    const aaQualBody = qualificationSummariesDiv ? qualificationSummariesDiv.querySelector('#aa-qualifiers tbody') : null;
    const vtFinalistsBody = qualificationSummariesDiv ? qualificationSummariesDiv.querySelector('#vt-finalists-body') : null;
    const ubFinalistsBody = qualificationSummariesDiv ? qualificationSummariesDiv.querySelector('#ub-finalists-body') : null;
    const bbFinalistsBody = qualificationSummariesDiv ? qualificationSummariesDiv.querySelector('#bb-finalists-body') : null;
    const fxFinalistsBody = qualificationSummariesDiv ? qualificationSummariesDiv.querySelector('#fx-finalists-body') : null;

    // Log if elements were found
    if (!qualificationSummariesDiv) console.error("#qualification-summaries container not found!");
    if (!teamQualBody) console.error("#team-qualifiers tbody not found!");
    if (!aaQualBody) console.error("#aa-qualifiers tbody not found!");
    if (!vtFinalistsBody) console.error("#vt-finalists-body not found!");
    if (!ubFinalistsBody) console.error("#ub-finalists-body not found!");
    if (!bbFinalistsBody) console.error("#bb-finalists-body not found!");
    if (!fxFinalistsBody) console.error("#fx-finalists-body not found!");


    // --- Country Data Mapping ---
    // *** ADD 'code' property (lowercase) ***
    const countryData = {
        'USA': { name: 'UNITED STATES OF AMERICA', flag: '🇺🇸', symbol: '🔵', color: '#0078d0', code: 'us' },
        'BRA': { name: 'BRAZIL', flag: '🇧🇷', symbol: '🟢', color: '#198754', code: 'br' },
        'CAN': { name: 'CANADA', flag: '🇨🇦', symbol: '🔴', color: '#dc3545', code: 'ca' },
        'ITA': { name: 'ITALY', flag: '🇮🇹', symbol: '✳️', color: '#198754', code: 'it' },
        'ROM': { name: 'ROMANIA', flag: '🇷🇴', symbol: '🟡', color: '#ffc107', code: 'ro' },
        'CHN': { name: 'PEOPLE\'S REPUBLIC OF CHINA', flag: '🇨🇳', symbol: '🈴️', color: '#dc3545', code: 'cn' },
        'GBR': { name: 'GREAT BRITAIN', flag: '🇬🇧', symbol: '🟣', color: '#6f42c1', code: 'gb' },
        'FRA': { name: 'FRANCE', flag: '🇫🇷', symbol: '🔷️', color: '#0d6efd', code: 'fr' },
        'DEFAULT': { name: '', flag: '', symbol: '', color: '#6c757d', code: '' } // Add empty code for default
    };

    // --- Helper Functions (Headers, Rows, Score Calculation) ---
    // --- Helper to Generate Table Header ---
    function generateTableHeader(phase) {
        let headerHTML = '';

        if (phase === 'qualifiers' || phase === 'team_final' || phase === 'aa_final') {
            headerHTML = `
                <tr>
                    <th rowspan="2">Rank</th>
                    <th rowspan="2">Ginasta</th>
                    <th colspan="4">Salto (VT)</th>
                    <th colspan="4">Barras Assimétricas (UB)</th>
                    <th colspan="4">Trave (BB)</th>
                    <th colspan="4">Solo (FX)</th>
                    <th rowspan="2">Total</th>
                </tr>
                <tr>
                    <th class="score-col-d">D</th><th class="score-col-e">E</th><th class="score-col-p">P</th><th class="score-col-app-total">Total VT</th>
                    <th class="score-col-d">D</th><th class="score-col-e">E</th><th class="score-col-p">P</th><th class="score-col-app-total">Total UB</th>
                    <th class="score-col-d">D</th><th class="score-col-e">E</th><th class="score-col-p">P</th><th class="score-col-app-total">Total BB</th>
                    <th class="score-col-d">D</th><th class="score-col-e">E</th><th class="score-col-p">P</th><th class="score-col-app-total">Total FX</th>
                </tr>`;
        } else if (phase === 'vt_final') {
             headerHTML = `
                <tr>
                    <th rowspan="2">Rank</th>
                    <th rowspan="2">Ginasta</th>
                    <th colspan="3">Salto 1</th>
                    <th rowspan="2">Total VT1</th>
                    <th colspan="3">Salto 2</th>
                     <th rowspan="2">Total VT2</th>
                    <th rowspan="2">Média Final</th>
                </tr>
                <tr>
                    <th>D</th><th>E</th><th>P</th>
                    <th>D</th><th>E</th><th>P</th>
                </tr>`;
        } else if (phase.endsWith('_final') && phase !== 'team_final') { // Adjusted condition
            const app = phase.split('_')[0].toUpperCase();
            headerHTML = `
                 <tr>
                    <th>Rank</th>
                    <th>Ginasta</th>
                    <th>Dificuldade (D)</th>
                    <th>Execução (E)</th>
                    <th>Penalidade (P)</th>
                    <th>Total ${app}</th>
                </tr>`;
        } else if (phase === 'team_final') { // Specific header for team final table
            headerHTML = `
                <tr>
                    <th>Rank</th>
                    <th>País</th> <!-- Keep Country for Team Final Table -->
                    <th>Total VT</th>
                    <th>Total UB</th>
                    <th>Total BB</th>
                    <th>Total FX</th>
                    <th>Total Equipe</th>
                </tr>`;
        } else {
             headerHTML = `<tr><th>Rank</th><th>Ginasta</th><th>Total</th></tr>`; // Fallback without country
        }

        if (tableHead) {
            tableHead.innerHTML = headerHTML;
        }
        // Update phase title
        if (phaseTitle) {
            const phaseOption = phaseSelect.querySelector(`option[value="${phase}"]`);
            phaseTitle.textContent = phaseOption ? phaseOption.textContent : 'Resultados da Competição';
        }
    }


    // --- Helper Function to Create Main Table Row HTML (Individual) ---
    function getScorePrefix(gymnastId) {
        // Extrai o prefixo correto para as chaves de score (ex: '22_ma0d35mfxwj' de 'initial_ROM_22_ma0d35mfxwj')
        const parts = gymnastId.split('_');
        return parts.slice(-2).join('_');
    }

    function createTableRowHTML(gymnast, rank, phase, phaseScores, medal = null) {
        let scoreCellsHTML = '';
        let displayTotal = '-'; // Default display total
        const countryInfo = countryData[gymnast.country] || countryData['DEFAULT'];
        const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span>` : '';
        const formattedName = `${flagSpan} ${gymnast.name || 'N/A'}`;
        let rankContent = rank !== null ? rank : '-';
        if (medal) {
            rankContent = `<span class="medal-${medal}">${rank}</span>`;
        }

        if (phase === 'qualifiers' || phase === 'team_final' || phase === 'aa_final') {
            let overallTotal = 0;
            const prefix = getScorePrefix(gymnast.id);
            apparatusList.forEach(app => {
                let d = 0, e = 0, p = 0, appTotal = 0;
                // Busca as notas usando o prefixo correto
                const dKey = `${prefix}_qualifiers_${app}_d`;
                const eKey = `${prefix}_qualifiers_${app}_e`;
                const pKey = `${prefix}_qualifiers_${app}_p`;
                d = parseFloat(phaseScores[dKey]) || 0;
                e = parseFloat(phaseScores[eKey]) || 0;
                p = parseFloat(phaseScores[pKey]) || 0;
                // Determinar se há notas válidas (incluindo zeros explícitos)
                const hasValidScores = (phaseScores[dKey] !== undefined && phaseScores[dKey] !== null) || 
                                      (phaseScores[eKey] !== undefined && phaseScores[eKey] !== null);
                appTotal = hasValidScores ? (d + e - p) : 0;
                if (phase === 'qualifiers' || phase === 'aa_final') {
                    overallTotal += appTotal;
                } else if (phase === 'team_final') {
                    overallTotal += appTotal;
                }
                scoreCellsHTML += `\n<td class="score-d score-${app}-d">${hasValidScores ? d.toFixed(1) : '-'}</td>\n<td class="score-e score-${app}-e">${hasValidScores ? e.toFixed(3) : '-'}</td>\n<td class="score-p score-${app}-p">${hasValidScores ? p.toFixed(1) : '-'}</td>\n<td class="score-total-apparatus score-${app}-total score-bold">${hasValidScores ? appTotal.toFixed(3) : '-'}</td>`;
            });
            displayTotal = overallTotal > 0 ? overallTotal.toFixed(3) : '-';
            scoreCellsHTML += `<td class="score-total-overall score-bold">${displayTotal}</td>`;
        } else if (phase === 'vt_final') {
            const d1 = parseFloat(phaseScores.vt1_d) || 0;
            const e1 = parseFloat(phaseScores.vt1_e) || 0;
            const p1 = parseFloat(phaseScores.vt1_p) || 0;
            const hasValidScores1 = (phaseScores.vt1_d !== undefined && phaseScores.vt1_d !== null) || 
                                   (phaseScores.vt1_e !== undefined && phaseScores.vt1_e !== null);
            const total1 = hasValidScores1 ? (d1 + e1 - p1) : 0;

            const d2 = parseFloat(phaseScores.vt2_d) || 0;
            const e2 = parseFloat(phaseScores.vt2_e) || 0;
            const p2 = parseFloat(phaseScores.vt2_p) || 0;
            const hasValidScores2 = (phaseScores.vt2_d !== undefined && phaseScores.vt2_d !== null) || 
                                   (phaseScores.vt2_e !== undefined && phaseScores.vt2_e !== null);
            const total2 = hasValidScores2 ? (d2 + e2 - p2) : 0;

            const avg = (total1 > 0 && total2 > 0) ? ((total1 + total2) / 2) : (total1 > 0 ? total1 : (total2 > 0 ? total2 : 0)); // Avg if both, else the single score
            displayTotal = avg > 0 ? avg.toFixed(3) : '-';

            // *** CHANGE: Add 'score-bold' class to individual vault totals and final average ***
            scoreCellsHTML = `
                <td class="score-d">${hasValidScores1 ? d1.toFixed(1) : '-'}</td>
                <td class="score-e">${hasValidScores1 ? e1.toFixed(3) : '-'}</td>
                <td class="score-p">${hasValidScores1 ? p1.toFixed(1) : '-'}</td>
                <td class="score-total-apparatus score-bold">${total1 > 0 ? total1.toFixed(3) : '-'}</td>
                <td class="score-d">${hasValidScores2 ? d2.toFixed(1) : '-'}</td>
                <td class="score-e">${hasValidScores2 ? e2.toFixed(3) : '-'}</td>
                <td class="score-p">${hasValidScores2 ? p2.toFixed(1) : '-'}</td>
                <td class="score-total-apparatus score-bold">${total2 > 0 ? total2.toFixed(3) : '-'}</td>
                <td class="score-total-overall score-bold">${displayTotal}</td>`; // Final average cell
        } else if (phase.endsWith('_final')) {
            const d = parseFloat(phaseScores.d) || 0;
            const e = parseFloat(phaseScores.e) || 0;
            const p = parseFloat(phaseScores.p) || 0;
            const hasValidScores = (phaseScores.d !== undefined && phaseScores.d !== null) || 
                                  (phaseScores.e !== undefined && phaseScores.e !== null);
            const appTotal = hasValidScores ? (d + e - p) : 0;
            displayTotal = appTotal > 0 ? appTotal.toFixed(3) : '-';
            // *** CHANGE: Add 'score-bold' class to final total cell ***
            scoreCellsHTML = `
                <td class="score-d">${hasValidScores ? d.toFixed(1) : '-'}</td>
                <td class="score-e">${hasValidScores ? e.toFixed(3) : '-'}</td>
                <td class="score-p">${hasValidScores ? p.toFixed(1) : '-'}</td>
                <td class="score-total-overall score-bold">${displayTotal}</td>`; // Final total cell
        } else {
             // *** CHANGE: Add 'score-bold' class to fallback total cell ***
             scoreCellsHTML = `<td class="score-total-overall score-bold">${displayTotal}</td>`; // Fallback
        }


        return `\n<tr class="gymnast-row" data-gymnast-id="${gymnast.id}">\n<td class="rank">${rankContent}</td>\n<td class="gymnast-name">${formattedName}</td>\n${scoreCellsHTML}\n</tr>\n`;
    }

    // --- Helper Function to Create Team Final Row HTML ---
    // NOTE: Team Final table still needs the country column as it's team-based
    function createTeamRowHTML(teamData, rank, medal = null) {
        const countryInfo = countryData[teamData.country] || countryData['DEFAULT'];
        const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span>` : '';
        let rankContent = rank !== null ? rank : '-';
        if (medal) {
            rankContent = `<span class="medal-${medal}">${rank}</span>`;
        }
        // Keep country column for team final display
        return `
            <tr class="team-row" data-country="${teamData.country}">
                <td class="rank">${rankContent}</td>
                <td class="country">${flagSpan} ${teamData.country}</td>
                <td class="score score-vt-total score-bold">${teamData.vt > 0 ? teamData.vt.toFixed(3) : '-'}</td>
                <td class="score score-ub-total score-bold">${teamData.ub > 0 ? teamData.ub.toFixed(3) : '-'}</td>
                <td class="score score-bb-total score-bold">${teamData.bb > 0 ? teamData.bb.toFixed(3) : '-'}</td>
                <td class="score score-fx-total score-bold">${teamData.fx > 0 ? teamData.fx.toFixed(3) : '-'}</td>
                <td class="score-total-overall score-bold">${teamData.total > 0 ? teamData.total.toFixed(3) : '-'}</td>
            </tr>
        `;
    }


    // --- Helper Function to Check if Scores are Valid (including zeros) ---
    function hasValidScores(phaseScores, dKey, eKey) {
        return (phaseScores[dKey] !== undefined && phaseScores[dKey] !== null) || 
               (phaseScores[eKey] !== undefined && phaseScores[eKey] !== null);
    }

    // --- Helper Function to Calculate Score for Sorting (Individual) ---
    function calculateSortScore(gymnast, phase, phaseScores) {
        let sortScore = 0;
         if (phase === 'qualifiers' || phase === 'team_final' || phase === 'aa_final') {
            apparatusList.forEach(app => {
                const dKey = `${app}_d`;
                const eKey = `${app}_e`;
                const pKey = `${app}_p`;
                const d = parseFloat(phaseScores[dKey]) || 0;
                const e = parseFloat(phaseScores[eKey]) || 0;
                const p = parseFloat(phaseScores[pKey]) || 0;
                if (hasValidScores(phaseScores, dKey, eKey)) sortScore += (d + e - p);
            });
        } else if (phase === 'vt_final') {
            const d1 = parseFloat(phaseScores.vt1_d) || 0;
            const e1 = parseFloat(phaseScores.vt1_e) || 0;
            const p1 = parseFloat(phaseScores.vt1_p) || 0;
            const hasValidScores1 = hasValidScores(phaseScores, 'vt1_d', 'vt1_e');
            const total1 = hasValidScores1 ? (d1 + e1 - p1) : 0;
            const d2 = parseFloat(phaseScores.vt2_d) || 0;
            const e2 = parseFloat(phaseScores.vt2_e) || 0;
            const p2 = parseFloat(phaseScores.vt2_p) || 0;
            const hasValidScores2 = hasValidScores(phaseScores, 'vt2_d', 'vt2_e');
            const total2 = hasValidScores2 ? (d2 + e2 - p2) : 0;
            sortScore = (total1 > 0 && total2 > 0) ? ((total1 + total2) / 2) : (total1 > 0 ? total1 : (total2 > 0 ? total2 : 0));
        } else if (phase.endsWith('_final')) {
            const d = parseFloat(phaseScores.d) || 0;
            const e = parseFloat(phaseScores.e) || 0;
            const p = parseFloat(phaseScores.p) || 0;
            if (hasValidScores(phaseScores, 'd', 'e')) sortScore = (d + e - p);
        }
        return sortScore;
    }


    // --- *** MOVED HELPER FUNCTIONS FOR SCORE CALCULATION *** ---
    function getAppScore(phaseScores, app) {
        // Helper to get D, E, P and calculate total for a single apparatus entry
        // Handles cases like 'vt1', 'vt2', or just 'vt', 'ub', etc.
        // Also handles apparatus finals where keys are just 'd', 'e', 'p'
        let dKey = `${app}_d`, eKey = `${app}_e`, pKey = `${app}_p`;

        // Adjust keys for apparatus finals (non-VT)
        if (!phaseScores.hasOwnProperty(dKey) && phaseScores.hasOwnProperty('d')) {
            dKey = 'd'; eKey = 'e'; pKey = 'p';
        }

        const d = parseFloat(phaseScores[dKey]) || 0;
        const e = parseFloat(phaseScores[eKey]) || 0;
        const p = parseFloat(phaseScores[pKey]) || 0;
        const total = hasValidScores(phaseScores, dKey, eKey) ? (d + e - p) : 0;
        return { d, e, p, total }; // Return object with components and total
    }

    function getQualifierVaultAverage(phaseScores) {
        // Calculates the average of two vaults, considering zeros as valid scores
        if (!phaseScores || !phaseScores.vt_intent) return 0; // Return 0 if no intent

        const vt1 = getAppScore(phaseScores, 'vt1');
        const vt2 = getAppScore(phaseScores, 'vt2');

        // Check if both vaults have valid scores (including zeros)
        const vt1Valid = hasValidScores(phaseScores, 'vt1_d', 'vt1_e');
        const vt2Valid = hasValidScores(phaseScores, 'vt2_d', 'vt2_e');

        if (vt1Valid && vt2Valid) {
            // If one vault is zero, average should be valid_score / 2
            if (vt1.total === 0 && vt2.total > 0) {
                return vt2.total / 2;
            } else if (vt2.total === 0 && vt1.total > 0) {
                return vt1.total / 2;
            } else {
                // Normal average (both > 0 or both = 0)
                return (vt1.total + vt2.total) / 2;
            }
        }
        // If only one vault has a score, or no scores, return 0
        return 0;
    }
    // --- *** END MOVED HELPER FUNCTIONS *** ---


    // --- Qualification Calculation Logic ---
    function calculateTeamScores(allGymnastData) {
        console.log("[calculateTeamScores] Starting calculation for Qualifiers.");
        const teamScores = {};
        const groupedByCountry = allGymnastData.reduce((acc, gymnast) => {
            const country = gymnast.country || 'Unknown';
            if (!acc[country]) acc[country] = [];
            acc[country].push(gymnast);
            return acc;
        }, {});

        for (const country in groupedByCountry) {
            teamScores[country] = { country: country, vt: 0, ub: 0, bb: 0, fx: 0, total: 0 };
            // console.log(`[calculateTeamScores] Processing country: ${country}`);
            apparatusList.forEach(app => {
                const scoresForApp = groupedByCountry[country]
                    .map(gymnast => {
                        const phaseScores = gymnast.scores?.qualifiers || {};
                        // Use VT1 score for team/AA qualification total
                        // *** THIS CALL SHOULD NOW WORK ***
                        const scoreToUse = (app === 'vt') ? getAppScore(phaseScores, 'vt1').total : getAppScore(phaseScores, app).total;
                        return scoreToUse;
                    })
                    .filter(score => score > 0) // Filter out zero scores
                    .sort((a, b) => b - a); // Sort descending

                // Sum the top 3 scores for the apparatus
                const top3Sum = scoresForApp.slice(0, 3).reduce((sum, score) => sum + score, 0);
                // console.log(`[calculateTeamScores] ${country} - ${app} Top 3 Sum: ${top3Sum.toFixed(3)}`);
                teamScores[country][app] = top3Sum;
                teamScores[country].total += top3Sum;
            });
            // console.log(`[calculateTeamScores] ${country} Final Total: ${teamScores[country].total.toFixed(3)}`);
        }
        const sortedTeams = Object.values(teamScores).sort((a, b) => b.total - a.total);
        console.log("[calculateTeamScores] Finished calculation. Results count:", sortedTeams.length);
        return sortedTeams;
    }

    function calculateAAScores(gymnastData) {
        console.log("[calculateAAScores] Starting calculation.");
        const aaScores = gymnastData.map(gymnast => {
            const phaseScores = gymnast.scores?.qualifiers || {};
            // Use VT1 for AA total
            // *** THESE CALLS SHOULD NOW WORK ***
            const vtScore = getAppScore(phaseScores, 'vt1').total;
            const ubScore = getAppScore(phaseScores, 'ub').total;
            const bbScore = getAppScore(phaseScores, 'bb').total;
            const fxScore = getAppScore(phaseScores, 'fx').total;
            const total = vtScore + ubScore + bbScore + fxScore;
            return { ...gymnast, aaTotal: total };
        }).filter(g => g.aaTotal > 0).sort((a, b) => b.aaTotal - a.aaTotal);
        console.log("[calculateAAScores] Finished calculation. Results count:", aaScores.length);
        return aaScores;
    }

    function calculateApparatusScores(gymnastData, apparatus) {
        console.log(`[calculateApparatusScores] Starting calculation for ${apparatus}.`);
        const appScores = gymnastData.map(gymnast => {
            const phaseScores = gymnast.scores?.qualifiers || {};
            let score = 0;
            if (apparatus === 'vt') {
                // Use average of 2 vaults IF intent is true and both scores > 0
                // *** THIS CALL SHOULD NOW WORK ***
                score = getQualifierVaultAverage(phaseScores);
            } else {
                // Use single apparatus score
                // *** THIS CALL SHOULD NOW WORK ***
                score = getAppScore(phaseScores, apparatus).total;
            }
            return { ...gymnast, apparatusScore: score };
        }).filter(g => g.apparatusScore > 0).sort((a, b) => b.apparatusScore - a.apparatusScore);
        console.log(`[calculateApparatusScores] Finished for ${apparatus}. Results count:`, appScores.length);
        return appScores;
    }

    // *** REVISED applyMaxPerCountry function ***
    function applyMaxPerCountry(sortedList, limit, maxPerCountry) {
        // Added 'limit' parameter (e.g., 24 for AA, 8 for Apparatus)
        // Note: 'limit' is the target maximum; the actual result might be fewer due to the maxPerCountry rule.
        console.log(`[applyMaxPerCountry] Applying max ${maxPerCountry}/country rule, aiming for up to ${limit} finalists from list of ${sortedList.length}.`);
        const qualified = [];
        const countryCount = {};
        let hitLimit = false; // Flag to check if limit was reached

        for (const gymnast of sortedList) {
            // Stop if we have reached the desired number of finalists
            if (qualified.length >= limit) {
                console.log(`[applyMaxPerCountry] Reached limit of ${limit}. Stopping search.`);
                hitLimit = true; // Set flag
                break;
            }

            const country = gymnast.country || 'Unknown';
            countryCount[country] = countryCount[country] || 0;

            if (countryCount[country] < maxPerCountry) {
                // console.log(`[applyMaxPerCountry] KEEPING (${qualified.length + 1}/${limit}): ${gymnast.name} (${country}). Count for ${country} is now ${countryCount[country] + 1}.`); // Reduced noise
                qualified.push(gymnast);
                countryCount[country]++;
            } else {
                // console.log(`[applyMaxPerCountry] SKIPPING: ${gymnast.name} (${country}). Count for ${country} (${countryCount[country]}) already reached limit (${maxPerCountry}).`); // Reduced noise
            }
        }

        // *** ADDED: Log reason for loop termination ***
        if (!hitLimit && qualified.length < limit) { // Check if limit wasn't reached
            console.log(`[applyMaxPerCountry] Finished search: Processed all ${sortedList.length} athletes but only found ${qualified.length} eligible finalists (target was ${limit}).`);
        }
        console.log(`[applyMaxPerCountry] Final result: Found ${qualified.length} finalists. Final country counts:`, countryCount);
        return qualified; // Return the list of finalists (up to 'limit')
    }
    // --- *** END Qualification Calculation Logic *** ---


    // --- Calculate Team Final Scores (3-up, 3-count) ---
    function calculateTeamFinalScores(allGymnastData) {
        console.log("[calculateTeamFinalScores] Starting calculation.");
        const teamScores = {};
        const groupedByCountry = allGymnastData.reduce((acc, gymnast) => {
            const country = gymnast.country || 'Unknown';
            if (!acc[country]) acc[country] = [];
            acc[country].push(gymnast);
            return acc;
        }, {});

        for (const country in groupedByCountry) {
            teamScores[country] = { country: country, vt: 0, ub: 0, bb: 0, fx: 0, total: 0 };
            console.log(`[calculateTeamFinalScores] Processing country: ${country}`);
            apparatusList.forEach(app => {
                let apparatusTotal = 0;
                console.log(`[calculateTeamFinalScores]   Apparatus: ${app.toUpperCase()}`); // Log apparatus
                groupedByCountry[country].forEach(gymnast => {
                    const phaseScores = gymnast.scores?.team_final || {};
                    // *** USE NEW FLAG ***
                    if (phaseScores[`competes_on_${app}`]) { // Check specific apparatus flag
                        console.log(`[calculateTeamFinalScores]     Checking ${gymnast.name} (Competes: Yes)`); // Log gymnast check
                        const d = parseFloat(phaseScores[`${app}_d`]) || 0;
                        const e = parseFloat(phaseScores[`${app}_e`]) || 0;
                        const p = parseFloat(phaseScores[`${app}_p`]) || 0;
                        if (d > 0 || e > 0) {
                            const score = d + e - p;
                            apparatusTotal += score;
                            // *** CHANGE: More detailed log ***
                            console.log(`[calculateTeamFinalScores]       ${gymnast.name} - ${app.toUpperCase()}: D=${d}, E=${e}, P=${p}, Score=${score.toFixed(3)}. Current App Total: ${apparatusTotal.toFixed(3)}`);
                        } else {
                            console.log(`[calculateTeamFinalScores]       ${gymnast.name} - ${app.toUpperCase()}: No valid D/E score found.`); // Log if no score
                        }
                    } else {
                         // console.log(`[calculateTeamFinalScores]     Checking ${gymnast.name} (Competes: No)`); // Optional log for non-competitors
                    }
                });
                // *** CHANGE: Log final apparatus total before assignment ***
                console.log(`[calculateTeamFinalScores]   ${country} - ${app.toUpperCase()} Final Apparatus Total: ${apparatusTotal.toFixed(3)}`);
                teamScores[country][app] = apparatusTotal;
                teamScores[country].total += apparatusTotal;
            });
             console.log(`[calculateTeamFinalScores] ${country} Final Overall Total: ${teamScores[country].total.toFixed(3)}`);
        }
        const sortedTeams = Object.values(teamScores).sort((a, b) => b.total - a.total);
        console.log("[calculateTeamFinalScores] Finished calculation. Results:", sortedTeams);
        return sortedTeams;
    }


    // --- Render Qualification Summaries ---
    function renderQualificationSummaries(allGymnastData) {
        console.log("[renderQualificationSummaries] Started.");
        const summariesContainer = document.getElementById('qualification-summaries');

        if (!summariesContainer) {
            console.error("[renderQualificationSummaries] CRITICAL: #qualification-summaries container NOT FOUND. Aborting.");
            return;
        }
        // console.log(`[renderQualificationSummaries] Found summariesContainer. Initial display style: '${summariesContainer.style.display}'`); // Reduced noise

        // *** Re-verify elements inside the function for safety ***
        const teamBody = summariesContainer.querySelector('#team-qualifiers tbody');
        const aaBody = summariesContainer.querySelector('#aa-qualifiers tbody');
        const vtBody = summariesContainer.querySelector('#vt-finalists-body');
        const ubBody = summariesContainer.querySelector('#ub-finalists-body');
        const bbBody = summariesContainer.querySelector('#bb-finalists-body');
        const fxBody = summariesContainer.querySelector('#fx-finalists-body');

        // Check if elements exist *before* trying to use them
        if (!teamBody || !aaBody || !vtBody || !ubBody || !bbBody || !fxBody) {
            console.error("[renderQualificationSummaries] One or more summary table bodies missing. Aborting render.");
            summariesContainer.style.display = 'none'; // Ensure hidden
            return;
        }
        // console.log("[renderQualificationSummaries] All summary elements found."); // Reduced noise

        // Clear previous summaries
        teamBody.innerHTML = '';
        aaBody.innerHTML = '';
        vtBody.innerHTML = '';
        ubBody.innerHTML = '';
        bbBody.innerHTML = '';
        fxBody.innerHTML = '';
        // console.log("[renderQualificationSummaries] Previous summaries cleared."); // Reduced logging noise

        try {
            // 1. Team Qualifiers
            // console.log("[renderQualificationSummaries] Rendering Team qualifiers summary."); // Reduced noise
            const teamResults = calculateTeamScores(allGymnastData);
            teamBody.innerHTML = ''; // Clear previous
            teamResults.slice(0, 8).forEach((team, index) => {
                 const countryInfo = countryData[team.country] || countryData['DEFAULT'];
                 const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span>` : '';
                 teamBody.innerHTML += `
                    <tr>
                        <td class="rank">${index + 1}</td>
                        <td class="country">${flagSpan} ${team.country}</td>
                        <td class="score score-bold">${team.total.toFixed(3)}</td>
                    </tr>`;
            });
            // console.log("[renderQualificationSummaries] Team qualifiers summary rendered."); // Reduced noise

            // 2. AA Qualifiers
            console.log("[renderQualificationSummaries] Rendering AA qualifiers summary.");
            const aaResults = calculateAAScores(allGymnastData);
            // *** USE REVISED FUNCTION *** Pass 24 as the target limit
            const aaFinalists = applyMaxPerCountry(aaResults, 24, 2);
            console.log(`[renderQualificationSummaries] Found ${aaFinalists.length} AA finalists for summary (target was 24).`); // Log actual count
            aaBody.innerHTML = ''; // Clear previous
            let aaRowsRendered = 0; // Counter for AA summary rows
            aaFinalists.forEach((gymnast, index) => {
                 const countryInfo = countryData[gymnast.country] || countryData['DEFAULT'];
                 const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span>` : '';
                 const formattedName = `${flagSpan} ${gymnast.name || 'N/A'}`;
                 // console.log(`[renderQualificationSummaries] Adding AA Summary Row: ${index + 1}. ${gymnast.name} (${gymnast.aaTotal.toFixed(3)})`); // Optional detailed log

                 // *** ADD try...catch around innerHTML modification ***
                 try {
                     // Check if aaTotal exists and is a number before calling toFixed
                     const scoreDisplay = (typeof gymnast.aaTotal === 'number') ? gymnast.aaTotal.toFixed(3) : '-';
                     const rowHTML = `
                        <tr>
                            <td class="rank">${index + 1}</td>
                            <td class="gymnast-name">${formattedName}</td>
                            <td class="score score-bold">${scoreDisplay}</td>
                        </tr>`;
                     aaBody.innerHTML += rowHTML; // Append row HTML
                     aaRowsRendered++; // Increment counter on success
                 } catch (e) {
                     console.error(`[renderQualificationSummaries] Error adding AA summary row for ${gymnast.name} (Index: ${index}):`, e);
                 }
            });
            // *** ADDED LOG: Report how many AA rows were actually added ***
            console.log(`[renderQualificationSummaries] Successfully added ${aaRowsRendered} rows to AA summary table.`); // Check this log
            console.log("[renderQualificationSummaries] AA qualifiers summary rendered.");


            // 3. Apparatus Qualifiers
            console.log("[renderQualificationSummaries] Rendering Apparatus qualifiers summaries.");
            // Clear all apparatus bodies first
            vtBody.innerHTML = ''; ubBody.innerHTML = ''; bbBody.innerHTML = ''; fxBody.innerHTML = '';
            apparatusList.forEach(app => {
                const appResults = calculateApparatusScores(allGymnastData, app);
                const appFinalists = applyMaxPerCountry(appResults, 8, 2); // Pass 8 as limit
                console.log(`[renderQualificationSummaries] Found ${appFinalists.length} ${app.toUpperCase()} finalists for summary.`);
                let targetBody;
                // Assign targetBody based on app
                if (app === 'vt') targetBody = vtBody;
                else if (app === 'ub') targetBody = ubBody;
                else if (app === 'bb') targetBody = bbBody;
                else if (app === 'fx') targetBody = fxBody;

                if (targetBody) {
                    let appRowsRendered = 0; // Counter for apparatus summary rows
                    appFinalists.forEach((gymnast, index) => {
                        const countryInfo = countryData[gymnast.country] || countryData['DEFAULT'];
                        const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span>` : '';
                        const formattedName = `${flagSpan} ${gymnast.name || 'N/A'}`;

                        // *** ADD try...catch around innerHTML modification ***
                        try {
                             // Check if apparatusScore exists and is a number
                             const scoreDisplay = (typeof gymnast.apparatusScore === 'number') ? gymnast.apparatusScore.toFixed(3) : '-';
                             const rowHTML = `
                                 <tr>
                                     <td class="rank">${index + 1}</td>
                                     <td class="gymnast-name">${formattedName}</td>
                                     <td class="score score-bold">${scoreDisplay}</td>
                                 </tr>`;
                             targetBody.innerHTML += rowHTML;
                             appRowsRendered++; // Increment counter on success
                        } catch (e) {
                             console.error(`[renderQualificationSummaries] Error adding ${app.toUpperCase()} summary row for ${gymnast.name} (Index: ${index}):`, e);
                        }
                     });
                     console.log(`[renderQualificationSummaries] Successfully added ${appRowsRendered} rows to ${app.toUpperCase()} summary table.`);
                } else {
                     console.warn(`[renderQualificationSummaries] Target body not found for apparatus: ${app}`);
                }
            });


            // Make sure the container is visible *after* successful rendering
            // console.log("[renderQualificationSummaries] Attempting to set display to 'block'."); // Reduced noise
            summariesContainer.style.display = 'block';
            // console.log(`[renderQualificationSummaries] Display successfully set to 'block'. Current style: '${summariesContainer.style.display}'`); // Reduced noise

        } catch (error) {
            console.error("[renderQualificationSummaries] Error during calculation/rendering:", error); // LOG THE ERROR OBJECT
            // Hide summaries on error
            console.log("[renderQualificationSummaries] Hiding summaries due to error.");
            summariesContainer.style.display = 'none';
            // console.log(`[renderQualificationSummaries] Display set to 'none' due to error. Current style: '${summariesContainer.style.display}'`); // Reduced noise
        }
        console.log("[renderQualificationSummaries] Finished.");
    }


    // --- Exibir Ginasta Atual no Painel ---
    function renderCurrentGymnastPanel(allGymnastData, selectedPhase) {
        const panel = document.getElementById('current-gymnast-panel');
        if (!panel) return;
        // Lógica: ginasta atual é o primeiro da lista da fase atual (após filtro e ordenação)
        let currentGymnast = null;
        if (selectedPhase === 'team_final') {
            // Não exibe ginasta atual para final por equipes
            panel.innerHTML = '';
            return;
        }
        // Filtra e ordena igual à tabela principal
        let dataToDisplay = [];
        if (selectedPhase === 'qualifiers') {
            dataToDisplay = allGymnastData;
        } else if (selectedPhase === 'aa_final') {
            const aaQualifiersRaw = calculateAAScores(allGymnastData);
            const aaFinalistAthletes = applyMaxPerCountry(aaQualifiersRaw, 24, 2);
            const aaFinalistIDs = aaFinalistAthletes.map(a => a.id);
            dataToDisplay = allGymnastData.filter(gymnast => aaFinalistIDs.includes(gymnast.id));
        } else if (selectedPhase.endsWith('_final')) {
            const apparatus = selectedPhase.split('_')[0];
            const appQualifiersRaw = calculateApparatusScores(allGymnastData, apparatus);
            const appFinalistAthletes = applyMaxPerCountry(appQualifiersRaw, 8, 2);
            const appFinalistIDs = appFinalistAthletes.map(a => a.id);
            dataToDisplay = allGymnastData.filter(gymnast => appFinalistIDs.includes(gymnast.id));
        }
        // Ordena por score da fase
        let sorted = dataToDisplay.map(gymnast => {
            const phaseScores = gymnast.scores?.[selectedPhase] || {};
            const sortScore = calculateSortScore(gymnast, selectedPhase, phaseScores);
            return { ...gymnast, sortScore, phaseScores };
        }).sort((a, b) => b.sortScore - a.sortScore);
        currentGymnast = sorted.length > 0 ? sorted[0] : null;
        if (!currentGymnast) {
            panel.innerHTML = '';
            return;
        }
        // Renderiza o painel
        const countryInfo = countryData[currentGymnast.country] || countryData['DEFAULT'];
        const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span>` : '';
        panel.innerHTML = `
            <div class="current-gymnast-block">
                <strong>Ginasta Atual:</strong><br>
                <span class="gymnast-name">${flagSpan} ${currentGymnast.name}</span><br>
                <span class="country-name">${currentGymnast.country}</span>
            </div>
        `;
    }

    // --- Main Display Function (Adaptada) ---
    // Agora ela não carrega mais dados, apenas usa a variável global allGymnastData
    function calculateAndDisplayScores() {
        const selectedPhase = phaseSelect.value;
        console.log(`[calculateAndDisplayScores] Phase selected: ${selectedPhase}. Usando ${allGymnastData.length} atletas da memória.`);
        generateTableHeader(selectedPhase); // Update header FIRST

        // Verifica se temos dados (preenchidos pelo listener do Firestore)
        if (!allGymnastData || allGymnastData.length === 0) {
            console.warn("[calculateAndDisplayScores] allGymnastData está vazio. Aguardando dados do Firestore...");
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="100%">Aguardando dados...</td></tr>';
            // Esconde sumários se não houver dados
            const summariesContainer = document.getElementById('qualification-summaries');
             if (summariesContainer) summariesContainer.style.display = 'none';
            return; // Sai se não há dados
        }

        // LOG: Dados processados (agora da memória)
        console.log('[LOG] Estrutura de dados em memória:', allGymnastData);

        // Clear existing main table body
        if (tableBody) tableBody.innerHTML = '';
        else { console.error("CRITICAL: #scoreboard-tbody not found!"); return; }

        // Reset summaries display initially
        const summariesContainer = document.getElementById('qualification-summaries');
        if (summariesContainer) {
            summariesContainer.style.display = 'none';
        } else {
             console.error("[calculateAndDisplayScores] Could not find #qualification-summaries to hide initially.");
        }

        // --- O restante da função continua igual, pois opera sobre allGymnastData ---
        // --- Determine which athletes/teams to display based on phase ---
        let dataToDisplay = [];
        let isFinal = selectedPhase.endsWith('_final');
        let isTeamFinal = selectedPhase === 'team_final';
        let isQualifiers = selectedPhase === 'qualifiers';
        let rowsRenderedCount = 0;

        if (isQualifiers) {
            dataToDisplay = allGymnastData;
        }
        else if (isTeamFinal) {
            // 1. Get Top 8 qualifying teams based on qualifier scores
            const qualifyingTeamsData = calculateTeamScores(allGymnastData).slice(0, 8);
            const qualifyingCountryCodes = qualifyingTeamsData.map(team => team.country);
            console.log("[calculateAndDisplayScores] Qualifying Countries for Team Final:", qualifyingCountryCodes); // Log qualifying countries
            // 2. Filter all gymnast data to include only athletes from these countries
            const athletesFromQualifyingTeams = allGymnastData.filter(gymnast => qualifyingCountryCodes.includes(gymnast.country));
            console.log(`[calculateAndDisplayScores] Found ${athletesFromQualifyingTeams.length} athletes from qualifying teams.`); // Log athlete count
            // 3. Calculate final scores for these teams using team_final scores
            dataToDisplay = calculateTeamFinalScores(athletesFromQualifyingTeams); // Already sorted
            console.log("[calculateAndDisplayScores] Team Final scores calculated:", dataToDisplay); // Log the final calculated data
        }
        else if (selectedPhase === 'aa_final') {
            console.log("[calculateAndDisplayScores] Phase is AA Final. Calculating qualifiers and filtering athletes.");
            // 1. Get Top AA qualifiers (max 2/country, aiming for up to 24)
            const aaQualifiersRaw = calculateAAScores(allGymnastData); // Calculates scores and sorts all athletes
            // *** USE REVISED FUNCTION *** Pass 24 as the target limit
            const aaFinalistAthletes = applyMaxPerCountry(aaQualifiersRaw, 24, 2); // Apply rule, aiming for up to 24 finalists
            const aaFinalistIDs = aaFinalistAthletes.map(a => a.id);

            // *** Log the result of the revised function ***
            console.log(`[calculateAndDisplayScores] AA Qualifiers Raw: ${aaQualifiersRaw.length}, After applyMaxPerCountry(target 24, max 2/country): ${aaFinalistAthletes.length}`); // Log actual count found

            // 2. Filter all gymnast data to include only these athletes
            dataToDisplay = allGymnastData.filter(gymnast => aaFinalistIDs.includes(gymnast.id));
            console.log(`[calculateAndDisplayScores] dataToDisplay count after filtering by IDs: ${dataToDisplay.length}`);
        }
        else if (selectedPhase.endsWith('_final')) { // Apparatus Finals (vt, ub, bb, fx)
            const apparatus = selectedPhase.split('_')[0];
            // console.log(`[calculateAndDisplayScores] Phase is ${apparatus.toUpperCase()} Final. Calculating qualifiers and filtering athletes.`); // Reduced logging noise
            // 1. Get Top 8 qualifiers for this apparatus (max 2/country)
            const appQualifiersRaw = calculateApparatusScores(allGymnastData, apparatus);
            // *** USE REVISED FUNCTION *** Pass 8 as the limit
            const appFinalistAthletes = applyMaxPerCountry(appQualifiersRaw, 8, 2); // Apply rule, aiming for 8 finalists
            const appFinalistIDs = appFinalistAthletes.map(a => a.id);
            console.log(`[calculateAndDisplayScores] Found ${appFinalistIDs.length} ${apparatus.toUpperCase()} Finalist IDs.`);
            // 2. Filter all gymnast data to include only these athletes
            dataToDisplay = allGymnastData.filter(gymnast => appFinalistIDs.includes(gymnast.id));
        }
        else {
            console.warn(`[calculateAndDisplayScores] Unknown phase selected: ${selectedPhase}. Displaying empty table.`);
            dataToDisplay = []; // Should not happen with dropdown, but safety check
        }


        // --- Render the main table based on filtered data ---
        if (isTeamFinal) { // Team Final uses createTeamRowHTML (which still has country)
            // --- Medal Logic for Teams ---
            const finalScores = dataToDisplay.map(t => t.total).filter(s => s > 0);
            const goldScore = finalScores[0] ?? -1;
            const silverScore = finalScores[1] ?? -1;
            const bronzeScore = finalScores[2] ?? -1;

            dataToDisplay.forEach((team, index) => {
                const rank = team.total > 0 ? index + 1 : null;
                let medal = null;
                if (isFinal && rank === 1 && team.total === goldScore) medal = 'gold';
                else if (isFinal && rank === 2 && team.total === silverScore) medal = 'silver';
                // Handle tie for silver (no bronze)
                else if (isFinal && rank === 3 && team.total === bronzeScore && silverScore !== bronzeScore) medal = 'bronze';
                // Handle tie for gold (no silver, potentially bronze at 3rd distinct score)
                else if (isFinal && rank === 3 && team.total === bronzeScore && goldScore === silverScore && silverScore !== bronzeScore) medal = 'bronze';


                console.log(`[calculateAndDisplayScores] Rendering Team Row ${index + 1}: ${team.country}, Total: ${team.total}`); // Log before rendering row
                tableBody.insertAdjacentHTML('beforeend', createTeamRowHTML(team, rank, medal)); // Pass medal
            });
            // console.log(`[calculateAndDisplayScores] Rendered ${dataToDisplay.length} team rows.`); // Reduced logging noise
        } else {
            // Render Individual rows (Qualifiers, AA Final, App Finals)
            // Need to calculate sort scores for the *current* phase using the filtered data
            let gymnastDataForPhase = dataToDisplay.map(gymnast => {
                 const phaseScores = gymnast.scores?.[selectedPhase] || {};
                 const sortScore = calculateSortScore(gymnast, selectedPhase, phaseScores);
                 // *** Existing LOG ***
                 // console.log(`[calculateAndDisplayScores] Mapping for sort: ${gymnast.name}, Phase: ${selectedPhase}, Calculated Sort Score: ${sortScore}`); // Reduced logging noise
                 return {
                     ...gymnast,
                     displayScores: phaseScores,
                     sortScore: sortScore
                 };
            }).sort((a, b) => b.sortScore - a.sortScore); // Sort the finalists

            // --- Medal Logic for Individuals ---
            const finalScores = gymnastDataForPhase.map(g => g.sortScore).filter(s => s > 0);
            const goldScore = finalScores[0] ?? -1;
            const silverScore = finalScores[1] ?? -1;
            const bronzeScore = finalScores[2] ?? -1;

            gymnastDataForPhase.forEach((gymnast, index) => {
                const rank = gymnast.sortScore > 0 ? index + 1 : null;
                let medal = null;
                // Assign medals only if it's a final phase
                if (isFinal && rank === 1 && gymnast.sortScore === goldScore) medal = 'gold';
                else if (isFinal && rank === 2 && gymnast.sortScore === silverScore) medal = 'silver';
                 // Handle tie for silver (no bronze)
                else if (isFinal && rank === 3 && gymnast.sortScore === bronzeScore && silverScore !== bronzeScore) medal = 'bronze';
                 // Handle tie for gold (no silver, potentially bronze at 3rd distinct score)
                else if (isFinal && rank === 3 && gymnast.sortScore === bronzeScore && goldScore === silverScore && silverScore !== bronzeScore) medal = 'bronze';

                // *** Existing LOG and TRY/CATCH ***
                // console.log(`[Rendering Row] Index: ${index}, Rank: ${rank}, Name: ${gymnast.name}, Score: ${gymnast.sortScore}`); // Reduced logging noise
                try {
                    const rowHTML = createTableRowHTML(gymnast, rank, selectedPhase, gymnast.displayScores, medal); // Generate HTML first
                    if (tableBody && rowHTML) { // Check if tableBody and HTML exist
                         tableBody.insertAdjacentHTML('beforeend', rowHTML); // Pass medal
                    } else {
                         console.warn(`[Rendering Row] Skipping row for ${gymnast.name} - tableBody or rowHTML missing.`);
                    }
                } catch (e) {
                    console.error(`[Rendering Row] Error rendering row for gymnast ${gymnast.name} (Index: ${index}):`, e);
                    // Continue to the next gymnast even if one row fails
                }
            });
             // *** Existing UPDATED LOG ***
             console.log(`[calculateAndDisplayScores] Attempted to render ${gymnastDataForPhase.length} individual rows. Successfully rendered: ${rowsRenderedCount}.`);
        }

        // --- Show Qualification Summaries ONLY if phase is qualifiers ---
        if (selectedPhase === 'qualifiers') {
            // console.log(`[calculateAndDisplayScores] Condition MET: selectedPhase is '${selectedPhase}'.`); // LOG CONDITION MET
            if (allGymnastData && allGymnastData.length > 0) { // Check if data exists and has items
                 // console.log(`[calculateAndDisplayScores] Data check PASSED: allGymnastData has ${allGymnastData.length} items. Calling renderQualificationSummaries.`); // LOG DATA CHECK
                 renderQualificationSummaries(allGymnastData);
            } else {
                 // console.log(`[calculateAndDisplayScores] Data check FAILED: allGymnastData is empty or null (${allGymnastData?.length}). Skipping summary rendering.`); // LOG DATA CHECK FAILED
                 // Ensure summaries are hidden if no data
                 const summariesContainer = document.getElementById('qualification-summaries');
                 if (summariesContainer) summariesContainer.style.display = 'none';
            }
        } else {
             // console.log(`[calculateAndDisplayScores] Condition NOT MET: selectedPhase is '${selectedPhase}'. Summaries remain hidden.`); // LOG CONDITION NOT MET
             // Ensure summaries are hidden if not qualifiers phase
             const summariesContainer = document.getElementById('qualification-summaries');
             if (summariesContainer) summariesContainer.style.display = 'none';
        }

        // Exibe ginasta atual
        renderCurrentGymnastPanel(allGymnastData, selectedPhase);
    }

    // --- Event Listeners ---
    if (refreshButton) {
        // O botão refresh agora apenas re-renderiza com os dados locais mais recentes
        refreshButton.addEventListener('click', calculateAndDisplayScores);
    }
    if (phaseSelect) {
        phaseSelect.addEventListener('change', calculateAndDisplayScores); // Update on phase change
    }

    // --- REMOVA Sincronização via BroadcastChannel ---
    // try { broadcastChannel = new BroadcastChannel... } catch ... // REMOVIDO

    // --- ADD Firestore Listener ---
    // Troque para a nova coleção normalizada
    const gymnastsCol = collection(db, "new_gymnasts");
    onSnapshot(gymnastsCol, (snapshot) => {
        console.log("[Firestore Listener - Scoreboard] Snapshot recebido.");
        let updatedData = [];
        snapshot.forEach((doc) => {
            updatedData.push(doc.data());
        });
        allGymnastData = updatedData; // ATUALIZA A CÓPIA LOCAL
        console.log(`[Firestore Listener - Scoreboard] Cópia local atualizada com ${allGymnastData.length} atletas.`);

        // Chama a função principal para re-renderizar a UI com os novos dados
        calculateAndDisplayScores();

    }, (error) => {
        console.error("[Firestore Listener - Scoreboard] Erro ao ouvir coleção 'new_gymnasts': ", error);
    });

    // Retorna uma função para cancelar a inscrição (unsubscribe)
    return () => {
        unsubscribe();
        console.log("[Firestore Listener - Scoreboard] Unsubscribed from 'new_gymnasts' collection.");
    };
});

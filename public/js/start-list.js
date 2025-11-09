// public/js/start-list.js

// --- FIREBASE V8 GLOBALS (firebase-init.js) ---
// Firebase v8 globals já inicializados via firebase-init.js
// ATENÇÃO: Este arquivo usa sintaxe Firebase v9+ e precisa ser convertido para v8 se for usado
// As funções collection(), doc(), getDoc(), setDoc(), onSnapshot() precisam ser convertidas para db.collection(), etc.

// --- *** IMPORT CALCULATION LOGIC *** ---
import {
    apparatusList,
    calculateAAScores,
    calculateApparatusScores,
    applyMaxPerCountry,
    calculateTeamScores
} from './calculation-logic.js'; // Adjust path if necessary

// --- GLOBAL DATA ---
let allGymnastData = [];
const rotationOrder = ['vt', 'ub', 'bb', 'fx'];
let phaseSelect, startListContainer;
let unsubscribeGymnasts = null;

// --- Country Data Mapping ---
const countryData = window.countryData || { /* ... Data remains the same ... */ 'USA': { name: 'UNITED STATES OF AMERICA', flag: '🇺🇸', symbol: '🔵', color: '#0078d0', code: 'us' }, 'BRA': { name: 'BRAZIL', flag: '🇧🇷', symbol: '🟢', color: '#198754', code: 'br' }, 'CAN': { name: 'CANADA', flag: '🇨🇦', symbol: '🔴', color: '#dc3545', code: 'ca' }, 'ITA': { name: 'ITALY', flag: '🇮🇹', symbol: '✳️', color: '#198754', code: 'it' }, 'ROM': { name: 'ROMANIA', flag: '🇷🇴', symbol: '🟡', color: '#ffc107', code: 'ro' }, 'CHN': { name: 'PEOPLE\'S REPUBLIC OF CHINA', flag: '🇨🇳', symbol: '🈴️', color: '#dc3545', code: 'cn' }, 'GBR': { name: 'GREAT BRITAIN', flag: '🇬🇧', symbol: '🟣', color: '#6f42c1', code: 'gb' }, 'FRA': { name: 'FRANCE', flag: '🇫🇷', symbol: '🔷️', color: '#0d6efd', code: 'fr' }, 'DEFAULT': { name: '', flag: '', symbol: '', color: '#6c757d', code: '' } };

// --- Load Data ---
async function loadAllData() {
    console.log("[start-list.js - loadAllData] Loading data...");
    if (unsubscribeGymnasts) {
        console.log("[start-list.js] Unsubscribing previous listener.");
        unsubscribeGymnasts();
    }
    const gymnastsCol = collection(db, "new_gymnasts");
    unsubscribeGymnasts = onSnapshot(gymnastsCol, (snapshot) => {
        let updatedData = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.id) { // Ensure ID exists, fallback to doc.id if not in data
                data.id = doc.id;
            }
            updatedData.push(data);
        });
        allGymnastData = updatedData;
        console.log(`[start-list.js] Data updated (${allGymnastData.length}). Checking phase.`);
        if (phaseSelect && startListContainer && allGymnastData.length > 0) {
            handlePhaseChange(false); // Don't force generate, try to load existing first
        } else if (allGymnastData.length === 0) {
            console.warn("[start-list.js] No gymnast data loaded yet.");
            if (startListContainer) {
                startListContainer.innerHTML = '<p>Aguardando dados das ginastas...</p>';
            }
        }
    }, (error) => {
        console.error("[start-list.js] Error listening to gymnasts collection:", error);
        if(startListContainer) startListContainer.innerHTML = '<p style="color:red;">Erro ao carregar dados das ginastas.</p>';
    });
}

// --- Button and Phase Label Functions ---
function addStartListButtons() {
    const controlsDiv = document.getElementById('start-list-controls');
    if (!controlsDiv || !phaseSelect) return;

    controlsDiv.innerHTML = ''; // Clear previous buttons

    const phases = [
        { value: 'qualifiers', label: 'Qualificatórias' },
        { value: 'team_final', label: 'Final por Equipes' },
        { value: 'aa_final', label: 'Final Individual Geral' },
        { value: 'vt_final', label: 'Final - Salto (VT)' },
        { value: 'ub_final', label: 'Final - Barras Assimétricas (UB)' },
        { value: 'bb_final', label: 'Final - Trave (BB)' },
        { value: 'fx_final', label: 'Final - Solo (FX)' }
    ];

    const phase = phaseSelect.value;
    const phaseObj = phases.find(p => p.value === phase);

    if (phaseObj) {
        const btn = document.createElement('button');
        btn.className = 'olympic-button';
        btn.textContent = `Gerar/Atualizar Start List (${phaseObj.label})`;
        btn.onclick = () => handlePhaseChange(true); // Force generate on click
        controlsDiv.appendChild(btn);
    }

    // Add PDF export button if a start list is currently loaded and not empty/error
    const currentListExists = window._lastStartList?.phase === phase &&
                              window._lastStartList?.structure?.type !== 'empty' &&
                              window._lastStartList?.structure?.type !== 'error';

    if (currentListExists) {        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'olympic-button secondary-button';
        pdfBtn.textContent = 'Exportar PDF';
        pdfBtn.style.marginLeft = '1rem'; // Add some space
        pdfBtn.onclick = () => {
            // Add print-specific classes before printing
            document.body.classList.add('printing');
            window.print();
            // Remove classes after printing
            setTimeout(() => {
                document.body.classList.remove('printing');
            }, 1000);
        };
        controlsDiv.appendChild(pdfBtn);
    } else {
        // console.log(`[start-list.js] PDF button not shown. Current phase: ${phase}, Last list phase: ${window._lastStartList?.phase}, Type: ${window._lastStartList?.structure?.type}`);
    }
}

function phaseLabel(phase) {
    const phaseMap = {
        qualifiers: "Qualificatórias",
        team_final: "Final por Equipes",
        aa_final: "Final Individual Geral",
        vt_final: "Final - Salto (VT)",
        ub_final: "Final - Barras Assimétricas (UB)",
        bb_final: "Final - Trave (BB)",
        fx_final: "Final - Solo (FX)"
    };
    return phaseMap[phase] || phase;
}


// --- Geração de Start List por Fase ---
function generateStartListStructure(phase, athletes) {
    console.log(`[start-list.js - generateStartListStructure] Phase: ${phase}, Number of Athletes: ${athletes.length}`);

    const shuffle = (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex] ] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    const mapAthlete = g => ({ id: g.id, name: g.name, country: g.country });

    const byCountry = {};
    athletes.forEach(g => {
        if (!byCountry[g.country]) byCountry[g.country] = [];
        byCountry[g.country].push(g);
    });

    if (phase === 'qualifiers') {
        // All 4 countries compete in a single subdivision for qualifiers
        let countries = Object.keys(byCountry);
        console.log(`[GenStartList QF] Countries for qualifiers: ${countries.join(', ')}`);

        function makeSingleSubdivision(countryList) {
            if (countryList.length === 0) return [];
            const countriesShuffled = shuffle([...countryList]);
            const countryGymnasts = {};
            countriesShuffled.forEach(country => {
                // All 4 gymnasts per country compete
                countryGymnasts[country] = shuffle([...byCountry[country]]);
            });

            const rotations = [];
            const numCountriesInSub = countriesShuffled.length;

            for (let rot = 0; rot < 4; rot++) { // 4 Rotations
                const rotation = { startApp: rotationOrder[rot], apparatus: {} };
                apparatusList.forEach(app => rotation.apparatus[app] = []); // Init all apparatus

                for (let i = 0; i < numCountriesInSub; i++) {
                    const country = countriesShuffled[i];
                    const appIndex = (i + rot) % 4; // Determine apparatus for the country in this rotation
                    const app = rotationOrder[appIndex];
                    if (countryGymnasts[country]) {
                        rotation.apparatus[app] = (rotation.apparatus[app] || []).concat(countryGymnasts[country].map(mapAthlete));
                    }
                }
                rotations.push(rotation);
            }
            return rotations;
        }
        const subdivisions = [];
        if (countries.length > 0) {
            subdivisions.push({ 
                label: `Qualifiers - Subdivision 1 (${countries.join(', ')})`, 
                rotations: makeSingleSubdivision(countries), 
                countries: countries 
            });
        }
        return { type: 'qualifiers', subdivisions };
    }    else if (phase === 'team_final') {
        // For team final, we need to show only athletes that are actually competing
        // based on the competes_on flags set in the modal
        let countries = Object.keys(byCountry); // these are the 4 qualified countries
        countries = shuffle([...countries]); // Shuffle order of teams

        const numTeams = countries.length;
        if (numTeams !== 4) {
            console.warn(`[GenStartList TF] Expected 4 teams for final, found ${numTeams}. Start list might be unusual.`);
        }

        const rotations = [];
        for (let rot = 0; rot < 4; rot++) { // 4 Rotations
            const rotation = { startApp: rotationOrder[rot], apparatus: {} };
            apparatusList.forEach(app => rotation.apparatus[app] = []); // Init all apparatus

            // Assign 1 team per apparatus in a standard Olympic order rotation
            for (let teamIdx = 0; teamIdx < numTeams; teamIdx++) {
                const country = countries[teamIdx];
                const currentApp = rotationOrder[(teamIdx + rot) % 4]; // Team `teamIdx` starts on `rotationOrder[rot]`, then progresses
                
                if (byCountry[country]) {
                    // For Team Final start list, only show athletes who are actually competing on this apparatus
                    // Filter by the competes_on flags from Firebase
                    const competingAthletes = byCountry[country].filter(athlete => {
                        const teamFinalScores = athlete.scores?.team_final || {};
                        return teamFinalScores[`competes_on_${currentApp}`] === true;
                    });
                    
                    rotation.apparatus[currentApp] = (rotation.apparatus[currentApp] || []).concat(competingAthletes.map(mapAthlete));
                }
            }
            // Shuffle athletes within each apparatus for display order
            apparatusList.forEach(app => {
                if (rotation.apparatus[app]) {
                    rotation.apparatus[app] = shuffle(rotation.apparatus[app]);
                }
            });
            rotations.push(rotation);
        }
        return { type: 'team_final', rotations, countries };
    }
    else if (phase === 'aa_final') {
        let na = athletes.length; // 'athletes' should be the actual AA finalists (e.g., 6, 16, or up to 24)
        console.log(`[GenStartList AA] Initial athletes for AA Final: ${na}`);

        if (na === 0) {
            console.warn(`[GenStartList AA] No athletes for AA final.`);
            return { type: 'aa_final', rotations: [] };
        }

        const shf = shuffle([...athletes]);
        const grps = []; // Groups of athletes

        // Distribute athletes into up to 4 groups
        const baseGroupSize = Math.floor(na / 4);
        const remainder = na % 4;
        let currentAthleteIndex = 0;
        for (let i = 0; i < 4; i++) { // Aim for 4 groups
            const groupSizeThisIteration = baseGroupSize + (i < remainder ? 1 : 0);
            if (currentAthleteIndex < na) { // Only create group if there are athletes left
                const actualSizeForGroup = Math.min(groupSizeThisIteration, na - currentAthleteIndex);
                if (actualSizeForGroup > 0) {
                    grps.push(shf.slice(currentAthleteIndex, currentAthleteIndex + actualSizeForGroup));
                }
                currentAthleteIndex += actualSizeForGroup;
            }
        }
        const ng = grps.length; // Actual number of groups formed
        console.log(`[GenStartList AA] Number of athletes: ${na}, Groups formed: ${ng}`);
        grps.forEach((g, idx) => console.log(`AA Group ${idx}: ${g.map(ath=>ath.name).join(', ')}`));

        const rots = [];
        for (let r = 0; r < 4; r++) { // For each of the 4 rotations
            const rot = { startApp: rotationOrder[r], apparatus: {} };
            apparatusList.forEach(app => rot.apparatus[app] = []); // Initialize all apparatus slots as empty

            // Distribute the ACTUAL groups (ng) across the 4 apparatus slots for this rotation
            for (let grpIdxInRotation = 0; grpIdxInRotation < ng; grpIdxInRotation++) {
                const currentGroupToPlace = grps[grpIdxInRotation];
                // Determine target apparatus based on current rotation 'r' and group's position
                const targetApparatusIndex = (r + grpIdxInRotation) % 4; // Group 0 starts on app 'r', Group 1 on 'r+1', etc.
                const targetApparatus = rotationOrder[targetApparatusIndex];

                rot.apparatus[targetApparatus] = currentGroupToPlace.map(mapAthlete);
            }
            rots.push(rot);
        }
        return { type: 'aa_final', rotations: rots };
    }
    else if (phase.endsWith('_final')) { // Apparatus Finals
        // 'athletes' should be the top 8 (max 2/country) qualified for this apparatus
        if (athletes.length > 8) athletes = athletes.slice(0, 8); // Safety, should be pre-filtered
        else if (athletes.length < 8 && athletes.length > 0) console.warn(`[GenStartList App] (${phase}) Expected up to 8, found ${athletes.length}.`);
        else if (athletes.length === 0) {
            console.warn(`[GenStartList App] (${phase}) No athletes for this apparatus final.`);
            return { type: 'apparatus_final', apparatus: phase.split('_')[0], athletes: [] };
        }
        const shf = shuffle([...athletes]); // Simple shuffle for apparatus final order
        return { type: 'apparatus_final', apparatus: phase.split('_')[0], athletes: shf.map(mapAthlete) };
    }
    return { type: 'empty' }; // Fallback
}


// --- Renderização para todas as fases ---
function renderStartList(startListStructure, phase) {
    console.log(`[start-list.js] Rendering Start List for phase: ${phase}`);
    if (!startListContainer) return;

    const phaseTextLabel = phaseLabel(phase);
    let html = `<h2 style="text-align:center;margin-bottom:2rem;">Start List - ${phaseTextLabel}</h2>`;

    if (!startListStructure || startListStructure.type === 'empty') {
        startListContainer.innerHTML = `<p>Start List não disponível ou aplicável para ${phaseTextLabel}.</p>`;
        return;
    }

    if (startListStructure.type === 'qualifiers' && startListStructure.subdivisions) {
        startListStructure.subdivisions.forEach((subdiv, subdivIdx) => {
            html += `<h3 style="text-align:center;margin-top:2rem;">${subdiv.label}</h3>`;
            subdiv.rotations.forEach((rotation, rotIdx) => {
                html += `<div class="rotation-block">`;
                html += `<h2>Rotação ${rotIdx + 1} (Início: ${rotationOrder[rotIdx].toUpperCase()})</h2>`;
                html += `<div class="rotation-apparatus-grid">`;
                rotationOrder.forEach(app => {
                    html += `<div class="apparatus-column">`;
                    html += `<h3>${app.toUpperCase()}</h3>`;
                    const gymnasts = rotation.apparatus[app] || [];
                    if (gymnasts.length > 0) {
                        html += `<ul class="athlete-start-list">`;
                        gymnasts.forEach(athlete => {
                            const countryInfo = countryData[athlete.country] || countryData['DEFAULT'];
                            const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span> ` : '';
                            html += `<li>${flagSpan}${athlete.name} (${athlete.country})</li>`;
                        });
                        html += `</ul>`;
                    } else {
                        html += `<p class="no-athletes">-</p>`;
                    }
                    html += `</div>`; // Close apparatus-column
                });
                html += `</div></div>`; // Close rotation-apparatus-grid & rotation-block
            });
        });
    } else if ((startListStructure.type === 'team_final' || startListStructure.type === 'aa_final') && startListStructure.rotations) {
        html += `<h3 style="text-align:center;margin-top:2rem;">${phaseTextLabel}</h3>`;
        startListStructure.rotations.forEach((rotation, rotIdx) => {
            html += `<div class="rotation-block">`;
            html += `<h2>Rotação ${rotIdx + 1} (Início: ${rotationOrder[rotIdx].toUpperCase()})</h2>`;
            html += `<div class="rotation-apparatus-grid">`;
            rotationOrder.forEach(app => {
                html += `<div class="apparatus-column">`;
                html += `<h3>${app.toUpperCase()}</h3>`;
                const gymnasts = rotation.apparatus[app] || [];
                if (gymnasts.length > 0) {
                    html += `<ul class="athlete-start-list">`;
                    gymnasts.forEach(athlete => {
                        const countryInfo = countryData[athlete.country] || countryData['DEFAULT'];
                        const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span> ` : '';
                        html += `<li>${flagSpan}${athlete.name} (${athlete.country})${athlete.bib ? ` <small>(Bib: ${athlete.bib})</small>` : ''}</li>`;
                    });
                    html += `</ul>`;
                } else {
                    html += `<p class="no-athletes">-</p>`;
                }
                html += `</div>`; // Close apparatus-column
            });
            html += `</div></div>`; // Close rotation-apparatus-grid & rotation-block
        });
    } else if (startListStructure.type === 'apparatus_final' && startListStructure.athletes) {
        html += `<h3 style="text-align:center;margin-top:2rem;">${phaseTextLabel} - Final Ordem de Competição</h3>`;
        html += `<div class="apparatus-final-list-block">`;
        html += `<ol class="athlete-start-list ordered">`;        startListStructure.athletes.forEach((athlete, index) => {
            const countryInfo = countryData[athlete.country] || countryData['DEFAULT'];
            const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span> ` : '';
            html += `<li>${flagSpan}${athlete.name} (${athlete.country})</li>`;
        });
        html += `</ol></div>`; // Close apparatus-final-list-block
    } else {
        console.warn(`[start-list.js] Unknown structure type for rendering: ${startListStructure.type}`);
        html += '<p>Formato de Start List não reconhecido.</p>';
    }
    startListContainer.innerHTML = html;
}

// --- Handle Phase Change (with added logs) ---
async function handlePhaseChange(forceGenerate = false) {
    if (!phaseSelect || !startListContainer) {
        console.error("[start-list.js] Phase select or container missing.");
        return;
    }
    const selectedPhase = phaseSelect.value;
    addStartListButtons(); // Update buttons based on selected phase
    startListContainer.innerHTML = '<p>Carregando Start List...</p>';

    let athletesForPhase = [];
    let startListStructure = null;
    const startListDocRef = doc(db, "start_lists", selectedPhase);

    try {
        if (!forceGenerate) {
            const docSnap = await getDoc(startListDocRef);
            if (docSnap.exists()) {
                startListStructure = docSnap.data().structure;
                console.log(`[start-list.js] Loaded saved start list for ${selectedPhase}.`);
            } else {
                console.log(`[start-list.js] No saved start list found for ${selectedPhase}, will generate.`);
                forceGenerate = true; // Force generation if no saved list
            }
        }

        if (forceGenerate || !startListStructure) {
            console.log(`[start-list.js] Determining athletes for phase ${selectedPhase}...`);
            // Logic to determine athletesForPhase based on selectedPhase
            if (selectedPhase === 'qualifiers') {
                athletesForPhase = allGymnastData; // All gymnasts compete in qualifiers            } else if (selectedPhase === 'team_final') {
                // Usar EXATAMENTE a mesma lógica do scoreboard para determinar as 4 equipes finalistas
                const teamResults = calculateTeamScores(allGymnastData).slice(0, 4); // Top 4 teams for final
                const qualifyingCountries = teamResults.map(t => t.country);
                athletesForPhase = allGymnastData.filter(a => qualifyingCountries.includes(a.country));
                console.log(`[start-list.js] Team Final qualified countries:`, qualifyingCountries);
                console.log(`[start-list.js] Team Final qualified athletes:`, athletesForPhase.map(a => `${a.name} (${a.country})`));} else if (selectedPhase === 'aa_final') {
                // Usar EXATAMENTE a mesma lógica do scoreboard-wag para AA Final
                const aaScoresFromQualifiers = calculateAAScores(allGymnastData);
                athletesForPhase = applyMaxPerCountry(aaScoresFromQualifiers, 8, 2); // Top 8 (max 2/country) for AA final
                console.log(`[start-list.js] AA Final qualified athletes:`, athletesForPhase.map(a => `${a.name} (${a.totalScore?.toFixed(3)})`));
            } else if (selectedPhase.endsWith('_final')) { // Apparatus finals
                const apparatus = selectedPhase.split('_')[0];
                console.log(`[start-list.js] Processing apparatus final for: ${apparatus}`);
                
                // Usar EXATAMENTE a mesma lógica do scoreboard-wag.js
                let appScoresFromQualifiers;
                
                if (apparatus === 'vt') {
                    // Lógica IDÊNTICA ao scoreboard para VT
                    appScoresFromQualifiers = allGymnastData.map(gymnast => {
                        const phaseScores = gymnast.scores?.qualifiers || {};
                        const vt1 = { d: 0, e: 0, p: 0, total: 0 }; // Default values
                        const vt2 = { d: 0, e: 0, p: 0, total: 0 }; // Default values
                        
                        // Get VT1 scores
                        const vt1D = parseFloat(phaseScores['qualifiers_vt1_d']) || 0;
                        const vt1E = parseFloat(phaseScores['qualifiers_vt1_e']) || 0;
                        const vt1P = parseFloat(phaseScores['qualifiers_vt1_p']) || 0;
                        if (vt1D > 0 || vt1E > 0) {
                            vt1.d = vt1D;
                            vt1.e = vt1E;
                            vt1.p = vt1P;
                            vt1.total = Math.max(0, vt1D + vt1E - vt1P);
                        }
                        
                        // Get VT2 scores
                        const vt2D = parseFloat(phaseScores['qualifiers_vt2_d']) || 0;
                        const vt2E = parseFloat(phaseScores['qualifiers_vt2_e']) || 0;
                        const vt2P = parseFloat(phaseScores['qualifiers_vt2_p']) || 0;
                        if (vt2D > 0 || vt2E > 0) {
                            vt2.d = vt2D;
                            vt2.e = vt2E;
                            vt2.p = vt2P;
                            vt2.total = Math.max(0, vt2D + vt2E - vt2P);
                        }
                        
                        let score = 0;
                        if (vt1.total > 0 && vt2.total > 0) {
                            score = (vt1.total + vt2.total) / 2;
                        } else if (vt1.total > 0) {
                            score = vt1.total;
                        } else if (vt2.total > 0) {
                            score = vt2.total;
                        }
                        
                        return { ...gymnast, apparatusScore: score };
                    }).filter(g => g.apparatusScore > 0).sort((a, b) => b.apparatusScore - a.apparatusScore);
                } else {
                    // Para outros aparelhos, usar calculateApparatusScores que já está correto
                    appScoresFromQualifiers = calculateApparatusScores(allGymnastData, apparatus);
                }
                
                // Aplicar exatamente a mesma regra de máximo por país
                athletesForPhase = applyMaxPerCountry(appScoresFromQualifiers, 8, 2); // Target top 8 (max 2/country) for App final list
                console.log(`[start-list.js] ${apparatus.toUpperCase()} Final qualified athletes:`, athletesForPhase.map(a => `${a.name} (${a.apparatusScore?.toFixed(3)})`));
            }
            // ... (any other phase logic)

            console.log(`[start-list.js] Found ${athletesForPhase.length} athletes for phase ${selectedPhase}.`);

            if (athletesForPhase.length > 0) {
                 startListStructure = generateStartListStructure(selectedPhase, athletesForPhase);
                 console.log(`[start-list.js] Generated structure for ${selectedPhase}.`);
                 await setDoc(startListDocRef, { structure: startListStructure }); // Save the generated structure
                 console.log(`[start-list.js] Generated and saved new structure for ${selectedPhase}.`);
            } else {
                 startListStructure = { type: 'empty' }; // Mark as empty if no athletes
                 console.log(`[start-list.js] No athletes qualified/found to generate list for ${selectedPhase}. Creating empty structure.`);
                 await setDoc(startListDocRef, { structure: startListStructure }); // Save empty structure
            }
        }

        window._lastStartList = { phase: selectedPhase, structure: startListStructure }; // Store for PDF button logic
        renderStartList(startListStructure, selectedPhase);
        addStartListButtons(); // Re-render buttons to show/hide PDF based on new list

    } catch (error) {
        console.error(`[start-list.js] Error in handlePhaseChange for ${selectedPhase}:`, error);
        startListContainer.innerHTML = '<p>Erro ao gerar o Start List. Verifique o console.</p>';
        window._lastStartList = { phase: selectedPhase, structure: { type: 'error' } }; // Mark as error
        addStartListButtons(); // Update buttons
    }
}

// --- Initial Load ---
function init() {
    phaseSelect = document.getElementById('startlist-phase-select');
    startListContainer = document.getElementById('start-list-container');

    if (!startListContainer || !phaseSelect) {
        console.error("[start-list.js] Init failed: Crucial elements missing.");
        if (!startListContainer) console.error("Missing element: #start-list-container");
        if (!phaseSelect) console.error("Missing element: #startlist-phase-select");
        return;
    }
    console.log("[start-list.js] Initializing...");

    phaseSelect.addEventListener('change', () => handlePhaseChange(false)); // Load saved or generate if not found
    loadAllData(); // This will trigger the first handlePhaseChange once data is loaded
}

// --- Run Init ---
document.addEventListener('DOMContentLoaded', init); // Ensures DOM is ready before init

// --- Cleanup Listener ---
window.addEventListener('unload', () => {
    if (unsubscribeGymnasts) {
        unsubscribeGymnasts();
        console.log("[start-list.js] Unsubscribed from gymnasts listener.");
    }
});
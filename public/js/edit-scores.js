document.addEventListener('DOMContentLoaded', function() {
    const scoreForm = document.getElementById('wag-score-form');
    const formsContainer = document.getElementById('gymnast-forms-container');
    const addGymnastBtn = document.getElementById('add-gymnast-btn');
    const phaseSelect = document.getElementById('phase-select');
    const storageKey = 'wagScoresData_v2'; // New key for new structure
    const generateRandomBtn = document.getElementById('generate-random-btn');
    const clearScoresBtn = document.getElementById('clear-scores-btn');
    const teamSelectionModal = document.getElementById('team-selection-modal');
    // const teamSelectionAthletesDiv = document.getElementById('team-selection-athletes'); // No longer used
    const teamApparatusSelectionDiv = document.getElementById('team-apparatus-selection');
    const confirmTeamSelectionBtn = document.getElementById('confirm-team-selection-btn');
    const cancelTeamSelectionBtn = document.getElementById('cancel-team-selection-btn');
    const randomSelectBtn = document.getElementById('random-select-btn'); // New button
    const clearSelectionBtn = document.getElementById('clear-selection-btn'); // New button
    const selectTeamBtn = document.getElementById('select-team-btn'); // Declaration
    let currentRenderedOrder = []; // Store the currently displayed order

    // *** ADD LOG: Check variable right after declaration ***
    console.log('[Init Scope] selectTeamBtn:', selectTeamBtn ? 'Found' : 'NOT Found');


    let allGymnastData = []; // Holds the complete data structure in memory    // --- *** DUPLICATED Qualification Calculation Logic (Needed for Edit Page Filtering) *** ---
    // NOTE: Keep these in sync with scoreboard.js if logic changes!
    const apparatusList = ['vt', 'ub', 'bb', 'fx']; // Ensure this is defined here too
    
    function getAppScore(phaseScores, app) {
        const d = parseFloat(phaseScores[`${app}_d`]) || 0;
        const e = parseFloat(phaseScores[`${app}_e`]) || 0;
        const p = parseFloat(phaseScores[`${app}_p`]) || 0;
        return (d >= 0 || e >= 0) ? (d + e - p) : 0; // Simplified: just return total
    }
    function getQualifierVaultAverage(phaseScores) {
        if (!phaseScores || !phaseScores.vt_intent) return 0;
        const d1 = parseFloat(phaseScores.vt1_d) || 0; const e1 = parseFloat(phaseScores.vt1_e) || 0; const p1 = parseFloat(phaseScores.vt1_p) || 0;
        const total1 = (d1 >= 0 || e1 >= 0) ? (d1 + e1 - p1) : 0;
        const d2 = parseFloat(phaseScores.vt2_d) || 0; const e2 = parseFloat(phaseScores.vt2_e) || 0; const p2 = parseFloat(phaseScores.vt2_p) || 0;
        const total2 = (d2 >= 0 || e2 >= 0) ? (d2 + e2 - p2) : 0;
        if (total1 >= 0 && total2 >= 0) return (total1 + total2) / 2;
        else return 0;
    }
    function calculateAAScores(gymnastData) { // Simplified name
        return gymnastData.map(gymnast => {
            const phaseScores = gymnast.scores?.qualifiers || {};
            const vt1Score = getAppScore(phaseScores, 'vt1');
            const ubScore = getAppScore(phaseScores, 'ub');
            const bbScore = getAppScore(phaseScores, 'bb');
            const fxScore = getAppScore(phaseScores, 'fx');
            const total = vt1Score + ubScore + bbScore + fxScore;
            return { ...gymnast, aaTotal: total };
        }).filter(g => g.aaTotal > 0).sort((a, b) => b.aaTotal - a.aaTotal);
    }
    function calculateApparatusScores(gymnastData, apparatus) { // Simplified name
        return gymnastData.map(gymnast => {
            const phaseScores = gymnast.scores?.qualifiers || {};
            let score = 0;
            if (apparatus === 'vt') score = getQualifierVaultAverage(phaseScores);
            else score = getAppScore(phaseScores, apparatus);
            return { ...gymnast, apparatusScore: score };
        }).filter(g => g.apparatusScore > 0).sort((a, b) => b.apparatusScore - a.apparatusScore);
    }
    function applyMaxPerCountry(sortedList, maxPerCountry) {
        const qualified = []; const countryCount = {};
        for (const gymnast of sortedList) {
            const country = gymnast.country || 'Unknown';
            countryCount[country] = countryCount[country] || 0;
            if (countryCount[country] < maxPerCountry) {
                qualified.push(gymnast); countryCount[country]++;
            }
        } return qualified;
    }
    // --- *** END DUPLICATED Logic *** ---


    // --- *** ADD Country Data Mapping (needed for flags in edit form) *** ---
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
    // --- *** END Country Data Mapping *** ---

    // --- Helper Function to Create Gymnast Form HTML ---
    function createGymnastFormHTML(gymnast = {}, currentPhase) {
        console.log(`[createGymnastFormHTML] Generating form for ${gymnast.name || 'New Gymnast'} in phase ${currentPhase}`); // ADD LOG
        const id = gymnast.id || `gymnast_${Date.now()}`;
        const name = gymnast.name || '';
        const country = gymnast.country || '';
        // Get scores for the specific phase
        const phaseScores = gymnast.scores?.[currentPhase] || {}; // Get scores or empty object
        // *** ADD: Get country info for flag ***
        const countryInfo = countryData[country] || countryData['DEFAULT'];
        const flagSpan = countryInfo.code ? `<span class="fi fi-${countryInfo.code}"></span>` : '';

        let apparatusHTML = '';
        let relevantApparatus = [];

        // Determine relevant apparatus based on phase
        if (currentPhase === 'qualifiers' || currentPhase === 'aa_final') {
            relevantApparatus = apparatusList; // Show all for these phases
        } else if (currentPhase === 'team_final') {
            // For team final, determine which apparatus this gymnast competes on
            relevantApparatus = apparatusList.filter(app => phaseScores[`competes_on_${app}`]);
            if (relevantApparatus.length === 0) {
                 console.log(`[createGymnastFormHTML] ${name} not competing in Team Final, skipping form.`); // ADD LOG
                 return ''; // Don't render form if not competing at all
            }
        } else if (currentPhase === 'vt_final') {
            relevantApparatus = ['vt'];
        } else if (currentPhase.endsWith('_final')) {
            relevantApparatus = [currentPhase.split('_')[0]];
        }

        // console.log(`[createGymnastFormHTML] ${name} - Phase: ${currentPhase}, Relevant Apparatus:`, relevantApparatus); // Existing log


        relevantApparatus.forEach(app => {
            // *** MODIFICATION START: Determine default values based on phase ***
            // Check if actual D/E/P scores exist for this specific apparatus in this phase
            const hasDScore = phaseScores.hasOwnProperty(`${app}_d`) && phaseScores[`${app}_d`] !== '';
            const hasEScore = phaseScores.hasOwnProperty(`${app}_e`) && phaseScores[`${app}_e`] !== '';
            // P usually defaults to 0.0, so we only need to check D and E existence for clearing

            // Use existing scores only if they actually exist for this phase, otherwise use defaults ('', '', '0.0')
            const valueD = (hasDScore || hasEScore) ? (phaseScores[`${app}_d`] || '') : '';
            const valueE = (hasDScore || hasEScore) ? (phaseScores[`${app}_e`] || '') : '';
            const valueP = (hasDScore || hasEScore) ? (phaseScores[`${app}_p`] || '0.0') : '0.0';
            // *** MODIFICATION END ***


            // --- Special Handling for VT in Qualifiers ---
            if (app === 'vt' && currentPhase === 'qualifiers') {
                // This section needs its own value logic if different from standard D/E/P
                const vt1_valueD = phaseScores.hasOwnProperty('vt1_d') ? (phaseScores['vt1_d'] || '') : '';
                const vt1_valueE = phaseScores.hasOwnProperty('vt1_e') ? (phaseScores['vt1_e'] || '') : '';
                const vt1_valueP = phaseScores.hasOwnProperty('vt1_p') ? (phaseScores['vt1_p'] || '0.0') : '0.0';
                const vt2_valueD = phaseScores.hasOwnProperty('vt2_d') ? (phaseScores['vt2_d'] || '') : '';
                const vt2_valueE = phaseScores.hasOwnProperty('vt2_e') ? (phaseScores['vt2_e'] || '') : '';
                const vt2_valueP = phaseScores.hasOwnProperty('vt2_p') ? (phaseScores['vt2_p'] || '0.0') : '0.0';
                const vtIntent = phaseScores.vt_intent || false;
                const showVault2Class = vtIntent ? 'show-vault2' : '';
                 apparatusHTML += `
                 <div class="qualifiers-vault-section ${showVault2Class}">
                     <h4>Salto (VT)</h4>
                     <div class="intent-checkbox">
                         <input type="checkbox" id="${id}_${currentPhase}_vt_intent" name="${id}_${currentPhase}_vt_intent" ${vtIntent ? 'checked' : ''}>
                         <label for="${id}_${currentPhase}_vt_intent">Competir na Final de Salto (requer 2 saltos)</label>
                     </div>
                     <label for="${id}_${currentPhase}_vt1_d">VT 1 - D:</label>
                     <input type="number" step="0.1" id="${id}_${currentPhase}_vt1_d" name="${id}_${currentPhase}_vt1_d" value="${vt1_valueD}">
                     <label for="${id}_${currentPhase}_vt1_e">E:</label>
                     <input type="number" step="0.001" id="${id}_${currentPhase}_vt1_e" name="${id}_${currentPhase}_vt1_e" value="${vt1_valueE}">
                     <label for="${id}_${currentPhase}_vt1_p">P:</label>
                     <input type="number" step="0.1" id="${id}_${currentPhase}_vt1_p" name="${id}_${currentPhase}_vt1_p" value="${vt1_valueP}">
                     <div class="vault2-inputs">
                          <hr>
                          <label for="${id}_${currentPhase}_vt2_d">VT 2 - D:</label>
                          <input type="number" step="0.1" id="${id}_${currentPhase}_vt2_d" name="${id}_${currentPhase}_vt2_d" value="${vt2_valueD}">
                          <label for="${id}_${currentPhase}_vt2_e">E:</label>
                          <input type="number" step="0.001" id="${id}_${currentPhase}_vt2_e" name="${id}_${currentPhase}_vt2_e" value="${vt2_valueE}">
                          <label for="${id}_${currentPhase}_vt2_p">P:</label>
                          <input type="number" step="0.1" id="${id}_${currentPhase}_vt2_p" name="${id}_${currentPhase}_vt2_p" value="${vt2_valueP}">
                     </div>
                 </div>`;
            }
            // --- Handling for VT in Vault Final ---
            else if (app === 'vt' && currentPhase === 'vt_final') {
                // Apply similar value logic as for qualifiers VT
                const vt1_valueD = phaseScores.hasOwnProperty('vt1_d') ? (phaseScores['vt1_d'] || '') : '';
                const vt1_valueE = phaseScores.hasOwnProperty('vt1_e') ? (phaseScores['vt1_e'] || '') : '';
                const vt1_valueP = phaseScores.hasOwnProperty('vt1_p') ? (phaseScores['vt1_p'] || '0.0') : '0.0';
                const vt2_valueD = phaseScores.hasOwnProperty('vt2_d') ? (phaseScores['vt2_d'] || '') : '';
                const vt2_valueE = phaseScores.hasOwnProperty('vt2_e') ? (phaseScores['vt2_e'] || '') : '';
                const vt2_valueP = phaseScores.hasOwnProperty('vt2_p') ? (phaseScores['vt2_p'] || '0.0') : '0.0';
                 apparatusHTML += `
                 <div class="vault-final-active">
                     <h4>Salto (VT)</h4>
                     <label for="${id}_${currentPhase}_vt1_d">VT 1 - D:</label>
                     <input type="number" step="0.1" id="${id}_${currentPhase}_vt1_d" name="${id}_${currentPhase}_vt1_d" value="${vt1_valueD}">
                     <label for="${id}_${currentPhase}_vt1_e">E:</label>
                     <input type="number" step="0.001" id="${id}_${currentPhase}_vt1_e" name="${id}_${currentPhase}_vt1_e" value="${vt1_valueE}">
                     <label for="${id}_${currentPhase}_vt1_p">P:</label>
                     <input type="number" step="0.1" id="${id}_${currentPhase}_vt1_p" name="${id}_${currentPhase}_vt1_p" value="${vt1_valueP}">
                     <hr style="margin: 1rem 0;">
                     <div class="vault2-inputs">
                          <label for="${id}_${currentPhase}_vt2_d">VT 2 - D:</label>
                          <input type="number" step="0.1" id="${id}_${currentPhase}_vt2_d" name="${id}_${currentPhase}_vt2_d" value="${vt2_valueD}">
                          <label for="${id}_${currentPhase}_vt2_e">E:</label>
                          <input type="number" step="0.001" id="${id}_${currentPhase}_vt2_e" name="${id}_${currentPhase}_vt2_e" value="${vt2_valueE}">
                          <label for="${id}_${currentPhase}_vt2_p">P:</label>
                          <input type="number" step="0.1" id="${id}_${currentPhase}_vt2_p" name="${id}_${currentPhase}_vt2_p" value="${vt2_valueP}">
                     </div>
                 </div>`;
            }
            // --- Handling for other Apparatus Finals ---
            else if (currentPhase.endsWith('_final') && app !== 'vt') {
                 // Use the calculated valueD, valueE, valueP
                 apparatusHTML += `
                 <div>
                     <h4>${app.toUpperCase()}</h4>
                     <label for="${id}_${currentPhase}_d">D:</label>
                     <input type="number" step="0.1" id="${id}_${currentPhase}_d" name="${id}_${currentPhase}_d" value="${valueD}">
                     <label for="${id}_${currentPhase}_e">E:</label>
                     <input type="number" step="0.001" id="${id}_${currentPhase}_e" name="${id}_${currentPhase}_e" value="${valueE}">
                     <label for="${id}_${currentPhase}_p">P:</label>
                     <input type="number" step="0.1" id="${id}_${currentPhase}_p" name="${id}_${currentPhase}_p" value="${valueP}">
                 </div>`;
            }
            // --- Handling for Qualifiers (non-VT), Team, AA Final ---
            else { // Includes Team Final now
                // Use the calculated valueD, valueE, valueP
                apparatusHTML += `
                <div>
                    <h4>${app.toUpperCase()}</h4>
                    <label for="${id}_${currentPhase}_${app}_d">D:</label>
                    <input type="number" step="0.1" id="${id}_${currentPhase}_${app}_d" name="${id}_${currentPhase}_${app}_d" value="${valueD}">
                    <label for="${id}_${currentPhase}_${app}_e">E:</label>
                    <input type="number" step="0.001" id="${id}_${currentPhase}_${app}_e" name="${id}_${currentPhase}_${app}_e" value="${valueE}">
                    <label for="${id}_${currentPhase}_${app}_p">P:</label>
                    <input type="number" step="0.1" id="${id}_${currentPhase}_${app}_p" name="${id}_${currentPhase}_${app}_p" value="${valueP}">
                </div>`;
            }
        });

        // If no relevant apparatus for this phase (e.g., team final but not competing), return empty string
        if (apparatusHTML === '' && relevantApparatus.length > 0) {
             console.warn(`[createGymnastFormHTML] Generated empty apparatusHTML for ${name} despite having relevant apparatus:`, relevantApparatus); // ADD LOG
        }
        if (apparatusHTML === '') {
             console.log(`[createGymnastFormHTML] No apparatus HTML generated for ${name} in phase ${currentPhase}. Returning empty string.`); // ADD LOG
             return '';
        }

        // Return the full form HTML
        const fullFormHTML = `
            <div class="edit-form" data-gymnast-id="${id}">
                <button type="button" class="remove-gymnast-btn" title="Remover Ginasta">&times;</button>
                <h3>
                   <!-- *** CHANGE: Insert flag-icons span *** -->
                   ${flagSpan}
                   <input type="text" class="gymnast-name-input" value="${name}" placeholder="Nome da Ginasta">
                   <input type="text" class="country-input" value="${country}" placeholder="País (3 letras)" maxlength="3">
                </h3>
                <div class="apparatus-scores">
                    ${apparatusHTML}
                </div>
            </div>
        `;
        console.log(`[createGymnastFormHTML] Returning form HTML for ${name}.`); // ADD LOG
        return fullFormHTML;
    }

    // --- Load ALL Data From Storage ---
    function loadAllData() {
        console.log("[loadAllData] Attempting to load data from localStorage..."); // ADD LOG
        try {
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
                allGymnastData = JSON.parse(storedData);
                if (!Array.isArray(allGymnastData)) {
                    console.warn("[loadAllData] Data loaded was not an array, resetting.");
                    allGymnastData = [];
                } else {
                    console.log(`[loadAllData] Successfully loaded ${allGymnastData.length} athletes.`); // ADD LOG
                }
            } else {
                console.log("[loadAllData] No data found in localStorage."); // ADD LOG
                allGymnastData = [];
            }
        } catch (e) {
            console.error("Error loading or parsing data from localStorage:", e);
            allGymnastData = []; // Reset on error
        }
    }


    // --- Render Forms for Current Phase ---
    // Now uses the athletesToRender list directly for order
    function renderFormsForPhase(phase, athletesToRender) { // Removed default value
        console.log(`[renderFormsForPhase] Starting. Phase: ${phase}, Athletes to render: ${athletesToRender?.length ?? 0}`); // ADD LOG
        formsContainer.innerHTML = '';
        // console.log(`[renderFormsForPhase] Rendering forms for phase: ${phase}. Athletes count: ${athletesToRender.length}`); // Existing log
        currentRenderedOrder = athletesToRender; // Store the order being rendered

        let formsRendered = 0;
        if (!athletesToRender || athletesToRender.length === 0) {
            console.warn("[renderFormsForPhase] No athletes to render for this phase."); // ADD LOG
        } else {
            athletesToRender.forEach((gymnast, index) => { // Add index for potential display
                console.log(`[renderFormsForPhase] Processing athlete ${index + 1}: ${gymnast.name}`); // ADD LOG
                // Ensure scores structure exists for the phase
                if (!gymnast.scores) gymnast.scores = {};
                if (!gymnast.scores[phase]) gymnast.scores[phase] = {};

                const formHTML = createGymnastFormHTML(gymnast, phase); // Pass index if needed later
                if (formHTML) {
                    try {
                        formsContainer.insertAdjacentHTML('beforeend', formHTML);
                        formsRendered++;
                    } catch (e) { console.error("Error rendering form:", gymnast, e); }
                } else {
                    console.log(`[renderFormsForPhase] No form HTML generated for ${gymnast.name} in phase ${phase}.`); // ADD LOG
                }
            });
        }
        console.log(`[renderFormsForPhase] Finished. Rendered ${formsRendered} forms.`); // ADD LOG (modified existing)

        // Add class for Vault Final styling (if applicable)
        if (phase === 'vt_final') {
            formsContainer.classList.add('vault-final-active');
        } else {
            formsContainer.classList.remove('vault-final-active');
        }
    }

    // --- Save Scores for Current Phase ---
    function saveScores(event) {
        event.preventDefault();
        const currentPhase = phaseSelect.value;
        const gymnastForms = formsContainer.querySelectorAll('.edit-form');
        let updatedAthletes = []; // Keep track of athletes whose forms are visible

        gymnastForms.forEach(form => {
            const id = form.dataset.gymnastId;
            let athlete = allGymnastData.find(a => a.id === id);
            if (!athlete) return;

            // Update name/country
            const nameInput = form.querySelector('.gymnast-name-input');
            const countryInput = form.querySelector('.country-input');
            athlete.name = nameInput ? nameInput.value.trim() : athlete.name;
            athlete.country = countryInput ? countryInput.value.trim().toUpperCase() : athlete.country;

            // Ensure scores structure
            if (!athlete.scores) athlete.scores = {};
            if (!athlete.scores[currentPhase]) athlete.scores[currentPhase] = {};

            // Collect scores ONLY for the apparatus rendered in the form
            form.querySelectorAll('.apparatus-scores input[type="number"]').forEach(input => {
                const key = input.name.replace(`${id}_${currentPhase}_`, '');
                athlete.scores[currentPhase][key] = input.value;
            });
            updatedAthletes.push(athlete);
        });

        // Update only the athletes whose forms were rendered/saved
        // We don't filter allGymnastData here anymore, just update the relevant ones
        updatedAthletes.forEach(updatedAthlete => {
             const index = allGymnastData.findIndex(a => a.id === updatedAthlete.id);
             if (index !== -1) {
                 // Merge updated scores back into the main data object
                 // Preserve existing scores for the phase not rendered in the form
                 allGymnastData[index].scores[currentPhase] = {
                     ...allGymnastData[index].scores[currentPhase], // Keep existing competes_on flags etc.
                     ...updatedAthlete.scores[currentPhase] // Overwrite with new D/E/P values
                 };
                 allGymnastData[index].name = updatedAthlete.name; // Update name/country too
                 allGymnastData[index].country = updatedAthlete.country;
             }
        });


        // Save the entire updated structure back to localStorage
        try {
            localStorage.setItem(storageKey, JSON.stringify(allGymnastData));
            alert(`Notas para a fase '${currentPhase}' salvas com sucesso!`);
        } catch (e) {
            console.error("Error saving data to localStorage:", e);
            alert("Erro ao salvar notas. Verifique o console.");
        }
    }

    // --- *** UPDATED Modal Logic *** ---

    function updateSelectionCount(apparatusDiv) {
        const apparatus = apparatusDiv.dataset.apparatus;
        const countSpan = apparatusDiv.closest('.apparatus-selection-section').querySelector('.selection-count');
        const checkedCount = apparatusDiv.querySelectorAll('input[type="checkbox"]:checked').length;

        // Calculate expected total (Number of countries * 3)
        // This assumes all countries listed in the modal are participating
        const countryGroups = apparatusDiv.querySelectorAll('.country-group');
        const expectedTotal = countryGroups.length * 3;

        // Update text to show current total vs expected total
        countSpan.textContent = `(Selecionados: ${checkedCount} / ${expectedTotal})`;

        // Change color based on whether the total count is correct
        if (checkedCount === expectedTotal) {
            countSpan.style.color = 'green'; // OK
        } else {
            countSpan.style.color = 'red'; // Not OK (too few or too many)
        }
    }

    function showTeamSelectionModal() {
        console.log("[showTeamSelectionModal] Function called."); // *** ADD LOG ***
        if (!teamSelectionModal || !teamApparatusSelectionDiv) {
             console.error("[showTeamSelectionModal] Modal or Apparatus Div not found!"); // *** ADD LOG ***
             return;
        }
        console.log("[showTeamSelectionModal] Modal and Apparatus Div found."); // *** ADD LOG ***

        try { // *** ADD try...catch block ***
            // Group all athletes by country
            const groupedByCountry = allGymnastData.reduce((acc, gymnast) => {
                const country = gymnast.country || 'Unknown';
                if (!acc[country]) acc[country] = [];
                acc[country].push(gymnast);
                return acc;
            }, {});
            const sortedCountries = Object.keys(groupedByCountry).sort();
            console.log("[showTeamSelectionModal] Athletes grouped by country."); // *** ADD LOG ***

            // Populate each apparatus section
            teamApparatusSelectionDiv.querySelectorAll('.athlete-list').forEach(listDiv => {
                listDiv.innerHTML = ''; // Clear previous
                const apparatus = listDiv.dataset.apparatus;
                console.log(`[showTeamSelectionModal] Populating apparatus: ${apparatus}`); // *** ADD LOG ***

                sortedCountries.forEach(country => {
                    const countryDiv = document.createElement('div');
                    countryDiv.className = 'country-group';
                    countryDiv.innerHTML = `<h5>${country}</h5>`;

                    groupedByCountry[country].forEach(gymnast => {
                        const competesKey = `competes_on_${apparatus}`;
                        const isChecked = gymnast.scores?.team_final?.[competesKey] ? 'checked' : '';
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'athlete-selection-item';
                        itemDiv.innerHTML = `
                            <input type="checkbox" id="select_${apparatus}_${gymnast.id}" data-athlete-id="${gymnast.id}" data-apparatus="${apparatus}" ${isChecked}>
                            <label for="select_${apparatus}_${gymnast.id}">${gymnast.name}</label>
                        `;
                        countryDiv.appendChild(itemDiv);
                    });
                    listDiv.appendChild(countryDiv);
                });
                // Update initial count
                updateSelectionCount(listDiv);
            });
            console.log("[showTeamSelectionModal] Finished populating apparatus sections."); // *** ADD LOG ***

            console.log("[showTeamSelectionModal] Attempting to display modal..."); // *** ADD LOG ***
            teamSelectionModal.style.display = 'flex'; // Show the modal
            console.log("[showTeamSelectionModal] Modal display set to 'flex'."); // *** ADD LOG ***

        } catch (error) {
            console.error("[showTeamSelectionModal] Error during modal population or display:", error); // *** ADD LOG ***
            alert("Erro ao abrir o modal de seleção de equipes. Verifique o console.");
        }
    }

    function hideTeamSelectionModal() {
        if (teamSelectionModal) {
            teamSelectionModal.style.display = 'none';
        }
    }

    function confirmTeamSelection() {
        console.log("Confirming apparatus assignments...");
        let selectionValid = true;
        let validationMessage = "Seleção inválida! Verifique o número de atletas por aparelho.\n\nContagens atuais:\n";

        // Validate counts first - check if total matches expected total
        teamApparatusSelectionDiv.querySelectorAll('.athlete-list').forEach(listDiv => {
             const apparatus = listDiv.dataset.apparatus;
             const checkedCount = listDiv.querySelectorAll('input[type="checkbox"]:checked').length;
             const countryGroups = listDiv.querySelectorAll('.country-group');
             const expectedTotal = countryGroups.length * 3;

             console.log(`[confirmTeamSelection] Validation - Apparatus: ${apparatus}, Checked Count: ${checkedCount}, Expected: ${expectedTotal}`);
             validationMessage += `- ${apparatus.toUpperCase()}: ${checkedCount}/${expectedTotal}\n`;
             if (checkedCount !== expectedTotal) { // Check against expected total
                 selectionValid = false;
             }
        });

        if (!selectionValid) {
            alert(validationMessage); // Show detailed message
            return;
        }

        // Reset all competes_on flags for team_final first
        allGymnastData.forEach(athlete => {
            if (!athlete.scores) athlete.scores = {};
            if (!athlete.scores.team_final) athlete.scores.team_final = {};
            apparatusList.forEach(app => {
                athlete.scores.team_final[`competes_on_${app}`] = false;
            });
        });

        // Set flags based on current selection
        teamApparatusSelectionDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const athleteId = checkbox.dataset.athleteId;
            const apparatus = checkbox.dataset.apparatus;
            const athlete = allGymnastData.find(a => a.id === athleteId);
            if (athlete) {
                // Ensure structure exists
                 if (!athlete.scores) athlete.scores = {};
                 if (!athlete.scores.team_final) athlete.scores.team_final = {};
                // Set the specific flag
                athlete.scores.team_final[`competes_on_${apparatus}`] = true;
            }
        });

        hideTeamSelectionModal();

        // --- Generate Start List after confirming team ---
        const teamAthletes = allGymnastData.filter(athlete => {
            return apparatusList.some(app => athlete.scores?.team_final?.[`competes_on_${app}`]);
        });
        const orderedTeam = generateStartList('team_final', teamAthletes);
        renderFormsForPhase('team_final', orderedTeam); // Render forms based on new assignments and order
        // ---

        // Save the updated assignments immediately
        saveScores(new Event('submit'));
        alert("Seleção de aparelhos salva. Formulários atualizados.");
    }

    // --- *** Ensure Random Select and Clear Functions are defined BEFORE Event Listeners *** ---

    // --- Randomly Select 3 Athletes per Country per Apparatus ---
    function randomlySelectTeams() {
        if (!teamApparatusSelectionDiv) return;
        console.log("[randomlySelectTeams] Starting random selection...");

        teamApparatusSelectionDiv.querySelectorAll('.athlete-list').forEach(listDiv => {
            console.log(`[randomlySelectTeams] Processing apparatus: ${listDiv.dataset.apparatus}`);
            listDiv.querySelectorAll('.country-group').forEach(countryGroup => {
                const checkboxes = Array.from(countryGroup.querySelectorAll('input[type="checkbox"]'));
                // console.log(`[randomlySelectTeams]   Country: ${countryGroup.querySelector('h5').textContent}, Athletes found: ${checkboxes.length}`);

                // Uncheck all first for this country/apparatus
                checkboxes.forEach(cb => cb.checked = false);

                // Shuffle the checkboxes for this country
                for (let i = checkboxes.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [checkboxes[i], checkboxes[j]] = [checkboxes[j], checkboxes[i]];
                }

                // Check the first 3 (or fewer if less than 3 athletes)
                const countToSelect = Math.min(checkboxes.length, 3);
                // console.log(`[randomlySelectTeams]   Selecting ${countToSelect} athletes randomly.`);
                for (let i = 0; i < countToSelect; i++) {
                    checkboxes[i].checked = true;
                }
            });
            // Update count for the whole apparatus section after processing all countries
            updateSelectionCount(listDiv);
        });
        console.log("[randomlySelectTeams] Finished random selection.");
    }

    // --- Clear All Selections in Modal ---
    function clearTeamSelectionModal() {
        if (!teamApparatusSelectionDiv) return;
        console.log("[clearTeamSelectionModal] Clearing all selections.");

        teamApparatusSelectionDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Update counts for all apparatus sections
        teamApparatusSelectionDiv.querySelectorAll('.athlete-list').forEach(listDiv => {
            updateSelectionCount(listDiv);
        });
    }

    // --- Start List Generation Logic ---
    function generateStartList(phase, athletes) {
        console.log(`[generateStartList] Generating for phase: ${phase}, Athletes: ${athletes.length}`);
        let orderedAthletes = [...athletes]; // Create a copy to shuffle

        // Fisher-Yates (Knuth) Shuffle
        for (let i = orderedAthletes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [orderedAthletes[i], orderedAthletes[j]] = [orderedAthletes[j], orderedAthletes[i]];
        }

        // Simple shuffle for Apparatus Finals (already filtered to 8)
        if (phase.endsWith('_final') && phase !== 'team_final' && phase !== 'aa_final') {
             console.log("[generateStartList] Simple shuffle for Apparatus Final.");
             return orderedAthletes;
        }

        // Subdivision logic for Qualifiers, AA Final, Team Final
        const numSubdivisions = 4;
        const athletesPerSub = Math.ceil(orderedAthletes.length / numSubdivisions);
        // *** ADDED LOG: Confirm subdivision size ***
        console.log(`[generateStartList] Creating ${numSubdivisions} subdivisions with approx ${athletesPerSub} athletes each.`);
        const subdivisions = [];
        for (let i = 0; i < numSubdivisions; i++) {
            subdivisions.push(orderedAthletes.slice(i * athletesPerSub, (i + 1) * athletesPerSub));
        }

        // Assign starting apparatus (example: VT, UB, BB, FX)
        // In a real scenario, this might be more complex (bye rotations, etc.)
        const startApparatusOrder = ['vt', 'ub', 'bb', 'fx'];
        subdivisions.forEach((sub, index) => {
            const startApp = startApparatusOrder[index % startApparatusOrder.length];
            sub.forEach(athlete => {
                athlete.tempStartApparatus = startApp; // Temporary property for potential display
            });
             console.log(`[generateStartList] Subdivision ${index + 1} (${sub.length} athletes) starts ${startApp}`);
        });

        console.log("[generateStartList] Returning shuffled list with subdivision info.");
        return orderedAthletes; // Return the shuffled list
    }

    // --- *** Add New Gymnast Function Definition *** ---
    function addNewGymnast() {
        const currentPhase = phaseSelect.value;
        const newId = `gymnast_${Date.now()}`;
        // Create a basic gymnast object with an empty scores object
        const newGymnast = { id: newId, name: '', country: '', scores: {} };
        // Ensure the scores object for the current phase exists
        newGymnast.scores[currentPhase] = {};

        // Add to the main data array *before* rendering its form
        allGymnastData.push(newGymnast);
        console.log(`[addNewGymnast] Added new gymnast with id ${newId}. Total athletes: ${allGymnastData.length}`);

        // Render just the new form at the end of the container
        const formHTML = createGymnastFormHTML(newGymnast, currentPhase);
        if (formHTML && formsContainer) {
            formsContainer.insertAdjacentHTML('beforeend', formHTML);
            console.log(`[addNewGymnast] Rendered form for new gymnast.`);
            // Optionally scroll to the new form
            const newFormElement = formsContainer.querySelector(`[data-gymnast-id="${newId}"]`);
            if (newFormElement) {
                newFormElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        } else {
             console.error("[addNewGymnast] Could not render form for new gymnast.");
        }
        // Note: The new gymnast is only persisted when 'Salvar Notas' is clicked.
    }

    // --- Handle Phase Change ---
    function handlePhaseChange() {
        console.log("[handlePhaseChange] Starting...");
        console.log('[handlePhaseChange Scope Check] typeof selectTeamBtn:', typeof selectTeamBtn);
        console.log('[handlePhaseChange Scope Check] selectTeamBtn exists:', selectTeamBtn ? 'Yes' : 'No');

        const selectedPhase = phaseSelect.value;
        let qualifiedAthletes = [];
        let needsStartList = false;

        // Reset visibility of Team Selection button
        if (selectTeamBtn) {
             selectTeamBtn.style.display = 'none'; // Hide by default
        } else {
             console.error("[handlePhaseChange] selectTeamBtn is falsy before trying to set display to 'none'.");
        }
        // *** REMOVED generateStartListBtn logic as it's not on this page anymore ***
        // if (generateStartListBtn) generateStartListBtn.style.display = 'none';

        try {
            if (selectedPhase === 'qualifiers') {
                qualifiedAthletes = allGymnastData;
                needsStartList = true;
                console.log(`[handlePhaseChange] Phase is Qualifiers. Athletes: ${qualifiedAthletes.length}`);
            } else if (selectedPhase === 'team_final') {
                // *** Ensure button is shown for Team Final ***
                if (selectTeamBtn) {
                     selectTeamBtn.style.display = 'inline-block'; // Show the button
                } else {
                     console.error("[handlePhaseChange] selectTeamBtn is falsy before trying to set display to 'inline-block'.");
                }
                // Filter athletes who have been selected for *any* apparatus in team final
                qualifiedAthletes = allGymnastData.filter(athlete => {
                    return apparatusList.some(app => athlete.scores?.team_final?.[`competes_on_${app}`]);
                });
                needsStartList = true; // Generate start list for form order
                console.log(`[handlePhaseChange] Phase is Team Final. Athletes assigned: ${qualifiedAthletes.length}`);
            } else if (selectedPhase === 'aa_final') {
                const aaQualifiersRaw = calculateAAScores(allGymnastData);
                // *** REMOVE redundant .slice(0, 24) - applyMaxPerCountry handles the limit ***
                qualifiedAthletes = applyMaxPerCountry(aaQualifiersRaw, 24, 2); // Aim for 24, get actual number (e.g., 16)
                needsStartList = true;
                console.log(`[handlePhaseChange] Phase is AA Final. Qualified: ${qualifiedAthletes.length}`); // ADD LOG (modified existing)
            } else if (selectedPhase.endsWith('_final')) {
                const apparatus = selectedPhase.split('_')[0];
                const appQualifiersRaw = calculateApparatusScores(allGymnastData, apparatus);
                 // *** REMOVE redundant .slice(0, 8) ***
                qualifiedAthletes = applyMaxPerCountry(appQualifiersRaw, 8, 2); // Aim for 8
                needsStartList = true;
                console.log(`[handlePhaseChange] Phase is Apparatus Final (${selectedPhase}). Qualified: ${qualifiedAthletes.length}`); // ADD LOG (modified existing)
            } else {
                console.warn(`[handlePhaseChange] Unknown or unhandled phase: ${selectedPhase}`);
                qualifiedAthletes = []; // Ensure empty for unknown phases
            }
        } catch (error) {
             console.error("[handlePhaseChange] Error determining qualified athletes:", error);
             qualifiedAthletes = []; // Reset on error
        }

        // Generate start list for form ordering if needed
        let orderedAthletesForPhase = qualifiedAthletes;
        if (needsStartList && qualifiedAthletes.length > 0) {
            console.log("[handlePhaseChange] Generating simple start list for form order...");
            // *** Use the local generateStartList for simple shuffling ***
            orderedAthletesForPhase = generateStartList(selectedPhase, qualifiedAthletes);
        } else {
             console.log("[handlePhaseChange] Start list not needed or no qualified athletes for form order.");
        }

        console.log("[handlePhaseChange] Calling renderFormsForPhase...");
        renderFormsForPhase(selectedPhase, orderedAthletesForPhase);
        console.log("[handlePhaseChange] Finished.");
    }

    // --- Handle Vault Intent Checkbox Change ---
    function handleVaultIntentChange(event) {
        if (event.target.type === 'checkbox' && event.target.name.endsWith('_vt_intent')) {
            const form = event.target.closest('.qualifiers-vault-section');
            if (form) {
                if (event.target.checked) {
                    form.classList.add('show-vault2');
                } else {
                    form.classList.remove('show-vault2');
                    // Optionally clear VT2 inputs when unchecked
                    // form.querySelectorAll('.vault2-inputs input').forEach(input => input.value = '');
                }
            }
        }
    }

    // --- Event Listeners ---
    console.log("[Init] Setting up event listeners..."); // Add log
    if (scoreForm) {
        scoreForm.addEventListener('submit', saveScores);
    }
    if (addGymnastBtn) {
        // Ensure addNewGymnast is defined before this line
        console.log("[Init] Adding listener for addGymnastBtn"); // Add log
        addGymnastBtn.addEventListener('click', addNewGymnast); // Listener for the missing function
    } else {
         console.warn("[Init] addGymnastBtn not found!");
    }
    if (formsContainer) {
        formsContainer.addEventListener('click', function(event) {
            // Simplified remove logic - just find the button click
            if (event.target.classList.contains('remove-gymnast-btn')) {
                const formToRemove = event.target.closest('.edit-form');
                if (formToRemove) {
                    const idToRemove = formToRemove.dataset.gymnastId;
                    if (confirm('Tem certeza que deseja remover esta ginasta? A remoção definitiva ocorrerá ao salvar.')) {
                        formToRemove.remove(); // Remove visually immediately
                        // Mark for removal on save? Or handle removal differently?
                        // For now, just removing visually. Save logic needs review if permanent removal is desired here.
                        console.log(`[Remove Button] Visually removed form for gymnast ID: ${idToRemove}`);
                    }
                }
            }
        });
        // Add listener for vault intent change
        formsContainer.addEventListener('change', handleVaultIntentChange);
    }
    if (phaseSelect) {
        phaseSelect.addEventListener('change', handlePhaseChange);
    }
    // *** ADD LOG before attaching listener ***
    console.log('[Init] Checking selectTeamBtn before adding listener:', selectTeamBtn ? 'Exists' : 'DOES NOT EXIST');
    if (selectTeamBtn) { // *** Add listener for the Team Selection Button ***
        console.log("[Init] Adding listener for selectTeamBtn");
        selectTeamBtn.addEventListener('click', () => { // *** Wrap in anonymous function ***
             console.log("[selectTeamBtn Click] Listener fired!"); // *** ADD LOG HERE ***
             showTeamSelectionModal();
        });
    } else {
        console.warn("[Init] selectTeamBtn not found! Cannot add listener."); // *** Modified warning ***
    }
    if (confirmTeamSelectionBtn) {
        confirmTeamSelectionBtn.addEventListener('click', confirmTeamSelection);
    }
    if (cancelTeamSelectionBtn) {
        cancelTeamSelectionBtn.addEventListener('click', hideTeamSelectionModal);
    }
    if (teamApparatusSelectionDiv) {
        teamApparatusSelectionDiv.addEventListener('change', (event) => {
            if (event.target.type === 'checkbox') {
                const listDiv = event.target.closest('.athlete-list');
                if (listDiv) {
                    updateSelectionCount(listDiv);
                }
            }
        });
    }
    // Check if randomSelectBtn exists before adding listener
    if (randomSelectBtn) {
        console.log("[Init] Adding listener for randomSelectBtn"); // Add log
        randomSelectBtn.addEventListener('click', randomlySelectTeams); // This listener should now work if addNewGymnast error is fixed
    } else {
        console.warn("[Init] randomSelectBtn not found!"); // Add warning
    }
    // Check if clearSelectionBtn exists before adding listener
    if (clearSelectionBtn) {
        console.log("[Init] Adding listener for clearSelectionBtn"); // Add log
        clearSelectionBtn.addEventListener('click', clearTeamSelectionModal);
    } else {
        console.warn("[Init] clearSelectionBtn not found!"); // Add warning
    }
    if (generateRandomBtn) {
        generateRandomBtn.addEventListener('click', generateRandomScores);
    }
    if (clearScoresBtn) {
        clearScoresBtn.addEventListener('click', clearVisibleScores);
    }

    // --- Generate Random Scores ---
    function generateRandomScores() {
        const currentPhase = phaseSelect.value;
        const gymnastForms = formsContainer.querySelectorAll('.edit-form');
        console.log(`Generating random scores for phase: ${currentPhase}`);

        gymnastForms.forEach(form => {
            const id = form.dataset.gymnastId;
            form.querySelectorAll('.apparatus-scores input[type="number"]').forEach(input => {
                const inputName = input.name;
                let randomValue = '';

                // Generate plausible random scores based on input type (D, E, P)
                if (inputName.endsWith('_d')) { // Difficulty
                    // Random D score between 4.0 and 6.8 (adjust range as needed)
                    randomValue = (Math.random() * (6.8 - 4.0) + 4.0).toFixed(1);
                } else if (inputName.endsWith('_e')) { // Execution
                    // Random E score between 7.000 and 9.500
                    randomValue = (Math.random() * (9.5 - 7.0) + 7.0).toFixed(3);
                } else if (inputName.endsWith('_p')) { // Penalty
                    // Random Penalty (mostly 0.0, sometimes 0.1 or 0.3)
                    const randP = Math.random();
                    if (randP < 0.8) randomValue = '0.0'; // 80% chance of 0.0
                    else if (randP < 0.95) randomValue = '0.1'; // 15% chance of 0.1
                    else randomValue = '0.3'; // 5% chance of 0.3
                }
                input.value = randomValue;
            });
        });
        alert('Notas aleatórias geradas para os atletas visíveis nesta fase.');
        // Note: These scores are NOT saved automatically. User must click "Salvar".
    }

    // --- Clear Visible Scores ---
    function clearVisibleScores() {
        if (!confirm('Tem certeza que deseja limpar TODAS as notas visíveis para esta fase? As alterações serão salvas imediatamente.')) {
            return;
        }

        const currentPhase = phaseSelect.value;
        const gymnastForms = formsContainer.querySelectorAll('.edit-form');
        console.log(`Clearing scores for phase: ${currentPhase}`);

        gymnastForms.forEach(form => {
            form.querySelectorAll('.apparatus-scores input[type="number"]').forEach(input => {
                 if (input.name.endsWith('_p')) {
                     input.value = '0.0'; // Reset penalty to 0.0
                 } else {
                     input.value = ''; // Clear D and E scores
                 }
            });
        });

        // Automatically save the cleared scores
        saveScores(new Event('submit')); // Simulate a submit event to trigger save
        alert('Notas visíveis limpas e salvas para esta fase.');
    }


    // --- Initial Load ---
    console.log("[Init] Starting initial load..."); // Add log
    loadAllData(); // Load data first
    console.log(`[Init] Data loaded. ${allGymnastData.length} athletes in memory.`); // ADD LOG
    handlePhaseChange(); // Then render forms for the default phase
    console.log("[Init] Initial load finished."); // Add log
});

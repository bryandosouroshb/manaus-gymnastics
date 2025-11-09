/**
 * Script de migração para normalizar ginastas e scores no Firestore.
 * - Cria IDs simples: gym_001, gym_002, ...
 * - Converte scores para objeto por fase: scores.qualifiers.fx_d, etc.
 * - Salva em nova coleção: gymnasts_normalized
 * 
 * Rode uma vez no Node.js (com Firebase Admin SDK) ou adapte para browser.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'cozygymnastics' // Substitua pelo seu projectId real
});

const db = getFirestore();

async function migrateGymnasts() {
  const oldCol = db.collection('gymnasts'); // Source collection
  const newCol = db.collection('new_gymnasts'); // Target collection - updated
  const snapshot = await oldCol.get();

  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Novo ID simples
    const newId = `gym_${(count + 1).toString().padStart(3, '0')}`;
    const newDocRef = newCol.doc(newId);

    // Copia dados básicos
    const newData = {
      id: newId,
      name: data.name || '',
      country: data.country || '',
      scores: {}
    };

    // Migra scores (apenas para 'qualifiers', mas pode adaptar para outras fases)
    if (data.scores) {
      for (const phase of Object.keys(data.scores)) {
        const phaseObj = {};
        const phaseScores = data.scores[phase];
        for (const key in phaseScores) {
          // Extrai apenas o sufixo do campo (ex: fx_d, fx_e, etc)
          // Exemplo: "5_ma0d35me4xc_qualifiers_fx_d" -> "fx_d"
          const match = key.match(/([a-z]{2})_([dep12]+)$/i);
          if (match) {
            phaseObj[match[0]] = phaseScores[key];
          } else if (key.includes('_')) {
            // Tenta pegar o último dois segmentos (ex: "fx_d")
            const parts = key.split('_');
            if (parts.length >= 2) {
              phaseObj[parts.slice(-2).join('_')] = phaseScores[key];
            }
          }
        }
        newData.scores[phase] = phaseObj;
      }
    }

    await newDocRef.set(newData);
    count++;
    console.log(`Migrated: ${data.name} -> ${newId}`);
  }

  console.log(`Migração concluída! ${count} ginastas migrados para 'new_gymnasts'.`);
}

migrateGymnasts().catch(console.error);

import admin from 'firebase-admin';
// Correctly import the JSON file using the 'with' keyword for ES modules
import serviceAccount from '../cozygymnastics-firebase-adminsdk-fbsvc-10c92bfdc7.json' with { type: "json" };

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const collectionName = 'new_gymnasts';

const teams = [
  {
    country: "BRAZIL",
    country_code: "BRA",
    gymnasts: [
      { name: "Victoria Henna" },
      { name: "Soares Moreno" },
      { name: "Skye Blakely" },
      { name: "Antônia Eneuma" }
    ]
  },
  {
    country: "ESTADOS UNIDOS DA AMÉRICA",
    country_code: "USA",
    gymnasts: [
      { name: "Cookie Espósito" },
      { name: "Laís Souza" },
      { name: "Flávia Saraiva" },
      { name: "Isaac Lee" }
    ]
  },
  {
    country: "CHINA",
    country_code: "CHN",
    gymnasts: [
      { name: "GABBY DOUGLAS" },
      { name: "Arthur WANG" },
      { name: "Sunshine Carey" },
      { name: "Emma Sweent" }
    ]
  },
  {
    country: "ITÁLIA",
    country_code: "ITA",
    gymnasts: [
      { name: "Fael Percy" },
      { name: "ALIYA MUSTAFINA" },
      { name: "Davi Wolf" },
      { name: "Jade Doreforso" }
    ]
  }
];

async function populateGymnasts() {
  console.log(`Starting population of ${collectionName}...`);
  const batch = db.batch();
  let count = 0;

  teams.forEach(team => {
    team.gymnasts.forEach(gymnast => {
      const gymnastRef = db.collection(collectionName).doc(); // Auto-generated ID
      const initialScores = {
        qualifiers: {
          vt1_d: 0, vt1_e: 0, vt1_p: 0, vt1_total: 0,
          vt2_d: 0, vt2_e: 0, vt2_p: 0, vt2_total: 0,
          vt_avg: 0, // For qualification ranking if both vaults are done
          ub_d: 0, ub_e: 0, ub_p: 0, ub_total: 0,
          bb_d: 0, bb_e: 0, bb_p: 0, bb_total: 0,
          fx_d: 0, fx_e: 0, fx_p: 0, fx_total: 0,
          aa_total: 0
        },
        team_final: {
          // Scores here will be 3-up, 3-count, structure might differ or be simpler
          vt_d: 0, vt_e: 0, vt_p: 0, vt_total: 0,
          ub_d: 0, ub_e: 0, ub_p: 0, ub_total: 0,
          bb_d: 0, bb_e: 0, bb_p: 0, bb_total: 0,
          fx_d: 0, fx_e: 0, fx_p: 0, fx_total: 0,
          team_contribution: 0 // Example, or could be part of a separate team total calculation
        },
        aa_final: {
          vt_d: 0, vt_e: 0, vt_p: 0, vt_total: 0,
          ub_d: 0, ub_e: 0, ub_p: 0, ub_total: 0,
          bb_d: 0, bb_e: 0, bb_p: 0, bb_total: 0,
          fx_d: 0, fx_e: 0, fx_p: 0, fx_total: 0,
          aa_total: 0
        },
        // Apparatus finals will have simpler structures, e.g., just D, E, P, Total for that apparatus
        vt_final: { d: 0, e: 0, p: 0, total: 0 },
        ub_final: { d: 0, e: 0, p: 0, total: 0 },
        bb_final: { d: 0, e: 0, p: 0, total: 0 },
        fx_final: { d: 0, e: 0, p: 0, total: 0 },
      };

      batch.set(gymnastRef, {
        name: gymnast.name,
        country: team.country,
        country_code: team.country_code,
        scores: initialScores,
        // Add any other fields you need, e.g., bib number, date of birth, etc.
        // For now, keeping it simple with name, country, and scores structure.
      });
      count++;
    });
  });

  try {
    await batch.commit();
    console.log(`Successfully populated ${count} gymnasts in ${collectionName}.`);
  } catch (error) {
    console.error("Error populating gymnasts:", error);
  }
}

populateGymnasts().then(() => {
  console.log('Firestore population script finished.');
}).catch(error => {
  console.error('Unhandled error in script:', error);
});

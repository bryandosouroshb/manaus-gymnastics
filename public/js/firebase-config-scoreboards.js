// Configuração do Firebase para scoreboards (script tradicional)
const firebaseConfig = {
  apiKey: "AIzaSyAxUEcAze739pFzE_T9O_plNb_jWOMRowI",
  authDomain: "cozygymnastics.firebaseapp.com",
  projectId: "cozygymnastics",
  storageBucket: "cozygymnastics.appspot.com",
  messagingSenderId: "977608365901",
  appId: "1:977608365901:web:3040bf9cb269e7363e4904",
  measurementId: "G-FYRCES6W8Y"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore
const db = firebase.firestore();

// Firebase v8 Initialization - EMERGENCY FIX
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAxUEcAze739pFzE_T9O_plNb_jWOMRowI",
  authDomain: "cozygymnastics.firebaseapp.com",
  projectId: "cozygymnastics",
  storageBucket: "cozygymnastics.appspot.com",
  messagingSenderId: "977608365901",
  appId: "1:977608365901:web:3040bf9cb269e7363e4904",
  measurementId: "G-FYRCES6W8Y"
};

// Inicializar Firebase APENAS se não foi inicializado
if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully!");
} else {
    console.log("Firebase já estava inicializado!");
}

// Aguardar um momento para garantir que Firebase está pronto
setTimeout(() => {
    try {
        // Criar variáveis globais para compatibilidade v8
        window.db = firebase.firestore();
        
        // Verificar se firebase.auth está disponível antes de usar
        if (typeof firebase.auth === 'function') {
            window.auth = firebase.auth();
        } else {
            console.warn("Firebase Auth não está disponível");
            window.auth = null;
        }
        
        console.log("Firebase globals created - db available, auth:", !!window.auth);
        
        // Disparar evento personalizado para indicar que Firebase está pronto
        window.dispatchEvent(new Event('firebaseReady'));
    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
    }
}, 100);

// Firebase globals disponíveis para todos os scripts

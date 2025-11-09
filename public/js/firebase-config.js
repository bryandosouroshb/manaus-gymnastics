// Firebase v8 Configuration - Compatible with both ES6 modules and script tags
// Configuração do seu aplicativo web Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAxUEcAze739pFzE_T9O_plNb_jWOMRowI",
  authDomain: "cozygymnastics.firebaseapp.com",
  projectId: "cozygymnastics",
  storageBucket: "cozygymnastics.appspot.com",
  messagingSenderId: "977608365901",
  appId: "1:977608365901:web:3040bf9cb269e7363e4904",
  measurementId: "G-FYRCES6W8Y"
};

// Inicialize o Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Inicialize o Firestore e Auth - Available globally
const db = firebase.firestore();
const auth = firebase.auth();

console.log("Firebase Initialized via firebase-config.js with cozygymnastics config");

// Helper functions para manter compatibilidade com ES6 syntax - Available globally
const collection = (database, collectionName) => database.collection(collectionName);
const doc = (database, collectionName, docId) => database.collection(collectionName).doc(docId);
const setDoc = (docRef, data, options) => docRef.set(data, options);
const getDoc = (docRef) => docRef.get();
const getDocs = (collectionRef) => collectionRef.get();
const onSnapshot = (ref, callback, errorCallback) => ref.onSnapshot(callback, errorCallback);
const signInWithEmailAndPassword = (authInstance, email, password) => authInstance.signInWithEmailAndPassword(email, password);
const signOut = (authInstance) => authInstance.signOut();
const onAuthStateChanged = (authInstance, callback) => authInstance.onAuthStateChanged(callback);

// Export for ES6 modules (when loaded as module)
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS export
    module.exports = {
        db,
        auth,
        collection,
        doc,
        setDoc,
        getDoc,
        getDocs,
        onSnapshot,
        signInWithEmailAndPassword,
        signOut,
        onAuthStateChanged
    };
}

// Browser globals - make available on window for script tag loading
if (typeof window !== 'undefined') {
    window.db = db;
    window.auth = auth;
    window.collection = collection;
    window.doc = doc;
    window.setDoc = setDoc;
    window.getDoc = getDoc;
    window.getDocs = getDocs;
    window.onSnapshot = onSnapshot;
    window.signInWithEmailAndPassword = signInWithEmailAndPassword;
    window.signOut = signOut;
    window.onAuthStateChanged = onAuthStateChanged;
}

// ES6 module export (only when script is loaded as type="module")
// Commented out to avoid "Unexpected token 'export'" error when loaded as regular script
/*
export {
    db,
    auth,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    onSnapshot,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};
*/
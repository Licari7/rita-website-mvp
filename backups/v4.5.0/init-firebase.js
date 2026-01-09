// Firebase Configuration & Initialization (Compat Version)
const firebaseConfig = {
    apiKey: "AIzaSyAnFddvCUECrFqnWfiA0fNFVx12i0gjWQI",
    authDomain: "se-chover-floresce.firebaseapp.com",
    projectId: "se-chover-floresce",
    storageBucket: "se-chover-floresce.firebasestorage.app",
    messagingSenderId: "688002516530",
    appId: "1:688002516530:web:f82c32e234decda3545e2b"
};

// Initialize Firebase (Global Namespace)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Expose to window for easier debugging/access
window.auth = auth;
window.db = db;
window.storage = storage;

console.log("Firebase (Compat) Initialized");

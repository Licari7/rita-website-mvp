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

// Global Auth State Sync
auth.onAuthStateChanged(user => {
    if (user) {
        // 1. Update LocalStorage
        const name = user.displayName || user.email.split('@')[0];
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('isMember', 'true'); // Assume member if logged in

        // 2. Identify Admin
        const ADMIN_EMAILS = ["floresceterapias@gmail.com", "barata.rita@outlook.com", "carlos.barata@example.com"];
        if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            localStorage.setItem('isAdmin', 'true');
        }
    } else {
        // Clear Sensitive Data
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isMember');
        localStorage.removeItem('isAdmin');
    }

    // 3. Trigger UI Updates
    if (window.updateWelcomeUI) window.updateWelcomeUI();
    if (window.updateSidebarAuth) window.updateSidebarAuth();
    if (window.updateAdminUI) window.updateAdminUI();
});

// --- FIREBASE SYSTEM INITIALIZATION ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN_HERE",
    projectId: "YOUR_PROJECT_ID_HERE",
    storageBucket: "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE"
};

// Initialize Firebase execution
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// 1. GOOGLE SIGN-IN HANDLER
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
    .then((result) => {
        const user = result.user;
        // User profile structural allocation
        syncUserProfile(user.uid, user.displayName, user.email, user.photoURL);
    })
    .catch((error) => {
        alert("Google Error: " + error.message);
    });
}

// 2. EMAIL PROTOCOL HANDLER
function loginWithEmail() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if(!email || !password) {
        alert("Bhai, details complete bharo!");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
    .then((result) => {
        const user = result.user;
        const fallbackDp = "https://ui-avatars.com/api/?name=" + encodeURIComponent(email.split('@')[0]) + "&background=2563eb&color=fff";
        syncUserProfile(user.uid, email.split('@')[0], user.email, fallbackDp);
    })
    .catch((error) => {
        // User exist nahi karta toh registration pipeline check karein
        if (error.code === 'auth/user-not-found') {
            auth.createUserWithEmailAndPassword(email, password)
            .then((result) => {
                const user = result.user;
                const fallbackDp = "https://ui-avatars.com/api/?name=" + encodeURIComponent(email.split('@')[0]) + "&background=2563eb&color=fff";
                syncUserProfile(user.uid, email.split('@')[0], user.email, fallbackDp);
            })
            .catch((regErr) => alert("Registration Error: " + regErr.message));
        } else {
            alert("Error: " + error.message);
        }
    });
}

// 3. CENTRAL USER DATA ENGINE (DP Sync Matrix)
function syncUserProfile(uid, name, email, photoUrl) {
    db.collection("users").doc(uid).set({
        uid: uid,
        name: name,
        email: email,
        profilePic: photoUrl, // Core profile picture tracking url
        lastSync: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        // Dynamic redirection to app dashboard flow
        window.location.href = "index.html";
    })
    .catch((err) => {
        console.error("Database Matrix Error:", err.message);
    });
}

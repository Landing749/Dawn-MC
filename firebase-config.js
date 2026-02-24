// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdXd0uOJ6HrvvjpvNAlmzpKUSAf_w9RE",
  authDomain: "dawn-mc-8a7f9.firebaseapp.com",
  databaseURL: "https://dawn-mc-8a7f9-default-rtdb.firebaseio.com",
  projectId: "dawn-mc-8a7f9",
  storageBucket: "dawn-mc-8a7f9.firebasestorage.app",
  messagingSenderId: "329783945294",
  appId: "1:329783945294:web:e8f2cfa515945984a4fb1f",
  measurementId: "G-CHXG4SRSKS"
};

// Initialize Firebase
let app, auth, database, analytics;

function initFirebase() {
  try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    database = firebase.database();
    
    // Initialize Analytics if available
    if (typeof firebase.analytics !== 'undefined') {
      analytics = firebase.analytics();
    }
    
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

// Authentication state observer
function onAuthStateChange(callback) {
  return auth.onAuthStateChanged(callback);
}

// Database references
const dbRefs = {
  announcements: () => database.ref('announcements'),
  events: () => database.ref('events'),
  store: () => database.ref('store/items'),
  staff: () => database.ref('staff'),
  ranks: () => database.ref('ranks')
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.firebaseApp = {
    app,
    auth,
    database,
    analytics,
    dbRefs,
    initFirebase,
    onAuthStateChange
  };
}

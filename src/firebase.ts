// Firebase Configuration
// Replace these values with your Firebase project configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Check if we should use Firebase emulator (for E2E tests in CI)
const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Demo config for emulator (no real Firebase project needed)
const emulatorConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-test-project.firebaseapp.com',
  projectId: 'demo-test-project',
  storageBucket: 'demo-test-project.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000',
};

const firebaseConfig = USE_EMULATOR ? emulatorConfig : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Connect to emulator if enabled
if (USE_EMULATOR) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export default app;

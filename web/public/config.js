// Firebase web app settings (Firebase console → Project settings → Your apps).
// These values are not secrets: access to data is protected by firestore.rules (each user sees only their own).
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA2QMDYi8J4Dlpdv5ZkM5crHdMWjYRDNi8",
  authDomain: "planner-web-5bc9e.firebaseapp.com",
  projectId: "planner-web-5bc9e",
  storageBucket: "planner-web-5bc9e.firebasestorage.app",
  messagingSenderId: "323757685443",
  appId: "1:323757685443:web:4cee4e5f5157ac9584c076",
};

// Accounts that see the "Plan with AI" button. Add friends' emails here to let them use it too.
export const AI_EMAILS = ["jimin5kr@gmail.com"];

// Gemini models for "Plan with AI", tried in order: if one doesn't exist (anymore), the next is used.
// "gemini-flash-latest" always points to Google's newest Flash model.
export const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];

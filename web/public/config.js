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

// Accounts that see the "Plan with AI" button. (The AI proxy separately allows only listed user IDs.)
export const AI_EMAILS = ["jimin5kr@gmail.com"];

// Address of your AI proxy (Cloudflare Worker in /ai-proxy), e.g. "https://planner-ai.yourname.workers.dev".
// Empty = the "Plan with AI" button explains that AI isn't set up yet.
export const AI_PROXY_URL = "";

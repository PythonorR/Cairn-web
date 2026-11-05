// Accounts and storage. Firebase when config.js is filled in; otherwise a local demo
// backend (this browser only) so the site can be previewed before Firebase is set up.

import { FIREBASE_CONFIG } from "../config.js";
import { t } from "./i18n.js";

export const isConfigured = !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey);

/** Friendly message, or null when the user simply closed the Google window. */
export function authMessage(err) {
  const code = err?.code || "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
  if (code === "auth/wrong-password" || code === "auth/user-not-found") return t("auth/invalid-credential");
  const msg = t(code);
  return msg === code ? t("authUnknown") : msg;
}

async function firebaseBackend(config) {
  const fb = await import("../vendor/firebase.js");
  const app = fb.initializeApp(config);
  const auth = fb.getAuth(app);
  let db;
  try {
    db = fb.initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: fb.persistentLocalCache({ tabManager: fb.persistentMultipleTabManager() }),
    });
  } catch {
    db = fb.initializeFirestore(app, { ignoreUndefinedProperties: true });
  }
  const col = (u, name) => fb.collection(db, "users", u, name);
  const docRef = (u, name, id) => fb.doc(db, "users", u, name, id);

  return {
    onUser: (cb) =>
      fb.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email, name: u.displayName } : null)),
    signIn: (email, password) => fb.signInWithEmailAndPassword(auth, email, password),
    signUp: async (email, password, name) => {
      const cred = await fb.createUserWithEmailAndPassword(auth, email, password);
      if (name) await fb.updateProfile(cred.user, { displayName: name });
    },
    google: () => fb.signInWithPopup(auth, new fb.GoogleAuthProvider()),
    reset: (email) => fb.sendPasswordResetEmail(auth, email),
    signOut: () => fb.signOut(auth),
    /** A short-lived ID token that proves who is signed in (sent to the AI proxy). */
    idToken: () => auth.currentUser?.getIdToken() ?? Promise.resolve(null),
    /** Live list of a user's documents in `name` ("planners" or "habits"). */
    watch: (u, name, cb, onError) =>
      fb.onSnapshot(col(u, name), (snap) => cb(snap.docs.map((d) => d.data()), { fromCache: snap.metadata.fromCache }), onError),
    save: (u, name, d) => fb.setDoc(docRef(u, name, d.id), d),
    remove: (u, name, id) => fb.deleteDoc(docRef(u, name, id)),
  };
}

function demoBackend() {
  const KEY = "planner.demo.v1";
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const write = (data) => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  };
  let userCb = () => {};
  const watchers = {};
  const state = read();
  const listOf = (name) => Object.values(state[name] || {});
  const setUser = (user) => { state.user = user; write(state); userCb(user); };

  return {
    onUser: (cb) => { userCb = cb; setTimeout(() => cb(state.user || null)); return () => {}; },
    signIn: async (email, password) => {
      if (!email || !password) throw { code: "auth/invalid-credential" };
      setUser({ uid: "demo", email, name: null });
    },
    signUp: async (email, password, name) => {
      if ((password || "").length < 6) throw { code: "auth/weak-password" };
      setUser({ uid: "demo", email, name: name || null });
    },
    google: async () => setUser({ uid: "demo", email: "demo@example.com", name: "Demo" }),
    reset: async () => {},
    signOut: async () => setUser(null),
    idToken: async () => "demo-token",
    watch: (_u, name, cb) => {
      watchers[name] = cb;
      setTimeout(() => cb(listOf(name), { fromCache: false }));
      return () => { delete watchers[name]; };
    },
    save: async (_u, name, d) => { state[name] = { ...(state[name] || {}), [d.id]: d }; write(state); },
    remove: async (_u, name, id) => { const { [id]: _, ...rest } = state[name] || {}; state[name] = rest; write(state); },
  };
}

export const backendPromise = isConfigured ? firebaseBackend(FIREBASE_CONFIG) : Promise.resolve(demoBackend());

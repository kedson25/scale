import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCfpBmn3cdKP9vaGrDzKCB7oRPMSMx02tA",
  authDomain: "ecooy-5b791.firebaseapp.com",
  databaseURL: "https://ecooy-5b791-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ecooy-5b791",
  storageBucket: "ecooy-5b791.firebasestorage.app",
  messagingSenderId: "824859587278",
  appId: "1:824859587278:web:9a6b5a4485af41e70dd69f",
  measurementId: "G-LDCXYXPEXF"
};
// Note: Hardcoding API keys directly into the frontend code is not recommended for production.
// This is for prototype/testing purposes as requested.

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
const storage = getStorage(app);

const secondaryApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

let dbInstance: Firestore | null = null;

const getDb = (): Firestore => {
  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};

export { auth, messaging, storage, secondaryAuth, getDb };

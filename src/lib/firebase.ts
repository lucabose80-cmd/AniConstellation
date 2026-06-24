import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBV6AbccP-PH5g3r8CT-JcJgSIWvMnxGO8",
  authDomain: "aniconstellation.firebaseapp.com",
  projectId: "aniconstellation",
  storageBucket: "aniconstellation.firebasestorage.app",
  messagingSenderId: "128726783353",
  appId: "1:128726783353:web:97b1366209c498a429cba8",
  measurementId: "G-CLCYK5F778"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

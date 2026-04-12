import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase RTDB Replaced with Native GCP Firestore Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_GCP_API_KEY ?? '',
  authDomain: "crowd-management-system-492802.firebaseapp.com",
  projectId: "crowd-management-system-492802", // Native GCP Project
  storageBucket: "crowd-management-system-492802.firebasestorage.app",
  messagingSenderId: "265873384374",
  appId: "1:265873384374:web:b770ba185b4cedaa621717"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

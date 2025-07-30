import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0NT8ZFqDTY7yzD8FyK5DfUM_28_xrFPM",
  authDomain: "medve-rpc.firebaseapp.com",
  projectId: "medve-rpc",
  storageBucket: "medve-rpc.firebasestorage.app",
  messagingSenderId: "190794088588",
  appId: "1:190794088588:web:afc3e9169bdfdf9654fba9",
  measurementId: "G-CBJX1LHEV9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;

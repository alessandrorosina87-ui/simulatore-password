import { db } from "../config/firebaseConfig.js";
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";

export const saveGeneratedPassword = async (userId, passwordData) => {
  const passwordsRef = collection(db, "passwords");
  return addDoc(passwordsRef, {
    user_id: userId,
    ...passwordData,
    createdAt: new Date().toISOString()
  });
};

export const getUserPasswords = async (userId) => {
  const passwordsRef = collection(db, "passwords");
  // orderBy requires a composite index if combining with where.
  // We'll just use where and sort in JS, or create a composite index in production.
  const q = query(passwordsRef, where("user_id", "==", userId));
  const snap = await getDocs(q);
  const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getAllPasswords = async () => {
  const passwordsRef = collection(db, "passwords");
  const snap = await getDocs(passwordsRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

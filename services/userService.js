import { db } from "../config/firebaseConfig.js";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

export const createUserProfile = async (uid, data) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

export const getAllUsers = async () => {
  const usersRef = collection(db, "users");
  const snap = await getDocs(usersRef);
  return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
};

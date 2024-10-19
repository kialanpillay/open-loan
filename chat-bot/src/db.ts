import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = !getApps().length ? initializeApp() : getApp();

export const db = getFirestore(app);

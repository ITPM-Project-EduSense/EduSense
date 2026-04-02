import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const FIREBASE_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

const getMissingEnvVars = () =>
  Object.entries(FIREBASE_ENV)
    .filter(([, value]) => !value || value.trim().length === 0)
    .map(([key]) => key);

export function assertFirebaseEnv() {
  const missingEnvVars = getMissingEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing Firebase env vars: ${missingEnvVars.join(", ")}. Configure frontend/.env.local.`,
    );
  }
}

const firebaseConfig = {
  apiKey: FIREBASE_ENV.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: FIREBASE_ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: FIREBASE_ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: FIREBASE_ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: FIREBASE_ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: FIREBASE_ENV.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

export function getFirebaseAuth() {
  assertFirebaseEnv();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

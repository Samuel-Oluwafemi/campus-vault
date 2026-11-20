import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const configured = Object.values(config).every(
  (value) => Boolean(value) && !value.startsWith("your-"),
);

if (!configured) {
  console.error(
    "[Campus Vault] Firebase Authentication is not configured. Set the required VITE_FIREBASE_* build environment variables.",
  );
}

const app = configured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(config)
  : null;

export class FirebaseConfigurationError extends Error {
  constructor() {
    super(
      "Firebase Authentication is not configured. Add your Firebase web app values to .env and restart the dev server.",
    );
    this.name = "FirebaseConfigurationError";
  }
}

export function getFirebaseAuth() {
  if (!app) throw new FirebaseConfigurationError();
  return getAuth(app);
}

export function isFirebaseConfigured() {
  return app !== null;
}

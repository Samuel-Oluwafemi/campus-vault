import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/client';
import { profileService } from '@/services/profileService';
import { ApiRequestError } from '@/services/apiClient';

export const firebaseAuthService = {
  observe(callback: (user: User | null) => void, onError: (error: Error) => void) {
    try {
      return onAuthStateChanged(getFirebaseAuth(), callback, onError);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unable to initialize authentication.'));
      return () => undefined;
    }
  },

  async register(fullName: string, email: string, password: string) {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: fullName });
    await sendEmailVerification(credential.user, {
      url: `${window.location.origin}/verify-email`,
    });
    return credential.user;
  },

  async login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    return credential.user;
  },

  async resendVerification(user: User) {
    if (user.emailVerified) return;
    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-email`,
    });
  },

  async refreshVerification(user: User) {
    await reload(user);
    const refreshedUser = getFirebaseAuth().currentUser;
    if (refreshedUser) await refreshedUser.getIdToken(true);
    return refreshedUser;
  },

  async updateDisplayName(user: User, fullName: string) {
    await updateProfile(user, { displayName: fullName });
  },

  async getOrCreateProfile(user: User) {
    if (!user.emailVerified) {
      throw new Error('Verify your email before creating your Campus Vault profile.');
    }
    return profileService.getOrCreateCurrentProfile(user);
  },

  async requestPasswordReset(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  },

  async logout() {
    await signOut(getFirebaseAuth());
  },
};

export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Authentication could not be completed. Please try again.';

  if (error.name === 'FirebaseConfigurationError') return 'Account access is temporarily unavailable. Please try again later.';
  if (error instanceof ApiRequestError) return error.message;

  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Sign in or reset your password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use at least 8 characters, including uppercase and lowercase letters, a number, and a symbol.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a little while, then try again.';
    case 'auth/network-request-failed':
      return 'A network error interrupted the request. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this Firebase project.';
    case 'auth/unauthorized-domain':
      return 'This address is not authorized in Firebase. Add the current host to Firebase Authentication authorized domains.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact the Campus Vault administrator.';
    case 'auth/invalid-password':
      return 'Check your password and try again.';
    default:
      return 'Authentication could not be completed. Please try again.';
  }
}

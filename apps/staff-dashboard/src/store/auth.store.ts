import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Subscribe to Firebase Auth state on store creation
  onAuthStateChanged(auth, (user) => {
    set({ user, loading: false });
  });

  return {
    user: null,
    loading: true,
    error: null,

    signIn: async (email, password) => {
      set({ error: null });
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign in failed';
        const friendly = message.includes('invalid-credential') || message.includes('wrong-password')
          ? 'Invalid email or password.'
          : message.includes('too-many-requests')
          ? 'Too many attempts. Try again later.'
          : 'Sign in failed. Check your credentials.';
        set({ error: friendly });
        throw err;
      }
    },

    signUp: async (email, password) => {
      set({ error: null });
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign up failed';
        const friendly = message.includes('email-already-in-use')
          ? 'An account with this email already exists.'
          : message.includes('weak-password')
          ? 'Password must be at least 6 characters.'
          : message.includes('invalid-email')
          ? 'Please enter a valid email address.'
          : 'Sign up failed. Please try again.';
        set({ error: friendly });
        throw err;
      }
    },

    signOut: async () => {
      await firebaseSignOut(auth);
      set({ user: null });
    },
  };
});

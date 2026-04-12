import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
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
        // Map Firebase error codes to friendly messages
        const friendly = message.includes('invalid-credential') || message.includes('wrong-password')
          ? 'Invalid email or password.'
          : message.includes('too-many-requests')
          ? 'Too many attempts. Try again later.'
          : 'Sign in failed. Check your credentials.';
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

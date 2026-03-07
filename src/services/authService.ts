import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { User } from '../types';

export const authService = {
  // Sign in with Google
  signInWithGoogle: async (): Promise<FirebaseUser> => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  // Check if user has completed setup
  checkUserSetup: async (uid: string): Promise<boolean> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists();
  },

  // Get user profile
  getUserProfile: async (uid: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return { uid, ...userDoc.data() } as User;
  },

  // Create user profile
  createUserProfile: async (userData: {
    uid: string;
    username: string;
    displayName: string;
    email: string;
    photoURL?: string;
  }): Promise<void> => {
    await setDoc(doc(db, 'users', userData.uid), {
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      photoURL: userData.photoURL || null,
      createdAt: serverTimestamp(),
      isOnline: false,
    });
  },

  // Check username availability
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  // Auth state observer
  onAuthStateChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};

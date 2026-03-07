import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (firebaseUser) {
      const userProfile = await authService.getUserProfile(firebaseUser.uid);
      setCurrentUser(userProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userProfile = await authService.getUserProfile(user.uid);
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

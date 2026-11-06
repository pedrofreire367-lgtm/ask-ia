import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logOut, testFirestoreConnection } from '../lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        try {
          // Sync basic profile to firestore
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Usuário Ask IA',
              email: currentUser.email,
              photoURL: currentUser.photoURL || '',
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Profile sync notice:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      setAuthError(error.message || 'Falha ao autenticar com Google.');
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

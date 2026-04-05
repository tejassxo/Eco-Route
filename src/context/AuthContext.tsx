import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  updateProfile as firebaseUpdateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from '../firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const db = getFirestore();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        throw new Error("Login cancelled. Please try again.");
      }
      throw new Error(error.message);
    }
  };

  const signupWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Store user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        createdAt: new Date(),
        role: 'user'
      });
    } catch (error: any) {
      console.error("Signup failed:", error);
      throw new Error(error.message);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout failed:", error);
      throw new Error(error.message);
    }
  };

  const updateProfile = async (displayName: string, photoURL: string) => {
    if (!auth.currentUser) throw new Error("No user logged in");
    try {
      await firebaseUpdateProfile(auth.currentUser, { displayName, photoURL });
      setUser({ ...auth.currentUser });
    } catch (error: any) {
      console.error("Profile update failed:", error);
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signupWithEmail, loginWithEmail, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

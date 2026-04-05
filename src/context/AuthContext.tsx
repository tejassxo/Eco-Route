import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  User, 
  signOut, 
  updateProfile as firebaseUpdateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendEmailVerification
} from '../firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const db = getFirestore();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => any;
  loginWithPhone: (phoneNumber: string, appVerifier: any) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Only set user if they are logged in via phone OR their email is verified
      if (currentUser) {
        if (currentUser.phoneNumber || currentUser.emailVerified) {
          setUser(currentUser);
        } else {
          // If email is not verified, keep them logged out in the UI state
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signupWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          createdAt: new Date(),
          role: 'user',
          emailVerified: false
        });
      } catch (dbError) {
        console.warn("Could not save user profile to Firestore:", dbError);
      }
      
      // Force sign out so they have to verify before logging in
      await signOut(auth);
    } catch (error: any) {
      console.error("Signup failed:", error);
      throw new Error(error.message);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        throw new Error("auth/email-not-verified");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error; // Throw raw error to catch specific codes in UI
    }
  };

  const resendVerificationEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
    } catch (error: any) {
      console.error("Resend verification failed:", error);
      throw new Error(error.message);
    }
  };

  const setupRecaptcha = (containerId: string) => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      });
    }
    return (window as any).recaptchaVerifier;
  };

  const loginWithPhone = async (phoneNumber: string, appVerifier: any) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (error: any) {
      console.error("Phone login failed:", error);
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
    <AuthContext.Provider value={{ user, loading, signupWithEmail, loginWithEmail, resendVerificationEmail, setupRecaptcha, loginWithPhone, logout, updateProfile }}>
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

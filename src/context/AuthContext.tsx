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
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from '../firebase';
import { doc, setDoc, getFirestore, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const db = getFirestore();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signupWithEmail: (email: string, password: string, name?: string, username?: string, phone?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => any;
  loginWithPhone: (phoneNumber: string, appVerifier: any) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, photoURL: string) => Promise<void>;
  logAudit: (action: string, details: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logAudit = async (action: string, details: any) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action,
        details,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous',
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.phoneNumber || currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === 'google.com')) {
          setUser(currentUser);
          if (!user) { // Only log on initial session start
            await logAudit('user_session_started', { email: currentUser.email });
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const signupWithEmail = async (email: string, password: string, name?: string, username?: string, phone?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (name) {
        await firebaseUpdateProfile(userCredential.user, { displayName: name });
      }

      const actionCodeSettings = {
        url: window.location.origin + '/login',
      };
      await sendEmailVerification(userCredential.user, actionCodeSettings);
      
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          name: name || '',
          username: username || '',
          phone: phone || '',
          createdAt: new Date().toISOString(),
          role: 'user',
          emailVerified: false
        });
      } catch (dbError) {
        console.warn("Could not save user profile to Firestore:", dbError);
      }
      
      await logAudit('user_signup', { email, method: 'email' });
      await signOut(auth);
    } catch (error: any) {
      console.error("Signup failed:", error);
      throw new Error(error.message);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        await logAudit('login_failed_unverified', { email });
        throw new Error("auth/email-not-verified");
      }
      await logAudit('user_login', { email, method: 'email' });
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          username: user.email?.split('@')[0] || '',
          phone: user.phoneNumber || '',
          role: 'user',
          createdAt: new Date().toISOString(),
          emailVerified: true
        });
      }
      await logAudit('user_login', { email: user.email, method: 'google' });
    } catch (error: any) {
      console.error("Google login failed:", error);
      throw new Error(error.message);
    }
  };

  const resendVerificationEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const actionCodeSettings = {
        url: window.location.origin + '/login',
      };
      await sendEmailVerification(userCredential.user, actionCodeSettings);
      await signOut(auth);
      await logAudit('verification_email_resent', { email });
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
      await logAudit('phone_otp_sent', { phone: phoneNumber });
      return confirmationResult;
    } catch (error: any) {
      console.error("Phone login failed:", error);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await logAudit('user_logout', { email: user?.email });
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
    <AuthContext.Provider value={{ 
      user, loading, signupWithEmail, loginWithEmail, loginWithGoogle, 
      resendVerificationEmail, setupRecaptcha, loginWithPhone, logout, updateProfile, logAudit 
    }}>
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

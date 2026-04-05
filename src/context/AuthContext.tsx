import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut, updateProfile as firebaseUpdateProfile } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
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
    console.log("AuthContext: login called");
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("AuthContext: login success");
    } catch (error: any) {
      console.error("Login failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      let message = "Login failed. Please try again.";
      
      if (error.code === 'auth/unauthorized-domain') {
        message = "Login failed: The current domain is not authorized in the Firebase Console. Please add your deployed domain (e.g., your-app-url.vercel.app) to 'Authorized domains' in Firebase Authentication settings.";
      } else if (error.code === 'auth/popup-blocked') {
        message = "Login failed: The popup was blocked by your browser. Please allow popups for this site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Login failed: The login popup was closed before completion.";
      }
      
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout failed:", error);
      throw new Error(error.message || "Logout failed. Please try again.");
    }
  };

  const updateProfile = async (displayName: string, photoURL: string) => {
    if (!auth.currentUser) throw new Error("No user logged in");
    try {
      await firebaseUpdateProfile(auth.currentUser, { displayName, photoURL });
      // Force refresh user state
      setUser({ ...auth.currentUser });
    } catch (error: any) {
      console.error("Profile update failed:", error);
      throw new Error(error.message || "Profile update failed. Please try again.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
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

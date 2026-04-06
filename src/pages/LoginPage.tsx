import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { Loader } from '../components/Loader';

export const LoginPage: React.FC = () => {
  const { signupWithEmail, loginWithEmail, resendVerificationEmail, setupRecaptcha, loginWithPhone } = useAuth();
  const navigate = useNavigate();
  
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isSignup, setIsSignup] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  
  // Rate Limiting State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (authMethod === 'phone') {
      setupRecaptcha('recaptcha-container');
    }
  }, [authMethod, setupRecaptcha]);

  // Handle Lockout Timer
  useEffect(() => {
    if (lockoutTime && Date.now() < lockoutTime) {
      const timer = setTimeout(() => setLockoutTime(null), lockoutTime - Date.now());
      return () => clearTimeout(timer);
    } else if (lockoutTime) {
      setLockoutTime(null);
      setFailedAttempts(0);
    }
  }, [lockoutTime]);

  const handleRateLimit = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    if (newAttempts >= 5) {
      setLockoutTime(Date.now() + 60000); // 1 minute lockout
      setError("Too many failed attempts. Please try again in 1 minute.");
      return true;
    }
    return false;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setNeedsVerification(false);
    
    if (lockoutTime && Date.now() < lockoutTime) {
      setError(`Too many attempts. Try again in ${Math.ceil((lockoutTime - Date.now())/1000)}s`);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignup) {
        await signupWithEmail(email, password);
        setSuccessMsg("Account created! Please check your email to verify your account before logging in.");
        setIsSignup(false);
      } else {
        await loginWithEmail(email, password);
        setFailedAttempts(0); // Reset on success
        navigate('/map');
      }
    } catch (err: any) {
      if (handleRateLimit()) {
        setIsLoading(false);
        return;
      }

      if (err.message === "auth/email-not-verified" || err.code === "auth/email-not-verified") {
        setError("Please verify your email address before logging in.");
        setNeedsVerification(true);
      } else {
        setError(err.message.replace("Firebase: ", ""));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await resendVerificationEmail(email, password);
      setSuccessMsg("Verification email resent. Please check your inbox.");
      setNeedsVerification(false);
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (lockoutTime && Date.now() < lockoutTime) {
      setError(`Too many attempts. Try again in ${Math.ceil((lockoutTime - Date.now())/1000)}s`);
      return;
    }

    setIsLoading(true);
    try {
      if (!confirmationResult) {
        // Send OTP
        const appVerifier = (window as any).recaptchaVerifier;
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        
        // Basic phone validation
        if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
          throw new Error("Invalid phone format. Use E.164 format (e.g. +1234567890)");
        }

        const result = await loginWithPhone(formattedPhone, appVerifier);
        setConfirmationResult(result);
        setSuccessMsg("Verification code sent!");
      } else {
        // Verify OTP
        if (!/^\d{6}$/.test(verificationCode)) {
          throw new Error("Verification code must be 6 digits.");
        }
        await confirmationResult.confirm(verificationCode);
        setFailedAttempts(0);
        navigate('/map');
      }
    } catch (err: any) {
      if (handleRateLimit()) {
        setIsLoading(false);
        return;
      }
      
      if (err.code === 'auth/operation-not-allowed') {
        setError("Phone authentication is not enabled. Please enable it in the Firebase Console -> Authentication -> Sign-in method.");
      } else {
        setError(err.message.replace("Firebase: ", ""));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div 
          ref={containerRef}
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100"
        >
          <h2 className="text-3xl font-black mb-6 text-center text-gray-900 tracking-tight">
            {authMethod === 'phone' && confirmationResult ? 'Verify Code' : isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          {/* Auth Method Toggle */}
          {!confirmationResult && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
              <button
                onClick={() => { setAuthMethod('email'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'email' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Email
              </button>
              <button
                onClick={() => { setAuthMethod('phone'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'phone' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Phone
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-3 mb-6">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-3 mb-6">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
            </div>
          )}
          
          {authMethod === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required
                  disabled={!!lockoutTime}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required
                  disabled={!!lockoutTime}
                />
              </div>
              
              {needsVerification ? (
                <button 
                  type="button" 
                  onClick={handleResendVerification}
                  disabled={isLoading || !!lockoutTime} 
                  className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-lg disabled:opacity-70"
                >
                  {isLoading ? 'Processing...' : 'Resend Verification Email'}
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isLoading || !!lockoutTime} 
                  className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 text-lg disabled:opacity-70"
                >
                  {isLoading ? 'Processing...' : isSignup ? 'Sign Up' : 'Login'}
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              {!confirmationResult ? (
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone number (e.g. +1234567890)"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    required
                    disabled={!!lockoutTime}
                  />
                </div>
              ) : (
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit verification code"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all tracking-widest"
                    required
                    disabled={!!lockoutTime}
                  />
                </div>
              )}
              <div id="recaptcha-container"></div>
              <button type="submit" disabled={isLoading || !!lockoutTime} className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 text-lg disabled:opacity-70">
                {isLoading ? 'Processing...' : !confirmationResult ? 'Send Code' : 'Verify Code'}
              </button>
              {confirmationResult && (
                <button type="button" onClick={() => { setConfirmationResult(null); setError(''); setSuccessMsg(''); }} className="w-full text-sm text-gray-500 font-medium hover:text-emerald-600 transition-colors">
                  Use a different phone number
                </button>
              )}
            </form>
          )}

          {!confirmationResult && authMethod === 'email' && (
            <button onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); setNeedsVerification(false); }} className="w-full mt-6 text-sm text-gray-500 font-medium hover:text-emerald-600 transition-colors">
              {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

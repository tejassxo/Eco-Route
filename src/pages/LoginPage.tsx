import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, KeyRound, AlertCircle, CheckCircle2, User as UserIcon, AtSign, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { Loader } from '../components/Loader';

export const LoginPage: React.FC = () => {
  const { signupWithEmail, loginWithEmail, loginWithGoogle, resendVerificationEmail, setupRecaptcha, loginWithPhone } = useAuth();
  const navigate = useNavigate();
  
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isSignup, setIsSignup] = useState(false);
  
  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, 
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current.children, 
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [isSignup, authMethod]);

  useEffect(() => {
    if (authMethod === 'phone') {
      setupRecaptcha('recaptcha-container');
    }
  }, [authMethod, setupRecaptcha]);

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
      setLockoutTime(Date.now() + 60000);
      setError("Too many failed attempts. Please try again in 1 minute.");
      return true;
    }
    return false;
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignup) {
        await signupWithEmail(email, password, name, username, phone);
        setSuccessMsg("Account created! Please check your email to verify your account before logging in.");
        setIsSignup(false);
      } else {
        await loginWithEmail(email, password);
        setFailedAttempts(0);
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

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/map');
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
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
        const appVerifier = (window as any).recaptchaVerifier;
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        
        if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
          throw new Error("Invalid phone format. Use E.164 format (e.g. +1234567890)");
        }

        const result = await loginWithPhone(formattedPhone, appVerifier);
        setConfirmationResult(result);
        setSuccessMsg("Verification code sent!");
      } else {
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
        setError("Phone authentication is not enabled. Please enable it in the Firebase Console.");
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
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4 font-sans relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div 
          ref={containerRef}
          className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full max-w-[440px] relative z-10"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
              {authMethod === 'phone' && confirmationResult ? 'Verify Code' : isSignup ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-gray-500">
              {isSignup ? 'Enter your details to get started.' : 'Enter your credentials to access your account.'}
            </p>
          </div>
          
          {!confirmationResult && (
            <div className="flex bg-gray-50 p-1 rounded-xl mb-8 border border-gray-100">
              <button
                onClick={() => { setAuthMethod('email'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${authMethod === 'email' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Email
              </button>
              <button
                onClick={() => { setAuthMethod('phone'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${authMethod === 'phone' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Phone
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl flex items-start gap-3 mb-6">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-start gap-3 mb-6">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-emerald-600">{successMsg}</p>
            </div>
          )}
          
          {authMethod === 'email' ? (
            <form ref={formRef} onSubmit={handleEmailSubmit} className="space-y-4">
              {isSignup && (
                <>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      required
                      disabled={!!lockoutTime}
                    />
                  </div>
                  <div className="relative group">
                    <AtSign className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      required
                      disabled={!!lockoutTime}
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      disabled={!!lockoutTime}
                    />
                  </div>
                </>
              )}
              
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  required
                  disabled={!!lockoutTime}
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  required
                  disabled={!!lockoutTime}
                />
              </div>

              {isSignup && (
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    required
                    disabled={!!lockoutTime}
                  />
                </div>
              )}
              
              {needsVerification ? (
                <button 
                  type="button" 
                  onClick={handleResendVerification}
                  disabled={isLoading || !!lockoutTime} 
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm text-sm disabled:opacity-70 mt-2"
                >
                  {isLoading ? 'Processing...' : 'Resend Verification Email'}
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isLoading || !!lockoutTime} 
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm text-sm disabled:opacity-70 mt-2 flex items-center justify-center gap-2 group"
                >
                  {isLoading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
                  {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              )}

              {!isSignup && !needsVerification && (
                <>
                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading || !!lockoutTime}
                    className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm text-sm disabled:opacity-70 flex items-center justify-center gap-3"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}
            </form>
          ) : (
            <form ref={formRef} onSubmit={handlePhoneSubmit} className="space-y-4">
              {!confirmationResult ? (
                <div className="relative group">
                  <Phone className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone number (e.g. +1234567890)"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    required
                    disabled={!!lockoutTime}
                  />
                </div>
              ) : (
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit verification code"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm tracking-widest"
                    required
                    disabled={!!lockoutTime}
                  />
                </div>
              )}
              <div id="recaptcha-container"></div>
              <button type="submit" disabled={isLoading || !!lockoutTime} className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm text-sm disabled:opacity-70 mt-2 flex items-center justify-center gap-2 group">
                {isLoading ? 'Processing...' : !confirmationResult ? 'Send Code' : 'Verify Code'}
                {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </button>
              {confirmationResult && (
                <button type="button" onClick={() => { setConfirmationResult(null); setError(''); setSuccessMsg(''); }} className="w-full text-xs text-gray-500 font-medium hover:text-gray-900 transition-colors mt-4">
                  Use a different phone number
                </button>
              )}
            </form>
          )}

          {!confirmationResult && authMethod === 'email' && (
            <div className="mt-8 text-center">
              <button onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); setNeedsVerification(false); }} className="text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors">
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

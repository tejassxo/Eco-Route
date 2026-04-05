import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, KeyRound } from 'lucide-react';
import gsap from 'gsap';

export const LoginPage: React.FC = () => {
  const { signupWithEmail, loginWithEmail, setupRecaptcha, loginWithPhone } = useAuth();
  const navigate = useNavigate();
  
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isSignup, setIsSignup] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isSignup) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/map');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (!confirmationResult) {
        // Send OTP
        const appVerifier = (window as any).recaptchaVerifier;
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        const result = await loginWithPhone(formattedPhone, appVerifier);
        setConfirmationResult(result);
      } else {
        // Verify OTP
        await confirmationResult.confirm(verificationCode);
        navigate('/map');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'email' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Email
            </button>
            <button
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'phone' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Phone
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4 text-center font-medium">{error}</p>}
        
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
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 text-lg disabled:opacity-70">
              {isLoading ? 'Processing...' : isSignup ? 'Sign Up' : 'Login'}
            </button>
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
                />
              </div>
            )}
            <div id="recaptcha-container"></div>
            <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 text-lg disabled:opacity-70">
              {isLoading ? 'Processing...' : !confirmationResult ? 'Send Code' : 'Verify Code'}
            </button>
            {confirmationResult && (
              <button type="button" onClick={() => setConfirmationResult(null)} className="w-full text-sm text-gray-500 font-medium hover:text-emerald-600 transition-colors">
                Use a different phone number
              </button>
            )}
          </form>
        )}

        {!confirmationResult && authMethod === 'email' && (
          <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-6 text-sm text-gray-500 font-medium hover:text-emerald-600 transition-colors">
            {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
          </button>
        )}
      </div>
    </div>
  );
};

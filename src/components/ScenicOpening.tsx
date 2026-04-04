import React, { useState, useEffect } from 'react';
import { Leaf, LogIn, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ScenicOpening: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [loginError, setLoginError] = useState<string | null>(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Removed auto-proceed timer to ensure buttons stay visible until user interacts
    console.log("ScenicOpening: Mounted");
  }, []);

  const handleGetStarted = () => {
    console.log("ScenicOpening: handleGetStarted called");
    onComplete();
    if (window.location.pathname === '/') {
      navigate('/map');
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await login();
      onComplete();
      navigate('/dashboard');
    } catch (e: any) {
      console.error("Login error from opening:", e);
      setLoginError(e.message || "Login failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-6 select-none overflow-y-auto"
    >
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 z-0" />
      
      {/* Animated Leaves (Subtle background elements) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: -50, 
              y: Math.random() * 100 + 'vh',
              rotate: Math.random() * 360,
              opacity: 0 
            }}
            animate={{ 
              x: '110vw',
              y: (Math.random() * 100 - 10) + 'vh',
              rotate: Math.random() * 720,
              opacity: [0, 0.2, 0.2, 0]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute text-emerald-600/5"
          >
            <Leaf size={24 + Math.random() * 24} />
          </motion.div>
        ))}
      </div>
      
      <div className="relative z-[100] text-center px-8 max-w-2xl w-full flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="w-20 h-20 md:w-28 md:h-28 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-200"
        >
          <Leaf size={40} />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-4"
        >
          Eco<span className="text-emerald-600">Route</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 font-medium text-lg md:text-2xl mb-12 leading-relaxed max-w-lg"
        >
          Navigate the world with a <span className="text-emerald-600 font-bold">smaller footprint</span>. <br className="hidden sm:block" />
          Smarter routes for a <span className="text-emerald-600 font-bold">greener planet</span>.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md"
        >
          <button 
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-12 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 group cursor-pointer active:scale-95 border-4 border-emerald-400/30"
          >
            <span>Get Started</span>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          {!user && (
            <button 
              onClick={handleLogin}
              className="w-full sm:w-auto px-12 py-5 bg-white text-gray-900 border-4 border-emerald-600/20 rounded-2xl font-bold text-xl hover:bg-gray-50 transition-all hover:-translate-y-1 shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-95"
            >
              <LogIn size={24} className="text-emerald-600" />
              <span>Login</span>
            </button>
          )}
        </motion.div>

        {loginError && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-red-500 text-sm font-bold"
          >
            {loginError}
          </motion.p>
        )}
      </div>

      <footer className="absolute bottom-10 left-0 right-0 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-50 text-center z-50">
        © 2026 EcoRoute • Sustainable Navigation
      </footer>
    </motion.div>
  );
};



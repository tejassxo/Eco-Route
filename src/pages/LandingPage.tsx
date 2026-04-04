import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { Leaf, Map, User, ArrowRight, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage = () => {
  const containerRef = useRef(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", { opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: "power3.out" });
      gsap.from(".hero-btn", { opacity: 0, y: 20, duration: 0.8, delay: 0.6, stagger: 0.1, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/map');
    }
  };

  return (
    <div ref={containerRef} className="min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-3xl" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-200 relative z-10"
      >
        <Leaf size={40} />
      </motion.div>

      <h1 className="hero-text text-6xl md:text-8xl font-black text-gray-900 mb-6 tracking-tighter relative z-10">
        Eco<span className="text-emerald-600">Route</span>
      </h1>
      
      <p className="hero-text text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl font-medium leading-relaxed relative z-10">
        Navigate the world with a smaller footprint. <br className="hidden md:block" />
        Smarter routes for a <span className="text-emerald-600 font-bold">greener planet</span>.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full max-w-md sm:max-w-none justify-center">
        <button 
          onClick={handleStart}
          className="hero-btn group px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
        >
          <Map size={20} />
          <span>{user ? 'Go to Dashboard' : 'Start Journey'}</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {!user ? (
          <button 
            onClick={login}
            className="hero-btn px-8 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <User size={20} />
            <span>Login with Google</span>
          </button>
        ) : (
          <Link 
            to="/about"
            className="hero-btn px-8 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Info size={20} />
            <span>How it works</span>
          </Link>
        )}
      </div>

      <footer className="absolute bottom-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
        © 2026 EcoRoute • Sustainable Navigation
      </footer>
    </div>
  );
};

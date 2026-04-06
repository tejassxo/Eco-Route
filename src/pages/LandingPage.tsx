import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { Leaf, Map, User, ArrowRight, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context((self) => {
      // Premium Apple-style entrance animations
      const tl = gsap.timeline();
      
      // Target the root container directly via ref to avoid "not found" warning
      tl.from(containerRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 1.5,
        ease: "expo.out"
      })
      .from(".hero-icon", { 
        scale: 0.5, 
        opacity: 0, 
        duration: 1.2, 
        ease: "expo.out",
        rotation: -15
      }, "-=1.2") // Start with container
      .from(".hero-title", { 
        y: 40, 
        opacity: 0, 
        duration: 1, 
        ease: "power4.out",
        stagger: 0.1
      }, "-=0.8")
      .from(".hero-subtitle", { 
        y: 20, 
        opacity: 0, 
        duration: 1, 
        ease: "power3.out" 
      }, "-=0.6")
      .fromTo(".hero-btn", 
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.15, 
          ease: "back.out(1.2)" 
        }, 
        "-=0.6"
      )
      .from(".hero-footer", {
        opacity: 0,
        duration: 1,
        ease: "power2.out"
      }, "-=0.4");

      // Floating animation for the icon
      gsap.to(".hero-icon", {
        y: -15,
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });

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
    <div ref={containerRef} className="landing-container min-h-[100dvh] bg-natural-pattern flex flex-col items-center justify-center p-6 text-center relative overflow-y-auto font-sans">
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f291e]/50 to-[#0f291e]/90 pointer-events-none z-0" />
      
      <div className="hero-icon w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center text-emerald-400 mb-10 shadow-2xl relative z-20">
        <Leaf size={48} strokeWidth={1.5} />
      </div>

      <h1 className="hero-title text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter relative z-20">
        Eco<span className="text-emerald-400">Route</span>
      </h1>
      
      <p className="hero-subtitle text-xl md:text-2xl text-emerald-50/80 mb-14 max-w-2xl font-medium leading-relaxed relative z-20">
        Navigate the world with a smaller footprint. <br className="hidden md:block" />
        Smarter routes for a <span className="text-emerald-400 font-bold">greener planet</span>.
      </p>

      <div className="flex flex-col sm:flex-row gap-5 relative z-30 w-full max-w-md sm:max-w-none justify-center mt-8">
        <button 
          onClick={handleStart}
          className="hero-btn group px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3"
        >
          <Map size={22} />
          <span>{user ? 'Go to Dashboard' : 'Start Journey'}</span>
          <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
        </button>

        {!user ? (
          <button 
            onClick={() => navigate('/login')}
            className="hero-btn px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <User size={22} className="text-emerald-600" />
            <span>Sign In</span>
          </button>
        ) : (
          <Link 
            to="/about"
            className="hero-btn px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-3"
          >
            <Info size={22} />
            <span>How it works</span>
          </Link>
        )}
      </div>

      <footer className="hero-footer absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md border-t border-white/10 py-6 px-8 z-10 w-full">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-sm font-medium text-white/70">
            <Link to="/features" className="hover:text-white transition-colors">Features</Link>
            <Link to="/builder" className="hover:text-white transition-colors">Builder</Link>
            <Link to="/verification" className="hover:text-white transition-colors">Verification</Link>
            <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          </div>
          <div className="flex gap-6 text-sm font-medium text-white/50">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

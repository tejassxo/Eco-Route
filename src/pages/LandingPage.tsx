import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export const LandingPage = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", { opacity: 0, y: 50, duration: 1, stagger: 0.2 });
      gsap.from(".hero-btn", { opacity: 0, scale: 0.8, duration: 0.8, delay: 0.5 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="hero-text text-6xl font-black text-gray-900 mb-6">EcoRoute</h1>
      <p className="hero-text text-xl text-gray-600 mb-8">Green travel, smarter routes.</p>
      <div className="flex gap-4">
        <Link to="/map" className="hero-btn px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700">Get Started</Link>
        <Link to="/about" className="hero-btn px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold hover:bg-gray-300">About</Link>
      </div>
    </div>
  );
};

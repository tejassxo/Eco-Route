import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ScenicOpening: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const leaves = containerRef.current.querySelectorAll('.leaf');
    
    leaves.forEach((leaf) => {
      const startX = -50;
      const startY = Math.random() * 100;
      const duration = 5 + Math.random() * 10;
      const delay = Math.random() * 5;
      const rotation = Math.random() * 360;
      const scale = 0.5 + Math.random() * 1;

      gsap.set(leaf, {
        x: startX,
        y: `${startY}vh`,
        rotation,
        scale,
        opacity: 0
      });

      gsap.to(leaf, {
        x: '110vw',
        y: `${startY + (Math.random() * 20 - 10)}vh`,
        rotation: rotation + 720,
        opacity: 1,
        duration,
        delay,
        ease: "none",
        repeat: -1,
        onStart: () => {
          gsap.to(leaf, { opacity: 1, duration: 1 });
        }
      });
    });

    // Auto-complete after 4 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 1000);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center overflow-hidden pointer-events-none"
        >
          <div ref={containerRef} className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="leaf absolute text-emerald-600/30">
                <Leaf size={24 + Math.random() * 24} />
              </div>
            ))}
          </div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-center z-10"
          >
            <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-emerald-200">
              <Leaf size={48} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">EcoRoute</h1>
            <p className="text-emerald-600 font-bold tracking-widest uppercase text-xs">Smarter Paths for a Greener Planet</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

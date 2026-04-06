import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Map, History, Settings, ChevronRight, Edit2, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { SavedRoute } from '../types';

export const Dashboard: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [viewingJourney, setViewingJourney] = useState<SavedRoute | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved routes
    const loadRoutes = () => {
      const saved = localStorage.getItem('eco_saved_routes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure it's an array and has the expected structure
          if (Array.isArray(parsed)) {
            setSavedRoutes(parsed.reverse()); // Show newest first
          }
        } catch (e) {
          console.error("Failed to parse saved routes", e);
          setSavedRoutes([]);
        }
      }
    };

    loadRoutes();

    const ctx = gsap.context(() => {
      gsap.from(".dash-element", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your journey history?')) {
      localStorage.removeItem('eco_saved_routes');
      setSavedRoutes([]);
      setMessage({ type: 'success', text: 'History cleared' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  return (
    <div ref={containerRef} className="min-h-[100dvh] bg-[#0f291e] flex flex-col font-sans relative overflow-x-hidden overflow-y-auto">
      {/* Pattern as a subtle overlay */}
      <div className="absolute inset-0 bg-natural-pattern opacity-[0.03] pointer-events-none" />
      
      {/* Animated gradient background for a premium feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f291e]/60 via-transparent to-[#0f291e]/90 pointer-events-none" />

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-2xl border-b border-white/20 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Leaf size={18} />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">EcoRoute</h1>
          </Link>
          
          <Link 
            to="/"
            className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-50/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>

          <Link 
            to="/map"
            className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-50/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
          >
            <Map size={14} />
            <span>Map</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8 relative z-10 pb-20">

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="dash-element bg-white/15 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 shadow-2xl hover:bg-white/20 transition-all group relative overflow-hidden flex flex-col min-h-[400px]">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-blue-500/30 text-blue-300 rounded-2xl flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                <History size={28} />
              </div>
              {savedRoutes.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-[10px] font-bold text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Recent Journeys</h3>
            
            <div className="flex-1 space-y-3 mb-6 overflow-y-auto pr-2 custom-scrollbar">
              {savedRoutes.length > 0 ? (
                (showAllHistory ? savedRoutes : savedRoutes.slice(0, 5)).map((route, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={route.id} 
                    className="bg-white/20 p-5 rounded-[1.5rem] border border-white/30 flex items-center justify-between hover:bg-white/30 transition-all group/item shadow-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-white font-extrabold text-base truncate tracking-tight">{route.destination.split(',')[0]}</p>
                        {route.routeData?.isEco && (
                          <span className="bg-emerald-500/40 text-emerald-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/50 backdrop-blur-sm">Eco</span>
                        )}
                      </div>
                      <p className="text-emerald-100 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                        <span>{route.routeData?.distance?.toFixed(1) || '0.0'} km</span>
                        <span className="w-1 h-1 bg-white/60 rounded-full" />
                        <span>{route.routeData?.emissions?.toFixed(1) || '0.0'} kg CO₂</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setViewingJourney(route)}
                        className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white/20 border border-white/10"
                        title="Quick View"
                      >
                        <Edit2 size={18} />
                      </button>
                      <Link to="/map" className="w-10 h-10 rounded-2xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-emerald-500 hover:text-white shadow-lg border border-emerald-500/20">
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <Map size={48} className="mb-4 text-emerald-400" />
                  <p className="text-emerald-50/80 font-medium leading-relaxed">No journeys saved yet. Start exploring to see your history here.</p>
                </div>
              )}
            </div>

            {savedRoutes.length > 5 && (
              <button 
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="flex items-center text-blue-300 font-bold text-sm gap-1 group-hover:gap-2 transition-all mt-auto"
              >
                <span>{showAllHistory ? 'Show Less' : 'View Full History'}</span>
                <ChevronRight size={16} className={showAllHistory ? 'rotate-90' : ''} />
              </button>
            )}
          </div>

          <div className="dash-element bg-white/15 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 shadow-2xl hover:bg-white/20 transition-all group relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors" />
            <div className="w-14 h-14 bg-purple-500/30 text-purple-300 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition-transform">
              <Settings size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Preferences</h3>
            <p className="text-emerald-50/60 font-medium mb-6 leading-relaxed">Customize your vehicle stats and navigation settings to get more accurate emission data.</p>
            <div className="flex items-center text-purple-300 font-bold text-sm gap-1 group-hover:gap-2 transition-all">
              <span>Manage Settings</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="dash-element bg-gradient-to-br from-emerald-600 to-emerald-900 p-10 rounded-[3rem] text-white shadow-[0_30px_60px_rgba(16,185,129,0.4)] relative overflow-hidden border border-emerald-400/40 group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <Leaf className="text-emerald-300" size={24} />
              </div>
              <h3 className="text-emerald-100 font-bold uppercase tracking-widest text-xs">Environmental Impact</h3>
            </div>
            
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-8xl font-black tracking-tighter drop-shadow-2xl">
                {savedRoutes.reduce((acc, route) => acc + (route.routeData?.emissions || 0), 0).toFixed(1)}
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-emerald-100">kg CO₂</span>
                <span className="text-emerald-300/80 text-xs font-bold uppercase tracking-widest">Total Saved</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 max-w-xl">
              <p className="text-emerald-50/90 text-lg font-medium leading-relaxed">
                You've saved the equivalent of planting <span className="text-emerald-300 font-bold underline decoration-emerald-300/30 underline-offset-4">
                  {(savedRoutes.reduce((acc, route) => acc + (route.routeData?.emissions || 0), 0) / 20).toFixed(1)} young trees
                </span> this month. Keep up the great work for our planet!
              </p>
            </div>
          </div>
          
          <Leaf className="absolute -right-10 -bottom-10 text-emerald-900/20 w-80 h-80 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
        </div>
      </main>

      {/* Quick View Modal */}
      <AnimatePresence>
        {viewingJourney && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingJourney(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a3628] rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white tracking-tight">Journey Details</h3>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Saved Route</p>
                  </div>
                  <button 
                    onClick={() => setViewingJourney(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">From</p>
                        <p className="text-white font-medium text-sm">{viewingJourney.source}</p>
                      </div>
                    </div>
                    <div className="w-px h-4 bg-white/10 ml-1" />
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">To</p>
                        <p className="text-white font-medium text-sm">{viewingJourney.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Distance</p>
                      <p className="text-xl font-black text-white">{viewingJourney.routeData?.distance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Emissions</p>
                      <p className="text-xl font-black text-emerald-400">{viewingJourney.routeData?.emissions.toFixed(1)} kg CO₂</p>
                    </div>
                  </div>

                  {viewingJourney.routeData?.summary && (
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Leaf size={12} />
                        Eco Summary
                      </p>
                      <p className="text-emerald-50/80 text-sm leading-relaxed italic">
                        "{viewingJourney.routeData.summary}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Link 
                    to="/map"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Map size={18} />
                    <span>Open in Map</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

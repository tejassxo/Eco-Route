import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, LogOut, Map, History, Settings, User, ChevronRight, Edit2, Save, X, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { SavedRoute } from '../types';

export const Dashboard: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Load saved routes
    const saved = localStorage.getItem('eco_saved_routes');
    if (saved) {
      setSavedRoutes(JSON.parse(saved));
    }

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
  }, [user]);

  if (!user) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    setMessage(null);
    try {
      await updateProfile(editName, editPhoto);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-[100dvh] bg-[#0f291e] flex flex-col font-sans relative overflow-x-hidden overflow-y-auto">
      {/* Pattern as a subtle overlay */}
      <div className="absolute inset-0 bg-natural-pattern opacity-10 pointer-events-none" />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f291e]/40 via-transparent to-[#0f291e]/80 pointer-events-none" />

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
            to="/map"
            className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-50/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
          >
            <Map size={14} />
            <span>Map</span>
          </Link>
        </div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-sm font-bold text-emerald-50/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8 relative z-10 pb-20">
        {/* User Profile Card */}
        <div className="dash-element bg-white/15 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl border border-white/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-500/30 to-transparent" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10">
                {(isEditing ? editPhoto : user.photoURL) ? (
                  <img 
                    src={isEditing ? editPhoto : user.photoURL!} 
                    alt={user.displayName || 'User'} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                  <Camera className="text-white" size={24} />
                </div>
              )}
            </div>

            <div className="text-center md:text-left flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-widest ml-1">Display Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-white placeholder-white/30"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-widest ml-1">Photo URL</label>
                    <input 
                      type="text" 
                      value={editPhoto}
                      onChange={(e) => setEditPhoto(e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-white/80 placeholder-white/30"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-4xl font-black text-white mb-1 tracking-tight">{user.displayName || 'Eco Explorer'}</h2>
                    <p className="text-emerald-50/80 font-medium">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/40 backdrop-blur-md">
                      Eco Warrior
                    </span>
                    <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-blue-500/40 backdrop-blur-md">
                      Level 4
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user.displayName || '');
                      setEditPhoto(user.photoURL || '');
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/20"
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
                  >
                    <Edit2 size={18} />
                    <span>Edit Profile</span>
                  </button>
                  <Link 
                    to="/map"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <Map size={18} />
                    <span>Start Journey</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-6 p-4 rounded-xl text-sm font-bold text-center backdrop-blur-md ${
                  message.type === 'success' ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-500/40' : 'bg-red-500/30 text-red-100 border border-red-500/40'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="dash-element bg-white/15 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/30 shadow-2xl hover:bg-white/20 transition-all group relative overflow-hidden flex flex-col">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors" />
            <div className="w-14 h-14 bg-blue-500/30 text-blue-300 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30 group-hover:scale-110 transition-transform">
              <History size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Recent Journeys</h3>
            
            <div className="flex-1 space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {savedRoutes.length > 0 ? (
                savedRoutes.slice(0, 3).map((route, i) => (
                  <div key={route.id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{route.destination.split(',')[0]}</p>
                      <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-wider">
                        {route.routeData?.distance?.toFixed(1) || '0.0'} km • {route.routeData?.emissions?.toFixed(1) || '0.0'} kg CO₂
                      </p>
                    </div>
                    <Link to="/map" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-emerald-50/60 font-medium leading-relaxed">No journeys saved yet. Start exploring to see your history here.</p>
              )}
            </div>

            <Link to="/map" className="flex items-center text-blue-300 font-bold text-sm gap-1 group-hover:gap-2 transition-all mt-auto">
              <span>View Full History</span>
              <ChevronRight size={16} />
            </Link>
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
        <div className="dash-element bg-gradient-to-br from-emerald-600 to-emerald-800 p-10 rounded-[3rem] text-white shadow-[0_30px_60px_rgba(16,185,129,0.4)] relative overflow-hidden border border-emerald-400/40">
          <div className="relative z-10">
            <h3 className="text-emerald-100 font-bold uppercase tracking-widest text-sm mb-3">Total Impact</h3>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-7xl font-black tracking-tighter">42.5</span>
              <span className="text-2xl font-bold text-emerald-100">kg CO₂ Saved</span>
            </div>
            <p className="text-emerald-50/90 text-xl font-medium leading-relaxed max-w-xl">
              You've saved the equivalent of planting <span className="text-emerald-300 font-bold underline decoration-emerald-300/30 underline-offset-4">2 young trees</span> this month. Keep up the great work for our planet!
            </p>
          </div>
          <Leaf className="absolute -right-10 -bottom-10 text-emerald-900/20 w-80 h-80 rotate-12" />
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        </div>
      </main>
    </div>
  );
};

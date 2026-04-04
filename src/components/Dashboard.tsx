import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Leaf, LogOut, Map, History, Settings, User, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Leaf size={18} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">EcoRoute</h1>
        </Link>
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors bg-gray-50 px-3 py-2 rounded-xl"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        {/* User Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-50 shadow-inner">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User size={40} />
              </div>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back, {user.displayName?.split(' ')[0]}!</h2>
            <p className="text-gray-500 font-medium">{user.email}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-100">
                Eco Explorer
              </span>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100">
                12 Routes Saved
              </span>
            </div>
          </div>
          <Link 
            to="/map"
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
          >
            <Map size={20} />
            <span>Start Journey</span>
          </Link>
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <History size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Recent Journeys</h3>
            <p className="text-sm text-gray-500 font-medium mb-4">View your past eco-friendly routes and CO2 savings.</p>
            <div className="flex items-center text-blue-600 font-bold text-sm gap-1">
              <span>View History</span>
              <ChevronRight size={16} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Preferences</h3>
            <p className="text-sm text-gray-500 font-medium mb-4">Customize your vehicle stats and navigation settings.</p>
            <div className="flex items-center text-purple-600 font-bold text-sm gap-1">
              <span>Manage Settings</span>
              <ChevronRight size={16} />
            </div>
          </motion.div>
        </div>

        {/* Stats Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-emerald-200 relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-emerald-100 font-bold uppercase tracking-widest text-xs mb-2">Total Impact</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black">42.5</span>
              <span className="text-xl font-bold opacity-80">kg CO₂ Saved</span>
            </div>
            <p className="text-emerald-50/80 text-sm font-medium leading-relaxed max-w-md">
              You've saved the equivalent of planting 2 young trees this month. Keep up the great work for our planet!
            </p>
          </div>
          <Leaf className="absolute -right-8 -bottom-8 text-emerald-500/20 w-64 h-64 rotate-12" />
        </motion.div>
      </main>
    </div>
  );
};

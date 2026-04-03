import React, { useState } from 'react';
import { Clock, MapPin, Leaf, ChevronRight, Navigation, List, ChevronDown, ChevronUp } from 'lucide-react';
import { RouteData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface RouteCardProps {
  route: RouteData;
  isSelected: boolean;
  onSelect: () => void;
  onStartNavigation?: () => void;
  savings?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, onSelect, onStartNavigation, savings, onHover, onLeave }) => {
  const [showAllSteps, setShowAllSteps] = useState(false);

  const steps = route.steps || [];
  const displayedSteps = showAllSteps ? steps : steps.slice(0, 3);

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className={`relative p-5 rounded-2xl cursor-pointer border-2 transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100/50'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      {route.isEco && (
        <div className="absolute -top-3 left-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
          <Leaf size={10} /> Best Route 🌱
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{route.summary}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-gray-400" /> {route.distance ? route.distance.toFixed(1) : '0.0'} km
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-gray-400" /> {route.duration} min
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-black ${route.isEco ? 'text-emerald-600' : 'text-gray-800'}`}>
            {route.emissions ? route.emissions.toFixed(2) : '0.00'}
            <span className="text-[10px] font-bold ml-1 uppercase opacity-60">kg CO₂</span>
          </div>
        </div>
      </div>

      {route.isEco && savings !== undefined && savings > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight">
            Eco Savings
          </span>
          <span className="text-sm font-black text-emerald-600">
            -{savings.toFixed(2)} kg CO₂
          </span>
        </div>
      )}

      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            {/* Route Preview Steps */}
            {steps.length > 0 && (
              <div className="mb-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <List size={14} /> {showAllSteps ? 'Full Directions' : 'Route Preview'}
                  </h4>
                  {steps.length > 3 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAllSteps(!showAllSteps); }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      {showAllSteps ? (
                        <>Hide <ChevronUp size={14} /></>
                      ) : (
                        <>Show All <ChevronDown size={14} /></>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-gray-100">
                  {displayedSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-white border-2 border-emerald-500 z-10 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{step.instruction}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{(step.distance * 1000).toFixed(0)}m</p>
                      </div>
                    </div>
                  ))}
                  {!showAllSteps && steps.length > 3 && (
                    <div className="flex gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300 z-10 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-gray-500 italic mt-0.5">...and {steps.length - 3} more steps</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {onStartNavigation && (
              <button 
                onClick={(e) => { e.stopPropagation(); onStartNavigation(); }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Navigation size={18} />
                Start Navigation
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isSelected && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="text-emerald-500" />
        </div>
      )}
    </motion.div>
  );
};

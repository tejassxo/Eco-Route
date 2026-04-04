import React, { useState } from 'react';
import { Clock, MapPin, Leaf, ChevronRight, Navigation, List, ChevronDown, ChevronUp, AlertTriangle, X, Send } from 'lucide-react';
import { RouteData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface RouteCardProps {
  route: RouteData;
  isSelected: boolean;
  onSelect: () => void;
  onStartNavigation?: () => void;
  onOpenGoogleMaps?: () => void;
  savings?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, onSelect, onStartNavigation, onOpenGoogleMaps, savings, onHover, onLeave }) => {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportText, setReportText] = useState('');

  const steps = route.steps || [];
  const displayedSteps = showAllSteps ? steps : steps.slice(0, 3);

  const handleReportSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Report submitted:', { type: reportType, text: reportText, routeId: route.id });
    setShowReportModal(false);
    setReportType('');
    setReportText('');
  };

  return (
    <>
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

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowReportModal(true); }}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold px-4 rounded-xl transition-all flex items-center justify-center border border-gray-100"
                    title="Report Issue"
                  >
                    <AlertTriangle size={18} />
                  </button>
                  {onStartNavigation && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onStartNavigation(); }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Navigation size={18} />
                      Start Navigation
                    </button>
                  )}
                </div>
                {onOpenGoogleMaps && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenGoogleMaps(); }}
                    className="w-full bg-white hover:bg-gray-50 text-emerald-600 font-bold py-3 rounded-xl border-2 border-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin size={18} />
                    Open in Google Maps
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSelected && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="text-emerald-500" />
          </div>
        )}
      </motion.div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative"
            >
              <button 
                onClick={() => setShowReportModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Report Route Issue</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Help us improve EcoRoute</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {['Road Closed', 'Traffic', 'Inaccurate', 'Other'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setReportType(type)}
                      className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                        reportType === type 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                          : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <textarea 
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Tell us more about the issue..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />

                <button 
                  onClick={handleReportSubmit}
                  disabled={!reportType}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={18} />
                  Submit Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Search, Navigation, Car, Bike, Zap, MapPin, Bookmark } from 'lucide-react';
import { VehicleType, SavedRoute } from '../types';
import { VEHICLE_STATS } from '../utils/emissionCalculator';
import { motion, AnimatePresence } from 'motion/react';

interface InputFormProps {
  onSearch: (source: string, destination: string, vehicle: VehicleType, sourceCoords?: [number, number], destCoords?: [number, number]) => void;
  isLoading: boolean;
  externalDestination?: { name: string, coords: [number, number] } | null;
  savedRoutes?: SavedRoute[];
  onSelectSavedRoute?: (route: SavedRoute) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onSearch, isLoading, externalDestination, savedRoutes, onSelectSavedRoute }) => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>(VehicleType.PETROL_CAR);

  const [sourceCoords, setSourceCoords] = useState<[number, number] | undefined>();
  const [destCoords, setDestCoords] = useState<[number, number] | undefined>();

  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  useEffect(() => {
    if (externalDestination) {
      setDestination(externalDestination.name);
      setDestCoords(externalDestination.coords);
    }
  }, [externalDestination]);

  const fetchSuggestions = async (query: string, setSuggestions: (data: any[]) => void) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
        headers: { 'User-Agent': 'EcoRouteApp/1.0' }
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Suggestion fetch error:", error);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (showSourceSuggestions) fetchSuggestions(source, setSourceSuggestions);
    }, 800);
    return () => clearTimeout(handler);
  }, [source, showSourceSuggestions]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (showDestSuggestions) fetchSuggestions(destination, setDestSuggestions);
    }, 800);
    return () => clearTimeout(handler);
  }, [destination, showDestSuggestions]);

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: { 'User-Agent': 'EcoRouteApp/1.0' }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }
        const data = await response.json();
        if (data && data.display_name) {
          setSource(data.display_name);
          setSourceCoords([latitude, longitude]);
          setShowSourceSuggestions(false);
        } else {
          alert("Could not determine your address. Please enter it manually.");
        }
      } catch (error) {
        console.error("Locate me error:", error);
        alert("Could not determine your address. Please enter it manually.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (source && destination) onSearch(source, destination, vehicle, sourceCoords, destCoords);
  };

  const selectedStats = VEHICLE_STATS[vehicle];

  return (
    <div className="space-y-4">
      {savedRoutes && savedRoutes.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <Bookmark size={14} /> Saved Routes
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {savedRoutes.map(sr => (
              <button
                key={sr.id}
                type="button"
                onClick={() => {
                  setSource(sr.source);
                  setDestination(sr.destination);
                  setSourceCoords(sr.sourceCoords);
                  setDestCoords(sr.destCoords);
                  if (onSelectSavedRoute) onSelectSavedRoute(sr);
                }}
                className="whitespace-nowrap px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                {sr.source.split(',')[0]} → {sr.destination.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-2 relative">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Navigation size={14} /> Source
          </label>
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={source}
              onChange={(e) => { 
                setSource(e.target.value); 
                setSourceCoords(undefined);
                setShowSourceSuggestions(true); 
              }}
              onFocus={() => setShowSourceSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSourceSuggestions(false), 200)}
              placeholder="Enter starting point"
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-800"
              required
            />
            <button type="button" onClick={handleLocateMe} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200" title="Locate Me">
              <MapPin size={20} />
            </button>
            
            {/* Source Suggestions */}
            {showSourceSuggestions && sourceSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {sourceSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-3 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-b-0 transition-colors"
                    onClick={() => {
                      setSource(s.display_name);
                      setSourceCoords([parseFloat(s.lat), parseFloat(s.lon)]);
                      setShowSourceSuggestions(false);
                    }}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Search size={14} /> Destination
          </label>
          <div className="relative">
            <input
              type="text"
              value={destination}
              onChange={(e) => { 
                setDestination(e.target.value); 
                setDestCoords(undefined);
                setShowDestSuggestions(true); 
              }}
              onFocus={() => setShowDestSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
              placeholder="Enter destination (or tap on map)"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-800"
              required
            />
            
            {/* Destination Suggestions */}
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {destSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="p-3 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-b-0 transition-colors"
                    onClick={() => {
                      setDestination(s.display_name);
                      setDestCoords([parseFloat(s.lat), parseFloat(s.lon)]);
                      setShowDestSuggestions(false);
                    }}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Car size={14} /> Vehicle Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(VehicleType).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setVehicle(type)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  vehicle === type
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="truncate">{type}</span>
              </button>
            ))}
          </div>
          
          {/* Vehicle Stats */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={vehicle}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 flex flex-col gap-2 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase tracking-wider">CO₂ Factor</span>
                <span className="font-semibold text-gray-900">{selectedStats.co2PerL ? `${selectedStats.co2PerL} kg/L` : `${selectedStats.co2PerKm} kg/km`}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase tracking-wider">Typical Mileage</span>
                <span className="font-semibold text-gray-900">{selectedStats.mileage} {selectedStats.unit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase tracking-wider">Energy Consumption</span>
                <span className={`font-semibold px-2 py-0.5 rounded-md ${
                  selectedStats.energy === 'High' ? 'bg-red-100 text-red-700' : 
                  selectedStats.energy === 'Low' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedStats.energy}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
        >
          {isLoading ? "Finding..." : "Find Routes"}
        </button>
      </form>
    </div>
  );
};

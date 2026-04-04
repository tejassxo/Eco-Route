import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MapComponent } from './components/MapComponent';
import { InputForm } from './components/InputForm';
import { RouteCard } from './components/RouteCard';
import { NavigationOverlay } from './components/NavigationOverlay';
import { VehicleType, RouteData, SavedRoute } from './types';
import { calculateEmissions } from './utils/emissionCalculator';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Info, AlertCircle, BarChart2, BookmarkPlus } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { ChatVihari } from './components/ChatVihari';
import { GoogleGenAI, Type } from '@google/genai';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScenicOpening } from './components/ScenicOpening';
import { Dashboard } from './components/Dashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Leaf className="animate-spin text-emerald-600" /></div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

const geocode = async (query: string) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: { 'User-Agent': 'EcoRouteApp/1.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

const MapPage = () => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [carPosition, setCarPosition] = useState<[number, number] | null>(null);
  const [carHeading, setCarHeading] = useState(0);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleType>(VehicleType.PETROL_CAR);
  
  const [mapSelectedDest, setMapSelectedDest] = useState<{name: string, coords: [number, number]} | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | number | null>(null);
  const [currentSearch, setCurrentSearch] = useState<{source: string, destination: string, sourceCoords?: [number, number], destCoords?: [number, number]} | null>(null);
  
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => {
    const saved = localStorage.getItem('eco_saved_routes');
    return saved ? JSON.parse(saved) : [];
  });

  const handleMapClick = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
        headers: { 'User-Agent': 'EcoRouteApp/1.0' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setMapSelectedDest({ name: data.display_name, coords: [lat, lon] });
        if (window.innerWidth < 1024) {
          setIsPanelExpanded(true);
        }
      }
    } catch (e) {
      console.error("Reverse geocoding error:", e);
    }
  };

  const handleSaveRoute = () => {
    if (!currentSearch) return;
    const newSaved = [...savedRoutes, { id: Date.now().toString(), ...currentSearch }];
    setSavedRoutes(newSaved);
    localStorage.setItem('eco_saved_routes', JSON.stringify(newSaved));
  };

  const handleSearch = useCallback(async (source: string, destination: string, vehicle: VehicleType, providedSourceCoords?: [number, number], providedDestCoords?: [number, number]) => {
    setIsPanelExpanded(true);
    setIsLoading(true);
    setError(null);
    setCurrentVehicle(vehicle);
    setCurrentSearch({ source, destination, sourceCoords: providedSourceCoords, destCoords: providedDestCoords });

    try {
      const srcCoords = providedSourceCoords || await geocode(source);
      const destCoords = providedDestCoords || await geocode(destination);

      if (!srcCoords || !destCoords) {
        throw new Error("Could not find coordinates for the given locations. Please try a different search term.");
      }

      // Fetch real routes from OSRM
      let osrmRes;
      try {
        osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${srcCoords[1]},${srcCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson&alternatives=true&steps=true`);
        if (!osrmRes.ok) {
          throw new Error(`OSRM API error: ${osrmRes.status}`);
        }
      } catch (e) {
        throw new Error("Failed to fetch route data. Please check your internet connection or try again later.");
      }
      
      const osrmData = await osrmRes.json();

      if (!osrmData.routes || osrmData.routes.length === 0) {
        throw new Error("No driving routes found between these locations.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `I have found ${osrmData.routes.length} driving routes from ${source} to ${destination}. Provide a short, catchy 2-3 word summary name for each route (e.g., "Fastest Route", "Scenic Path"). Return a JSON array of strings.`;

      let summaries = ["Main Route", "Alternative 1", "Alternative 2"];
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        });
        const aiSummaries = JSON.parse(response.text || "[]");
        if (aiSummaries.length >= osrmData.routes.length) summaries = aiSummaries;
      } catch (e) { console.error("AI summary failed, using defaults", e); }

      const processedRoutes: RouteData[] = osrmData.routes.map((route: any, index: number) => {
        const distanceKm = route.distance / 1000;
        const durationMin = Math.round(route.duration / 60);
        const { co2 } = calculateEmissions(distanceKm, vehicle);
        
        // Flip coordinates from [lon, lat] to [lat, lon] for Leaflet
        const polyline = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        
        const steps = route.legs[0].steps.map((step: any) => ({
          instruction: step.maneuver.type + (step.name ? ` onto ${step.name}` : ''),
          distance: step.distance / 1000,
          location: [step.maneuver.location[1], step.maneuver.location[0]]
        }));

        // Calculate bounds
        const lats = polyline.map((p: any) => p[0]);
        const lons = polyline.map((p: any) => p[1]);
        const bounds: [[number, number], [number, number]] = [
          [Math.min(...lats), Math.min(...lons)],
          [Math.max(...lats), Math.max(...lons)]
        ];

        return {
          id: `route-${index}-${Date.now()}`,
          distance: distanceKm,
          duration: durationMin,
          summary: summaries[index] || `Route ${index + 1}`,
          polyline,
          steps,
          bounds,
          emissions: co2,
          isEco: false,
        };
      });

      const minEmissions = Math.min(...processedRoutes.map(r => r.emissions));
      const finalRoutes = processedRoutes.map(r => ({
        ...r,
        isEco: r.emissions === minEmissions,
      }));

      setRoutes(finalRoutes);
      setSelectedRouteIndex(finalRoutes.findIndex(r => r.isEco));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not find routes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ecoRoute = routes.find(r => r.isEco);
  const worstRoute = routes.length > 0 ? routes.reduce((prev, current) => (prev.emissions > current.emissions) ? prev : current) : null;
  const savings = (ecoRoute && worstRoute) ? worstRoute.emissions - ecoRoute.emissions : 0;

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-gray-50 overflow-hidden font-sans relative">
      {/* Left: Map */}
      <div className="flex-1 relative w-full h-full">
        <MapComponent 
          routes={routes} 
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={setSelectedRouteIndex}
          isNavigating={isNavigating}
          carPosition={carPosition}
          carHeading={carHeading}
          onMapClick={handleMapClick}
          hoveredRouteId={hoveredRouteId}
          onRouteHover={setHoveredRouteId}
        />
        
        {/* Floating Stats Overlay (Hidden during navigation) */}
        <AnimatePresence>
          {!isNavigating && routes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-6 lg:top-auto lg:bottom-6 left-6 right-6 lg:right-auto lg:w-80 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 z-10"
              style={{ marginTop: 'env(safe-area-inset-top)' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Leaf size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Eco Impact</h4>
                  <p className="text-lg font-black text-gray-900">
                    {savings && savings > 0 ? `${savings.toFixed(2)} kg CO₂ Saved` : "Optimal Route Found"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                By choosing the greenest path, you're reducing your carbon footprint significantly.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Overlay */}
        {isNavigating && routes[selectedRouteIndex] && (
          <NavigationOverlay 
            route={routes[selectedRouteIndex]} 
            vehicle={currentVehicle}
            onStop={() => setIsNavigating(false)}
            onPositionUpdate={(pos, heading) => {
              setCarPosition(pos);
              setCarHeading(heading);
            }}
          />
        )}
      </div>

      {/* Right: Panel (Hidden during navigation) */}
      <AnimatePresence>
        {!isNavigating && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: isPanelExpanded ? 0 : 'calc(100% - 80px)' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full lg:w-[450px] bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-2xl z-20 absolute bottom-0 lg:relative lg:bottom-auto lg:right-0 h-[80dvh] lg:h-full rounded-t-3xl lg:rounded-none lg:!transform-none"
          >
            {/* Mobile Drag Handle */}
            <div 
              className="w-full h-10 flex items-center justify-center lg:hidden cursor-pointer"
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            <header className="px-6 pb-4 pt-2 lg:pt-6 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                  <Leaf size={18} />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">EcoRoute</h1>
              </div>
              <p className="text-sm text-gray-500 font-medium">Smarter paths for a greener planet.</p>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <InputForm 
                  onSearch={handleSearch} 
                  isLoading={isLoading} 
                  externalDestination={mapSelectedDest}
                  savedRoutes={savedRoutes}
                />
              </section>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </motion.div>
                )}

                {routes.length > 0 ? (
                  <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Routes</h2>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {routes.length} Options
                        </span>
                      </div>
                      <button 
                        onClick={handleSaveRoute}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <BookmarkPlus size={14} /> Save Route
                      </button>
                    </div>

                    {/* Route Comparison UI */}
                    {routes.length > 1 && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <BarChart2 size={14} /> Route Comparison
                        </h3>
                        <div className="flex flex-col gap-2">
                          {routes.map((r, idx) => (
                            <div 
                              key={`comp-${r.id}`} 
                              className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer ${selectedRouteIndex === idx ? 'bg-white shadow-sm border border-emerald-100' : 'hover:bg-white border border-transparent'}`}
                              onClick={() => setSelectedRouteIndex(idx)}
                              onMouseEnter={() => setHoveredRouteId(r.id)}
                              onMouseLeave={() => setHoveredRouteId(null)}
                            >
                              <span className="font-medium text-gray-700 w-1/3 truncate">{r.summary}</span>
                              <span className="text-gray-500 w-1/5 text-center">{r.duration}m</span>
                              <span className="text-gray-500 w-1/5 text-center">{r.distance.toFixed(1)}km</span>
                              <span className={`font-bold w-1/5 text-right ${r.isEco ? 'text-emerald-600' : 'text-gray-700'}`}>{r.emissions.toFixed(1)}kg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {routes.map((route, index) => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          isSelected={selectedRouteIndex === index}
                          onSelect={() => setSelectedRouteIndex(index)}
                          onHover={() => setHoveredRouteId(route.id)}
                          onLeave={() => setHoveredRouteId(null)}
                          onStartNavigation={() => {
                            setCarPosition(route.polyline[0]);
                            setIsNavigating(true);
                          }}
                          savings={route.isEco ? savings : undefined}
                        />
                      ))}
                    </div>
                  </motion.section>
                ) : !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-gray-900 font-bold mb-1">No routes yet</h3>
                    <p className="text-gray-500 text-sm px-8">Enter a source and destination to start your eco-friendly journey.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Powered by OSRM & Gemini</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>EcoRoute v2.0</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [showOpening, setShowOpening] = useState(() => {
    return !sessionStorage.getItem('opening_shown');
  });

  const handleOpeningComplete = () => {
    setShowOpening(false);
    sessionStorage.setItem('opening_shown', 'true');
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatePresence>
          {showOpening && <ScenicOpening onComplete={handleOpeningComplete} />}
        </AnimatePresence>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/map" element={
            <div className="relative h-[100dvh]">
              <MapPage />
              <ChatVihari />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

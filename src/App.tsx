import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MapComponent } from './components/MapComponent';
import { InputForm } from './components/InputForm';
import { RouteCard } from './components/RouteCard';
import { NavigationOverlay } from './components/NavigationOverlay';
import { VehicleType, RouteData, SavedRoute } from './types';
import { calculateEmissions } from './utils/emissionCalculator';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Info, AlertCircle, BarChart2, BookmarkPlus, Key, Navigation, User } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { CareersPage, BlogPage, TermsPage, PrivacyPage, CookiesPage, FeaturesPage, BuilderPage, VerificationPage } from './pages/ContentPages';
import { ChatVihari } from './components/ChatVihari';
import { ThemeToggle } from './components/ThemeToggle';
import { GoogleGenAI, Type } from '@google/genai';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScenicOpening } from './components/ScenicOpening';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader } from './components/Loader';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/" />;

  return <>{children}</>;
};

const geocode = async (query: string) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: { 'User-Agent': 'EcoRouteApp/1.0' }
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
      throw new Error(`Geocoding service error: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number];
    return null;
  } catch (error: any) {
    console.error("Geocoding error:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

const MapPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    // Clear existing routes and selection when clicking on map to set new destination
    setRoutes([]);
    setSelectedRouteIndex(0);
    setError(null);
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
        headers: { 'User-Agent': 'EcoRouteApp/1.0' }
      });
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();
      if (data && data.display_name) {
        setMapSelectedDest({ name: data.display_name, coords: [lat, lon] });
        if (window.innerWidth < 1024) {
          setIsPanelExpanded(true);
        }
      }
    } catch (e: any) {
      console.error("Reverse geocoding error:", e);
      setError("Could not identify the location on the map. Please try again.");
    }
  };

  const handleSaveRoute = () => {
    if (!currentSearch || routes.length === 0) return;
    const selectedRoute = routes[selectedRouteIndex];
    const newSaved: SavedRoute = { 
      id: Date.now().toString(), 
      ...currentSearch,
      routeData: selectedRoute 
    };
    const updatedSaved = [...savedRoutes, newSaved];
    setSavedRoutes(updatedSaved);
    localStorage.setItem('eco_saved_routes', JSON.stringify(updatedSaved));
  };

  const handleOpenGoogleMaps = (route: RouteData) => {
    if (!currentSearch) return;
    const origin = currentSearch.source;
    const destination = currentSearch.destination;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleViewOffline = (route: RouteData) => {
    setRoutes([route]);
    setSelectedRouteIndex(0);
    setIsPanelExpanded(true);
  };

  const [ecoTips, setEcoTips] = useState<string | null>(null);

  const handleSearch = useCallback(async (source: string, destination: string, vehicle: VehicleType, providedSourceCoords?: [number, number], providedDestCoords?: [number, number]) => {
    setIsPanelExpanded(true);
    setIsLoading(true);
    setError(null);
    setEcoTips(null);
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

      let summaries = ["Main Route", "Alternative 1", "Alternative 2"];
      try {
        if (process.env.GEMINI_API_KEY) {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const prompt = `I have found ${osrmData.routes.length} driving routes from ${source} to ${destination}. Provide a short, catchy 2-3 word summary name for each route (e.g., "Fastest Route", "Scenic Path"). Return a JSON array of strings.`;
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
        }
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
      const initialSelected = finalRoutes.findIndex(r => r.isEco);
      setSelectedRouteIndex(initialSelected);

      // Fetch Eco Tips via Gemini
      try {
        if (process.env.GEMINI_API_KEY) {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const selectedRoute = finalRoutes[initialSelected];
          const prompt = `Provide 2-3 short, actionable eco-friendly driving tips for a ${selectedRoute.distance.toFixed(1)}km trip from ${source} to ${destination} using a ${vehicle}. Focus on reducing CO2 emissions.`;
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
          });
          setEcoTips(response.text || null);
        }
      } catch (e) { console.error("Eco tips failed", e); }
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
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-gray-50 overflow-hidden font-sans relative isolate">
      {/* Left: Map */}
      <div className="flex-1 relative w-full h-full z-0">
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
          vehicleType={currentVehicle}
          currentSearch={currentSearch}
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
                {ecoTips || "By choosing the greenest path, you're reducing your carbon footprint significantly."}
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
            currentSearch={currentSearch}
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
            className="w-full lg:w-[450px] bg-white/80 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/40 flex flex-col shadow-[0_-15px_50px_rgba(0,0,0,0.1)] lg:shadow-2xl z-[2000] absolute bottom-0 lg:relative lg:bottom-auto lg:right-0 h-[85dvh] lg:h-full rounded-t-[3rem] lg:rounded-none lg:!transform-none overflow-hidden"
          >
            {/* Mobile Drag Handle */}
            <div 
              className="w-full h-14 flex items-center justify-center lg:hidden cursor-pointer touch-none active:bg-gray-50/50 transition-colors"
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            >
              <div className="w-12 h-1.5 bg-gray-300/60 rounded-full"></div>
            </div>

            <header className="px-6 pb-4 pt-2 lg:pt-6 border-b border-gray-50 flex items-start justify-between">
              <div 
                className="cursor-pointer group"
                onClick={() => navigate('/')}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Leaf size={18} />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-emerald-600 transition-colors">EcoRoute</h1>
                </div>
                <p className="text-sm text-gray-500 font-medium">Smarter paths for a greener planet.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button 
                  onClick={() => navigate('/')}
                  className="p-2.5 bg-white/50 backdrop-blur-md text-gray-600 rounded-xl hover:bg-white transition-all flex items-center gap-2 font-bold text-xs border border-gray-100"
                >
                  <Navigation size={16} />
                  <span className="hidden sm:inline">Home</span>
                </button>
                
                {user ? (
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 font-bold text-xs"
                  >
                    <BarChart2 size={16} />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/login')}
                    className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold text-xs shadow-lg shadow-emerald-600/20"
                  >
                    <User size={16} />
                    <span>Login</span>
                  </button>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <InputForm 
                  onSearch={handleSearch} 
                  isLoading={isLoading} 
                  externalDestination={mapSelectedDest}
                  savedRoutes={savedRoutes}
                  onViewOffline={handleViewOffline}
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
                          onOpenGoogleMaps={() => handleOpenGoogleMaps(route)}
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

const MainContent = () => {
  const { loading } = useAuth();
  const [showOpening, setShowOpening] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem('ecoRoute_opening_seen');
    if (seen) setShowOpening(false);
  }, []);

  const handleOpeningComplete = () => {
    setShowOpening(false);
    localStorage.setItem('ecoRoute_opening_seen', 'true');
  };

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <AnimatePresence>
        {showOpening && <ScenicOpening onComplete={handleOpeningComplete} />}
      </AnimatePresence>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <div className="relative h-[100dvh]">
              <MapPage />
              <ChatVihari />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <MainContent />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

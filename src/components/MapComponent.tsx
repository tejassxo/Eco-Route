import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteData } from '../types';
import { Compass, Navigation, Zap, LocateFixed, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MAP_LAYERS = {
  street: { name: 'Street', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  satellite: { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  terrain: { name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
};

interface MapComponentProps {
  routes: RouteData[];
  selectedRouteIndex: number;
  onRouteSelect: (index: number) => void;
  isNavigating?: boolean;
  carPosition?: [number, number] | null;
  carHeading?: number;
  onMapClick?: (lat: number, lon: number) => void;
  hoveredRouteId?: string | number | null;
  onRouteHover?: (id: string | number | null) => void;
}

const MapController = ({ routes, selectedRouteIndex, isNavigating, carPosition, carHeading, userLocation, shouldRecenter }: any) => {
  const map = useMap();

  useEffect(() => {
    if (shouldRecenter && userLocation) {
      map.setView(userLocation, 16, { animate: true });
    }
  }, [shouldRecenter, userLocation, map]);

  useEffect(() => {
    if (isNavigating && carPosition) {
      map.setView(carPosition, 16, { animate: true, duration: 1 });
    } else if (routes.length > 0 && routes[selectedRouteIndex]?.bounds) {
      map.fitBounds(routes[selectedRouteIndex].bounds, { padding: [50, 50] });
    }
  }, [routes, selectedRouteIndex, isNavigating, carPosition, map]);

  return null;
};

const MapEvents = ({ onMapClick }: { onMapClick?: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ 
  routes, 
  selectedRouteIndex, 
  onRouteSelect,
  isNavigating,
  carPosition,
  carHeading,
  onMapClick,
  hoveredRouteId,
  onRouteHover
}) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [speed, setSpeed] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [shouldRecenter, setShouldRecenter] = useState(0);
  const watchId = useRef<number | null>(null);

  const lastPosRef = useRef<{lat: number, lon: number, time: number} | null>(null);

  const [speedTrend, setSpeedTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    if ('geolocation' in navigator) {
      // Initial position
      navigator.geolocation.getCurrentPosition(
        (pos) => { 
          const initialPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(initialPos); 
          setIsLoading(false); 
          lastPosRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude, time: Date.now() };
        },
        () => { setIsLoading(false); }
      );

      // Watch position for live traversal and speed
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(newPos);
          setAccuracy(pos.coords.accuracy);
          
          const now = Date.now();
          let currentSpeed = 0;
          
          // Speed is in m/s, convert to km/h
          if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
            currentSpeed = Math.round(pos.coords.speed * 3.6);
          } else if (lastPosRef.current) {
            // Manual speed calculation: distance / time
            const R = 6371e3; // Earth radius in meters
            const φ1 = lastPosRef.current.lat * Math.PI / 180;
            const φ2 = pos.coords.latitude * Math.PI / 180;
            const Δφ = (pos.coords.latitude - lastPosRef.current.lat) * Math.PI / 180;
            const Δλ = (pos.coords.longitude - lastPosRef.current.lon) * Math.PI / 180;

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c; // in meters
            
            const timeDiff = (now - lastPosRef.current.time) / 1000; // in seconds
            if (timeDiff > 0.5) { // Avoid noise from very frequent updates
              currentSpeed = (distance / timeDiff) * 3.6; // km/h
            }
          }

          setSpeed(prev => {
            const smoothed = Math.round(prev * 0.3 + currentSpeed * 0.7);
            if (smoothed > prev + 1) setSpeedTrend('up');
            else if (smoothed < prev - 1) setSpeedTrend('down');
            else setSpeedTrend('stable');
            return smoothed;
          });
          
          lastPosRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude, time: now };
        },
        (err) => console.error("Geolocation watch error:", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    } else {
      setIsLoading(false);
    }

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const handleRecenter = () => {
    setShouldRecenter(prev => prev + 1);
  };

  const customNavIcon = L.divIcon({
    html: `
      <div style="transform: rotate(${carHeading || 0}deg); transition: transform 0.3s; width: 40px; height: 40px; background: #2563eb; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);">
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const userIcon = L.divIcon({
    html: `
      <div class="relative">
        <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
        <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
      </div>
    `,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className="relative w-full h-full group">
      {isLoading && <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-700 font-bold animate-pulse">Initializing GPS...</p>
        </div>
      </div>}

      {/* Map Controls */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
        <button 
          onClick={handleRecenter}
          className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-gray-700 hover:bg-white hover:text-emerald-600 transition-all active:scale-95 group/btn"
          title="Recenter Map"
        >
          <LocateFixed size={24} className="group-hover/btn:rotate-12 transition-transform" />
        </button>
        <button 
          className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-gray-700 hover:bg-white hover:text-emerald-600 transition-all active:scale-95"
          title="Map Layers"
        >
          <MapIcon size={24} />
        </button>
      </div>

      {/* Speedometer & GPS Info */}
      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-gray-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 min-w-[180px]"
        >
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Zap size={24} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white tabular-nums">{speed}</span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">km/h</span>
              {speedTrend !== 'stable' && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`ml-1 ${speedTrend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {speedTrend === 'up' ? '▲' : '▼'}
                </motion.span>
              )}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Speed</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20 flex items-center gap-3"
        >
          <div className={`w-2 h-2 rounded-full ${accuracy && accuracy < 20 ? 'bg-emerald-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            GPS Accuracy: {accuracy ? `${Math.round(accuracy)}m` : 'Calibrating...'}
          </span>
        </motion.div>
      </div>

      <MapContainer center={userLocation || [20.5937, 78.9629]} zoom={13} className="w-full h-full" zoomControl={false}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street">
            <TileLayer url={MAP_LAYERS.street.url} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer 
              url={MAP_LAYERS.satellite.url}
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer 
              url={MAP_LAYERS.terrain.url}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <MapEvents onMapClick={onMapClick} />
        
        {userLocation && <Marker position={userLocation} icon={userIcon} zIndexOffset={500} />}
        
        {routes.map((route, index) => {
          const isSelected = index === selectedRouteIndex;
          const isHovered = route.id === hoveredRouteId;
          if (!route.polyline || route.polyline.length === 0) return null;
          
          return (
            <Polyline
              key={route.id}
              positions={route.polyline}
              pathOptions={{
                color: isSelected ? (route.isEco ? '#10b981' : '#3b82f6') : '#9ca3af',
                weight: isHovered ? 8 : (isSelected ? 6 : 4),
                opacity: isHovered ? 1 : (isSelected ? 0.9 : 0.5),
              }}
              eventHandlers={{
                click: () => !isNavigating && onRouteSelect(index),
                mouseover: () => !isNavigating && onRouteHover?.(route.id),
                mouseout: () => !isNavigating && onRouteHover?.(null),
              }}
            />
          );
        })}

        {isNavigating && carPosition && (
          <Marker position={carPosition} icon={customNavIcon} zIndexOffset={1000} />
        )}

        <MapController 
          routes={routes} 
          selectedRouteIndex={selectedRouteIndex} 
          isNavigating={isNavigating}
          carPosition={carPosition}
          carHeading={carHeading}
          userLocation={userLocation}
          shouldRecenter={shouldRecenter}
        />
      </MapContainer>
    </div>
  );
};

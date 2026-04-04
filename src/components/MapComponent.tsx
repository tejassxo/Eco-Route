import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteData } from '../types';

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

const MapController = ({ routes, selectedRouteIndex, isNavigating, carPosition, carHeading }: any) => {
  const map = useMap();

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

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setIsLoading(false); },
        () => { setIsLoading(false); }
      );
    } else {
      setIsLoading(false);
    }
  }, []);

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

  return (
    <div className="relative w-full h-full">
      {isLoading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50">Loading...</div>}
      <MapContainer center={userLocation || [20.5937, 78.9629]} zoom={5} className="w-full h-full" zoomControl={false}>
        <TileLayer url={MAP_LAYERS.street.url} />
        <MapEvents onMapClick={onMapClick} />
        
        {!isNavigating && userLocation && <Marker position={userLocation}><Popup>You are here</Popup></Marker>}
        
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
        />
      </MapContainer>
    </div>
  );
};

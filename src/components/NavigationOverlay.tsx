import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, Leaf, Compass, Volume2, VolumeX } from 'lucide-react';
import { RouteData, VehicleType } from '../types';
import { calculateEmissions } from '../utils/emissionCalculator';

interface NavigationOverlayProps {
  route: RouteData;
  vehicle: VehicleType;
  onStop: () => void;
  onPositionUpdate: (pos: [number, number], heading: number) => void;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ route, vehicle, onStop, onPositionUpdate }) => {
  const [speed, setSpeed] = useState(0);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const speedNeedleRef = useRef<SVGCircleElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalDistance = route.distance;
  const currentStep = route.steps?.[currentStepIndex] || { instruction: 'Follow the route', distance: 0 };
  const co2Emitted = calculateEmissions(distanceCovered, vehicle).co2;

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(containerRef.current, 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
    );

    let progress = 0;
    const polyline = route.polyline;
    if (!polyline || polyline.length === 0) return;

    const interval = setInterval(() => {
      // Simulate driving
      progress += 0.001; // Move along the polyline
      if (progress >= 1) {
        progress = 1;
        clearInterval(interval);
      }

      const index = Math.min(Math.floor(progress * polyline.length), polyline.length - 1);
      const nextIndex = Math.min(index + 1, polyline.length - 1);
      
      const pos = polyline[index];
      const nextPos = polyline[nextIndex];
      
      // Calculate heading
      const dy = nextPos[0] - pos[0];
      const dx = nextPos[1] - pos[1];
      const heading = Math.atan2(dy, dx) * (180 / Math.PI);

      onPositionUpdate(pos, heading);

      // Simulate speed (fluctuating between 40 and 80)
      const simulatedSpeed = progress < 1 ? 40 + Math.random() * 40 : 0;
      setSpeed(Math.round(simulatedSpeed));
      setDistanceCovered(progress * totalDistance);

      // Update step (simplified logic)
      if (route.steps) {
        const stepProgress = Math.floor(progress * route.steps.length);
        setCurrentStepIndex(Math.min(stepProgress, route.steps.length - 1));
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [route, totalDistance, onPositionUpdate]);

  useEffect(() => {
    // Animate speedometer needle
    if (speedNeedleRef.current) {
      const maxSpeed = 120;
      const circumference = 2 * Math.PI * 24; // r=24
      const offset = circumference - (speed / maxSpeed) * circumference;
      gsap.to(speedNeedleRef.current, {
        strokeDashoffset: offset,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }, [speed]);

  // TTS for instructions
  useEffect(() => {
    if (!isMuted && currentStep && currentStep.instruction && 'speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const textToSpeak = `${currentStep.instruction}. ${currentStep.distance > 0 ? `In ${Math.round(currentStep.distance * 1000)} meters.` : ''}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices.find(v => v.lang.includes('en'));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Speech synthesis error:", e);
      }
    }
  }, [currentStepIndex, isMuted]);

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-x-0 top-0 z-[1000] p-4 pointer-events-none flex flex-col items-center gap-3" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      
      {/* Top Bar: Turn by Turn */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Compass size={24} className="animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              {currentStep.distance > 0 ? `In ${(currentStep.distance * 1000).toFixed(0)}m` : 'Now'}
            </p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
              {currentStep.instruction}
            </h2>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4 shrink-0">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            title={isMuted ? "Unmute navigation" : "Mute navigation"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button 
            onClick={onStop}
            className="w-10 h-10 bg-red-50 hover:bg-red-100 text-red-600 rounded-full flex items-center justify-center transition-colors"
            title="Stop Navigation"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Stats (Compact) */}
      <div className="w-full max-w-md flex gap-2 pointer-events-auto">
        
        {/* Speed & Progress */}
        <div className="flex-1 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200 shadow-lg flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="24" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle 
                ref={speedNeedleRef}
                cx="50" cy="50" r="24" 
                fill="none" stroke="#3b82f6" strokeWidth="8" 
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-black text-gray-800">{speed}</span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
              <span>{(totalDistance - distanceCovered).toFixed(1)} km left</span>
              <span>{Math.ceil(route.duration * (1 - distanceCovered/totalDistance))} min</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                style={{ width: `${(distanceCovered / totalDistance) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live CO2 */}
        <div className="bg-emerald-600/95 backdrop-blur-md rounded-2xl p-3 border border-emerald-500 shadow-lg flex flex-col justify-center items-center text-white min-w-[90px]">
          <Leaf size={14} className="mb-0.5 opacity-80" />
          <p className="text-lg font-black leading-none">{co2Emitted.toFixed(1)}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">kg CO₂</p>
        </div>

      </div>
    </div>
  );
};

/**
 * Chaotic Roads - Main Application Entry
 * Endless Highway Driving Simulator
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import {
  CameraView,
  TimeOfDay,
  TrafficDensity,
  VehiclePhysicsState,
  VehicleType,
  WeatherType,
} from './types';
import { CockpitDashboardOverlay } from './components/CockpitDashboardOverlay';
import { ControlsHUD } from './components/ControlsHUD';
import { SpotifyInfotainmentModal } from './components/SpotifyInfotainmentModal';
import { RecommendationsModal } from './components/RecommendationsModal';
import { soundEngine } from './audio/SoundEngine';
import { spotifyManager } from './spotify/SpotifyManager';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // States
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [cameraView, setCameraView] = useState<CameraView>('cockpit');
  const [trafficDensity, setTrafficDensity] = useState<TrafficDensity>('moderate');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('sunset');
  const [autoTimeCycle, setAutoTimeCycle] = useState<boolean>(false);

  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [nearMissScore, setNearMissScore] = useState<number>(0);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(false);

  // Dynamic physics snapshot for HUD gauges
  const [physics, setPhysics] = useState<VehiclePhysicsState>({
    speed: 0,
    rpm: 900,
    gear: 1,
    steerAngle: 0,
    throttle: 0,
    brake: 0,
    isBoosting: false,
    boostFuel: 100,
    laneOffset: 0,
    highwayDistance: 0,
    worldX: 0,
    worldY: 0,
    worldZ: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    leftBlinker: false,
    rightBlinker: false,
    headlights: true,
    isDrifting: false,
    odometerMiles: 0,
  });

  // Mount 3D Game Engine
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new GameEngine(canvasContainerRef.current);
    gameEngineRef.current = engine;

    engine.onPhysicsUpdate = (state) => {
      setPhysics(state);
    };

    engine.onNearMissScore = (streak) => {
      setNearMissScore(streak);
      setTimeout(() => {
        setNearMissScore(0);
      }, 2500);
    };

    engine.start();

    return () => {
      engine.destroy();
      gameEngineRef.current = null;
    };
  }, []);

  // Handle first user gesture to unlock AudioContext
  const handleUserInteract = () => {
    if (!hasStartedAudio) {
      soundEngine.init();
      spotifyManager.initRadioSynth();
      setHasStartedAudio(true);
    }
  };

  // Sync state changes with engine
  const handleSetVehicleType = (type: VehicleType) => {
    setVehicleType(type);
    gameEngineRef.current?.setVehicleType(type);
  };

  const handleSetCameraView = (view: CameraView) => {
    setCameraView(view);
    gameEngineRef.current?.setCameraView(view);
  };

  const handleSetTrafficDensity = (density: TrafficDensity) => {
    setTrafficDensity(density);
    gameEngineRef.current?.setTrafficDensity(density);
  };

  const handleSetWeather = (w: WeatherType) => {
    setWeather(w);
    gameEngineRef.current?.setWeather(w);
  };

  const handleSetTimeOfDay = (t: TimeOfDay) => {
    setTimeOfDay(t);
    gameEngineRef.current?.setTimeOfDay(t);
  };

  const handleSetAutoTimeCycle = (enabled: boolean) => {
    setAutoTimeCycle(enabled);
    gameEngineRef.current?.setAutoTimeCycle(enabled);
  };

  return (
    <div
      id="app-root"
      onClick={handleUserInteract}
      onKeyDown={handleUserInteract}
      className="relative w-screen h-screen overflow-hidden select-none bg-black font-sans"
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={canvasContainerRef}
        id="viewport-canvas-container"
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Realistic Cockpit Dashboard & Spotify Infotainment Overlay */}
      <CockpitDashboardOverlay
        physics={physics}
        vehicleType={vehicleType}
        cameraView={cameraView}
        onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
      />

      {/* Floating HUD & Controls Bar */}
      <ControlsHUD
        vehicleType={vehicleType}
        cameraView={cameraView}
        trafficDensity={trafficDensity}
        weather={weather}
        timeOfDay={timeOfDay}
        autoTimeCycle={autoTimeCycle}
        nearMissScore={nearMissScore}
        onSetVehicleType={handleSetVehicleType}
        onSetCameraView={handleSetCameraView}
        onSetTrafficDensity={handleSetTrafficDensity}
        onSetWeather={handleSetWeather}
        onSetTimeOfDay={handleSetTimeOfDay}
        onSetAutoTimeCycle={handleSetAutoTimeCycle}
        onToggleHelp={() => setIsHelpModalOpen(true)}
        physics={physics}
      />

      {/* Spotify Setup & FM Radio Modal */}
      <SpotifyInfotainmentModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
      />

      {/* Help & Recommendations Modal */}
      <RecommendationsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Audio start hint if not clicked yet */}
      {!hasStartedAudio && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none bg-zinc-950/80 border border-zinc-700/80 text-zinc-300 text-xs px-4 py-1.5 rounded-full backdrop-blur-md animate-pulse shadow-xl">
          Press any key or click to start engine audio & music
        </div>
      )}
    </div>
  );
}

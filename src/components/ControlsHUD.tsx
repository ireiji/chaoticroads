/**
 * ControlsHUD - Floating Quick-Controls, Weather/Time Selectors, and Driving HUD
 */

import React, { useState } from 'react';
import {
  CameraView,
  TimeOfDay,
  TrafficDensity,
  VehiclePhysicsState,
  VehicleType,
  WeatherType,
} from '../types';
import { soundEngine } from '../audio/SoundEngine';
import {
  Car,
  Bike,
  Eye,
  Camera,
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  Cloud,
  Sunset,
  Gauge,
  Sliders,
  HelpCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Music,
} from 'lucide-react';

interface Props {
  vehicleType: VehicleType;
  cameraView: CameraView;
  trafficDensity: TrafficDensity;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  autoTimeCycle: boolean;
  nearMissScore: number;
  onSetVehicleType: (type: VehicleType) => void;
  onSetCameraView: (view: CameraView) => void;
  onSetTrafficDensity: (density: TrafficDensity) => void;
  onSetWeather: (weather: WeatherType) => void;
  onSetTimeOfDay: (time: TimeOfDay) => void;
  onSetAutoTimeCycle: (enabled: boolean) => void;
  onToggleHelp: () => void;
  onOpenSpotifyModal?: () => void;
  physics: VehiclePhysicsState;
}

export const ControlsHUD: React.FC<Props> = ({
  vehicleType,
  cameraView,
  trafficDensity,
  weather,
  timeOfDay,
  autoTimeCycle,
  nearMissScore,
  onSetVehicleType,
  onSetCameraView,
  onSetTrafficDensity,
  onSetWeather,
  onSetTimeOfDay,
  onSetAutoTimeCycle,
  onToggleHelp,
  onOpenSpotifyModal,
  physics,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const toggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsAudioMuted(muted);
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* TOP HEADER: Branding, Quick View Switchers, Time/Weather Quick Bar */}
      <div className="flex justify-between items-start w-full">
        {/* Brand & Mode */}
        <div className="flex flex-col pointer-events-auto">
          <div className="flex items-center gap-2 bg-zinc-950/85 border border-zinc-800/80 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-sm font-black tracking-wider text-white uppercase">
              CHAOTIC ROADS
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              HIGHWAY SIM
            </span>
          </div>

          {/* Near-Miss Combo Alert */}
          {nearMissScore > 0 && (
            <div className="mt-2 flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-lg backdrop-blur-md animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono tracking-wide">
                NEAR MISS x{nearMissScore}! (+{nearMissScore * 150} PTS)
              </span>
            </div>
          )}
        </div>

        {/* TOP RIGHT: Quick Toggles (Vehicle, Camera, Settings, Help) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Vehicle Switcher */}
          <div className="flex bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-1 backdrop-blur-md shadow-lg">
            <button
              onClick={() => onSetVehicleType('car')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vehicleType === 'car'
                  ? 'bg-sky-500 text-black shadow-[0_0_12px_rgba(14,165,233,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Switch to Sports Car (Press V)"
            >
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">Car</span>
            </button>
            <button
              onClick={() => onSetVehicleType('motorcycle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                vehicleType === 'motorcycle'
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Switch to Superbike Motorcycle (Press V)"
            >
              <Bike className="w-4 h-4" />
              <span className="hidden sm:inline">Moto</span>
            </button>
          </div>

          {/* Camera View Switcher */}
          <div className="flex bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-1 backdrop-blur-md shadow-lg">
            <button
              onClick={() => onSetCameraView('cockpit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cameraView === 'cockpit'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="First Person Cockpit Driver View (Press C)"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Cockpit</span>
            </button>
            <button
              onClick={() => onSetCameraView('chase')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cameraView === 'chase'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Third Person Chase Camera (Press C)"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Chase</span>
            </button>
          </div>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all ${
              showSettings
                ? 'bg-white text-black border-white'
                : 'bg-zinc-950/85 border-zinc-800/80 text-zinc-300 hover:text-white'
            }`}
            title="Highway Environment & Traffic Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Spotify & Radio Modal trigger */}
          {onOpenSpotifyModal && (
            <button
              onClick={onOpenSpotifyModal}
              className="p-2 rounded-xl bg-zinc-950/85 border border-zinc-800/80 text-emerald-400 hover:text-white hover:bg-emerald-950/50 backdrop-blur-md transition-all"
              title="Configure Spotify or Radio Stations"
            >
              <Music className="w-4 h-4" />
            </button>
          )}

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-zinc-950/85 border border-zinc-800/80 text-zinc-300 hover:text-white backdrop-blur-md transition-all"
            title={isAudioMuted ? 'Unmute Game Audio' : 'Mute Game Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Help modal */}
          <button
            onClick={onToggleHelp}
            className="p-2 rounded-xl bg-zinc-950/85 border border-zinc-800/80 text-zinc-300 hover:text-white backdrop-blur-md transition-all"
            title="Keyboard Controls & Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DROPDOWN SETTINGS DRAWER: Traffic Density, Day/Night, Weather */}
      {showSettings && (
        <div className="self-end mt-3 bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl pointer-events-auto max-w-sm w-full space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Traffic Density */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">Traffic Density</label>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                {trafficDensity}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(['off', 'light', 'moderate', 'heavy', 'chaotic'] as TrafficDensity[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onSetTrafficDensity(d)}
                  className={`py-1 rounded text-[10px] font-mono uppercase transition-colors ${
                    trafficDensity === d
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">Time of Day</label>
              <button
                onClick={() => onSetAutoTimeCycle(!autoTimeCycle)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  autoTimeCycle
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Auto-Cycle: {autoTimeCycle ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: 'dawn', label: 'Dawn', icon: Sunset },
                  { id: 'day', label: 'Noon', icon: Sun },
                  { id: 'sunset', label: 'Dusk', icon: Sunset },
                  { id: 'night', label: 'Night', icon: Moon },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSetAutoTimeCycle(false);
                      onSetTimeOfDay(t.id);
                    }}
                    className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                      timeOfDay === t.id && !autoTimeCycle
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Condition */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Weather</label>
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: 'clear', label: 'Clear', icon: Sun },
                  { id: 'rain', label: 'Rain', icon: CloudRain },
                  { id: 'foggy', label: 'Fog', icon: CloudFog },
                  { id: 'overcast', label: 'Cloudy', icon: Cloud },
                ] as const
              ).map((w) => {
                const Icon = w.icon;
                return (
                  <button
                    key={w.id}
                    onClick={() => onSetWeather(w.id)}
                    className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                      weather === w.id
                        ? 'bg-sky-500 text-black font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE / ON-SCREEN TOUCH DRIVING CONTROLS (for accessibility & touchscreens) */}
      <div className="sm:hidden flex justify-between items-end w-full pb-20 pointer-events-auto">
        {/* Left / Right Steering Pads */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }))}
            className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-700 active:bg-zinc-700 flex items-center justify-center text-xl font-bold text-white shadow-lg"
          >
            ←
          </button>
          <button
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }))}
            className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-700 active:bg-zinc-700 flex items-center justify-center text-xl font-bold text-white shadow-lg"
          >
            →
          </button>
        </div>

        {/* Brake & Gas & Boost Pads */}
        <div className="flex gap-2 items-end">
          <button
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }))}
            className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800 active:bg-red-800 flex items-center justify-center text-xs font-bold text-red-200"
          >
            BRAKE
          </button>

          <button
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }))}
            className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800 active:bg-cyan-800 flex items-center justify-center text-xs font-bold text-cyan-200"
          >
            BOOST
          </button>

          <button
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }))}
            className="w-14 h-16 rounded-2xl bg-emerald-950/90 border border-emerald-700 active:bg-emerald-700 flex items-center justify-center text-sm font-bold text-emerald-200 shadow-lg"
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};

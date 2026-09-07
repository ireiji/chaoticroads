/**
 * Realistic Functional Dashboard & Spotify Infotainment System
 * Adapts to Car Cockpit, Motorcycle Cockpit, and Chase Views
 */

import React, { useEffect, useState } from 'react';
import {
  CameraView,
  SpotifyTrack,
  VehiclePhysicsState,
  VehicleType,
} from '../types';
import { spotifyManager } from '../spotify/SpotifyManager';
import {
  Music,
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Disc,
  Volume2,
  VolumeX,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';

interface Props {
  physics: VehiclePhysicsState;
  vehicleType: VehicleType;
  cameraView: CameraView;
  onOpenSpotifyModal: () => void;
}

export const CockpitDashboardOverlay: React.FC<Props> = ({
  physics,
  vehicleType,
  cameraView,
  onOpenSpotifyModal,
}) => {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack>(
    spotifyManager.getCurrentDisplayTrack()
  );
  const [isSpotify, setIsSpotify] = useState<boolean>(spotifyManager.isConnected());
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const unsub = spotifyManager.subscribe((track, connected) => {
      setCurrentTrack(track);
      setIsSpotify(connected);
    });
    return unsub;
  }, []);

  const isCar = vehicleType === 'car';
  const isCockpit = cameraView === 'cockpit';

  // Math for Analog Needles
  // Speedometer (0 - 200 mph): range -135deg to +135deg (total 270deg)
  const maxSpeedGauge = isCar ? 180 : 220;
  const speedRatio = Math.min(1, Math.max(0, physics.speed / maxSpeedGauge));
  const speedAngle = -135 + speedRatio * 270;

  // Tachometer:
  // Car: 0 - 8000 RPM. Moto: 0 - 13000 RPM
  const maxRpmGauge = isCar ? 8000 : 13000;
  const rpmRatio = Math.min(1, Math.max(0, physics.rpm / maxRpmGauge));
  const rpmAngle = -135 + rpmRatio * 270;

  // Format progress time
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = currentTrack.durationMs > 0
    ? Math.min(100, (currentTrack.progressMs / currentTrack.durationMs) * 100)
    : 0;

  const currentStation = spotifyManager.getStation();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
      {/* TOP STATUS BAR: Turn Indicators & Warning Lights */}
      <div className="w-full flex justify-center items-center pt-3 gap-6">
        {/* Left Turn Indicator */}
        <div
          id="blinker-left"
          className={`flex items-center justify-center w-11 h-9 rounded-md border transition-all ${
            physics.leftBlinker
              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
              : 'bg-zinc-950/60 border-zinc-800 text-zinc-600'
          }`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M14 7l-5 5 5 5V7z" />
          </svg>
        </div>

        {/* Hazard / High Beam Status */}
        <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 px-4 py-1.5 rounded-full backdrop-blur-md">
          <span
            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
              physics.headlights
                ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                : 'text-zinc-500'
            }`}
          >
            BEAMS
          </span>

          <span
            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
              physics.isBoosting
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                : 'text-zinc-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> NITRO
          </span>

          <span className="text-xs font-mono text-zinc-400">
            {isCar ? 'V8 TWIN-TURBO' : '998cc SUPERBIKE'}
          </span>
        </div>

        {/* Right Turn Indicator */}
        <div
          id="blinker-right"
          className={`flex items-center justify-center w-11 h-9 rounded-md border transition-all ${
            physics.rightBlinker
              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
              : 'bg-zinc-950/60 border-zinc-800 text-zinc-600'
          }`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10 17l5-5-5-5v10z" />
          </svg>
        </div>
      </div>

      {/* BOTTOM DASHBOARD: Changes depending on view */}
      <div className="w-full flex justify-between items-end p-4 md:p-6 gap-4">
        {/* ========================================================================= */}
        {/* 1. PRIMARY INSTRUMENT CLUSTER (Left Side) */}
        {/* ========================================================================= */}
        {isCar ? (
          /* CAR CLUSTER: Dual Analog Dials + Center Digital Display */
          <div
            id="car-instrument-cluster"
            className="flex items-center gap-3 bg-zinc-950/85 border border-zinc-800/90 p-3 rounded-2xl backdrop-blur-xl shadow-2xl pointer-events-auto"
          >
            {/* TACHOMETER (RPM) */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Dial background ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="6"
                  strokeDasharray="197 264"
                  strokeLinecap="round"
                />
                {/* Active RPM sweep */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={rpmRatio > 0.85 ? '#ef4444' : '#38bdf8'}
                  strokeWidth="6"
                  strokeDasharray={`${rpmRatio * 197} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-75"
                />
              </svg>

              {/* Needle */}
              <div
                className="absolute w-1 h-16 bg-gradient-to-t from-transparent via-red-500 to-red-400 origin-bottom transition-transform duration-75 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                style={{
                  bottom: '50%',
                  transform: `rotate(${rpmAngle}deg)`,
                }}
              />
              <div className="absolute w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-600 z-10" />

              {/* Digital Readout inside Tachometer */}
              <div className="absolute flex flex-col items-center top-9">
                <span className="text-[10px] font-mono tracking-widest text-zinc-400">RPM x1000</span>
                <span className="text-sm font-bold font-mono text-zinc-200">
                  {(physics.rpm / 1000).toFixed(1)}
                </span>
                <span className="text-[9px] font-mono text-red-400 font-bold mt-1">RED 7.0</span>
              </div>
            </div>

            {/* CENTER DIGITAL INFO (Gear, Odometer, Boost Bar) */}
            <div className="flex flex-col items-center justify-center px-2 py-1 min-w-[100px] border-x border-zinc-800/80">
              <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">GEAR</span>
              <div className="text-4xl font-black font-mono text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                {physics.gear}
              </div>

              {/* Nitro Boost Bar */}
              <div className="w-20 mt-2">
                <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-0.5">
                  <span className="flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-cyan-400" /> BOOST
                  </span>
                  <span>{Math.round(physics.boostFuel)}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75"
                    style={{ width: `${physics.boostFuel}%` }}
                  />
                </div>
              </div>

              {/* Odometer */}
              <div className="mt-2 text-[10px] font-mono text-zinc-400">
                {physics.odometerMiles.toFixed(1)} <span className="text-[8px] text-zinc-500">MILES</span>
              </div>
            </div>

            {/* SPEEDOMETER (MPH) */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="6"
                  strokeDasharray="197 264"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray={`${speedRatio * 197} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-75"
                />
              </svg>

              {/* Needle */}
              <div
                className="absolute w-1 h-16 bg-gradient-to-t from-transparent via-emerald-400 to-emerald-300 origin-bottom transition-transform duration-75 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                style={{
                  bottom: '50%',
                  transform: `rotate(${speedAngle}deg)`,
                }}
              />
              <div className="absolute w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-600 z-10" />

              {/* Digital MPH Readout */}
              <div className="absolute flex flex-col items-center top-7">
                <span className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">
                  {Math.round(physics.speed)}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold">
                  MPH
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* MOTORCYCLE RACING TFT DISPLAY */
          <div
            id="moto-instrument-cluster"
            className="flex flex-col bg-zinc-950/90 border border-zinc-800/90 p-4 rounded-2xl backdrop-blur-xl shadow-2xl w-80 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-red-500 font-bold tracking-widest">
                RACE MODE // EVO-998
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                LEAN: {(physics.roll * (180 / Math.PI)).toFixed(0)}°
              </span>
            </div>

            {/* Horizontal High-RPM Bar Sweep */}
            <div className="w-full bg-zinc-900 h-4 rounded-md overflow-hidden p-0.5 border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600 transition-all duration-75 rounded"
                style={{ width: `${rpmRatio * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-0.5 px-1">
              <span>0</span>
              <span>4k</span>
              <span>8k</span>
              <span>11k</span>
              <span className="text-red-400 font-bold">13k</span>
            </div>

            {/* Speed & Gear Row */}
            <div className="flex items-baseline justify-between mt-2 px-1">
              <div>
                <span className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                  {Math.round(physics.speed)}
                </span>
                <span className="text-xs font-mono font-bold text-red-500 ml-2">MPH</span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-zinc-400">GEAR</span>
                <span className="text-3xl font-black font-mono text-amber-400">{physics.gear}</span>
              </div>
            </div>

            {/* Boost bar & stats */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1 text-cyan-400">
                <Flame className="w-3.5 h-3.5" /> NITRO {Math.round(physics.boostFuel)}%
              </span>
              <span>{physics.odometerMiles.toFixed(1)} MILES</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. IN-DASH SPOTIFY & HIGHWAY FM INFOTAINMENT SCREEN (Right Side) */}
        {/* ========================================================================= */}
        <div
          id="spotify-infotainment-screen"
          className="flex flex-col bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl max-w-sm w-full pointer-events-auto transition-all"
        >
          {/* Header with Spotify / Radio status */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isSpotify ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold font-mono tracking-wider text-zinc-200">
                {isSpotify ? 'SPOTIFY CONNECTED' : currentStation.name}
              </span>
            </div>

            <button
              onClick={onOpenSpotifyModal}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60"
            >
              <Music className="w-3 h-3" />
              {isSpotify ? 'Settings' : 'Connect Spotify'}
            </button>
          </div>

          {/* Album Art & Track Meta */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-zinc-700/80 shadow-md">
              <img
                src={currentTrack.albumArtUrl}
                alt="Album Cover"
                className="w-full h-full object-cover"
              />
              {currentTrack.isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Disc className="w-5 h-5 text-white animate-spin duration-1000 opacity-80" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate drop-shadow-sm">
                {currentTrack.name}
              </div>
              <div className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                {currentTrack.artist}
              </div>
              <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                {currentTrack.album}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full mt-2.5">
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>{formatTime(currentTrack.progressMs)}</span>
              <span>{formatTime(currentTrack.durationMs)}</span>
            </div>
          </div>

          {/* Media & Station Controls */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => spotifyManager.prevStation()}
                title="Previous Station / Track"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => spotifyManager.togglePlayPause()}
                title={currentTrack.isPlaying ? 'Pause' : 'Play'}
                className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-transform active:scale-95"
              >
                {currentTrack.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => spotifyManager.nextStation()}
                title="Next Station / Track"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Waveform graphic bars */}
            <div className="flex items-end gap-1 h-5 px-2">
              {[0.4, 0.8, 0.5, 0.9, 0.3, 0.7, 0.95, 0.4].map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full bg-emerald-400 transition-all ${
                    currentTrack.isPlaying ? 'animate-pulse' : 'opacity-30'
                  }`}
                  style={{
                    height: currentTrack.isPlaying ? `${h * 18}px` : '4px',
                    animationDelay: `${idx * 120}ms`,
                  }}
                />
              ))}
            </div>

            {/* Mute Radio */}
            <button
              onClick={() => setIsMuted(spotifyManager.toggleRadioMute())}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title={isMuted ? 'Unmute Radio' : 'Mute Radio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

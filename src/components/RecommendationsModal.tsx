/**
 * Recommendations & Controls Manual Modal
 */

import React from 'react';
import { X, Sparkles, Navigation, Disc, Zap, CloudRain, Shield } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RecommendationsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-zinc-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Chaotic Roads • Guide & Recommendations
            </h2>
            <p className="text-xs text-zinc-400">
              Pro tips for infinite highway cruising, overtaking, and audio immersion
            </p>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="mb-6 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
            Keyboard Controls
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-cyan-400 font-bold">W / ↑</span>
              <div className="text-zinc-400 text-[11px]">Accelerate / Throttle</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-cyan-400 font-bold">S / ↓</span>
              <div className="text-zinc-400 text-[11px]">Brake / Reverse</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-cyan-400 font-bold">A / D</span>
              <div className="text-zinc-400 text-[11px]">Steer Left / Right</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-red-400 font-bold">SPACE</span>
              <div className="text-zinc-400 text-[11px]">Heavy Handbrake</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-amber-400 font-bold">SHIFT</span>
              <div className="text-zinc-400 text-[11px]">Nitro Boost (Turbos)</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-emerald-400 font-bold">← / →</span>
              <div className="text-zinc-400 text-[11px]">Turn Blinkers</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-purple-400 font-bold">C</span>
              <div className="text-zinc-400 text-[11px]">Toggle Cockpit / Chase</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-purple-400 font-bold">V</span>
              <div className="text-zinc-400 text-[11px]">Switch Car / Motorcycle</div>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              <span className="font-mono text-sky-400 font-bold">L / H</span>
              <div className="text-zinc-400 text-[11px]">Headlights / Horn</div>
            </div>
          </div>
        </div>

        {/* Feature Recommendations */}
        <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
          <div className="flex gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
            <Navigation className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white mb-0.5">Highway Lane Hierarchy & AI Behavior</div>
              <p className="text-zinc-400">
                Slow semi-trucks and tankers stick to the far right lanes (Lanes 0 & 1). When they encounter blockages, AI cars will check their blind spots, signal their blinkers, and overtake into the left passing lanes.
              </p>
            </div>
          </div>

          <div className="flex gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white mb-0.5">Vehicle Performance Dynamics</div>
              <p className="text-zinc-400">
                The Sports Car offers supreme aerodynamic downforce and rain wipers on the windshield. The Superbike reaches up to 230+ mph with responsive banking physics into corners.
              </p>
            </div>
          </div>

          <div className="flex gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
            <Disc className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white mb-0.5">Spotify & In-Car Highway FM Radio</div>
              <p className="text-zinc-400">
                Authorize with Spotify using the in-dash screen or enjoy built-in Highway FM channels with real-time spectrum waveform equalizers and curated synthwave/lo-fi tracks.
              </p>
            </div>
          </div>

          <div className="flex gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
            <CloudRain className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white mb-0.5">Dynamic Weather & Road Reflections</div>
              <p className="text-zinc-400">
                Rain increases road specular reflections and starts the windshield wipers in car driver view. In heavy fog or midnight darkness, ensure headlights are switched on to illuminate traffic ahead.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-6 py-2.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            Start Driving
          </button>
        </div>
      </div>
    </div>
  );
};

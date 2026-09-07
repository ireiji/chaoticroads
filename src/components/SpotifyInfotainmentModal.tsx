/**
 * Spotify Infotainment Configuration Modal
 * Client ID: bd40a9a55b0848b0a3ef342305042b91
 * Redirect URI: https://ireiji.github.io/chaoticroads
 */

import React, { useState } from 'react';
import { HIGHWAY_STATIONS, SPOTIFY_CONFIG, spotifyManager } from '../spotify/SpotifyManager';
import { X, Music, Radio, ExternalLink, Check, Copy, Key } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotifyInfotainmentModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [copied, setCopied] = useState(false);
  const isConnected = spotifyManager.isConnected();
  const currentStation = spotifyManager.getStation();

  if (!isOpen) return null;

  const handleOpenAuth = () => {
    const authUrl = spotifyManager.getAuthUrl();
    window.open(authUrl, '_blank', 'width=550,height=750');
  };

  const handleApplyToken = () => {
    if (tokenInput.trim()) {
      spotifyManager.setAccessToken(tokenInput.trim());
      setTokenInput('');
    }
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(SPOTIFY_CONFIG.redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-zinc-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              In-Car Spotify & Highway Radio
            </h2>
            <p className="text-xs text-zinc-400">
              Synchronize live music directly into your vehicle cockpit
            </p>
          </div>
        </div>

        {/* Section 1: Spotify OAuth Connection */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]' : 'bg-zinc-600'
                }`}
              />
              <span className="text-sm font-semibold text-white">
                Spotify Web API Integration
              </span>
            </div>
            {isConnected && (
              <button
                onClick={() => spotifyManager.disconnectSpotify()}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>

          <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
            Connected via Spotify OAuth using your configured Client ID & Redirect URI. Live tracks and artwork will project on the in-dash screen in real time.
          </p>

          <div className="flex flex-col gap-2 mb-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 text-[11px] font-mono text-zinc-400">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">CLIENT ID:</span>
              <span className="text-zinc-300 font-semibold">{SPOTIFY_CONFIG.clientId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">REDIRECT URI:</span>
              <button
                onClick={handleCopyUri}
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                {SPOTIFY_CONFIG.redirectUri}
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOpenAuth}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-98"
            >
              <ExternalLink className="w-4 h-4" />
              Authorize with Spotify
            </button>
          </div>

          {/* Manual Token Paste */}
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <label className="text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1">
              <Key className="w-3 h-3 text-zinc-500" />
              Or paste Spotify Access Token directly:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="BQB... (Spotify bearer token)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleApplyToken}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Built-in Highway FM Radio Stations */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              Highway FM Radio Presets
            </span>
            <span className="text-[10px] font-mono text-zinc-500">ACTIVE: {currentStation.frequency}</span>
          </div>

          <div className="space-y-2 mt-3">
            {HIGHWAY_STATIONS.map((station, idx) => (
              <div
                key={station.id}
                onClick={() => {
                  if (idx !== HIGHWAY_STATIONS.indexOf(currentStation)) {
                    spotifyManager.nextStation();
                  }
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  station.id === currentStation.id
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-zinc-200">{station.name}</div>
                  <div className="text-[10px] text-zinc-400">{station.genre}</div>
                </div>
                <div className="text-xs font-mono font-semibold text-amber-400">
                  {station.frequency}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white transition-colors underline"
          >
            Return to Highway
          </button>
        </div>
      </div>
    </div>
  );
};

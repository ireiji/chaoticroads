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
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isConnected = spotifyManager.isConnected();
  const currentStation = spotifyManager.getStation();

  if (!isOpen) return null;

  const handleOpenAuth = async () => {
    try {
      setIsProcessing(true);
      setStatusMessage({ text: 'Opening Spotify authorization window...', type: 'info' });
      const authUrl = await spotifyManager.getAuthUrl();
      window.open(authUrl, '_blank', 'width=550,height=750');
      setStatusMessage({
        text: 'Spotify window opened. After approving, Spotify will redirect to your Redirect URI with "?code=...". Paste that URL or code below, or paste your Bearer token directly!',
        type: 'info',
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate Spotify authorization URL';
      setStatusMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyTokenOrCode = async () => {
    const input = tokenInput.trim();
    if (!input) return;

    setIsProcessing(true);
    setStatusMessage(null);

    // Check if input is a redirected URL with ?code= or contains code parameter
    let extractedCode: string | null = null;
    if (input.includes('code=')) {
      try {
        const urlPart = input.includes('?') ? input.split('?')[1] : input;
        const searchParams = new URLSearchParams(urlPart);
        extractedCode = searchParams.get('code');
      } catch {
        extractedCode = null;
      }
    } else if (input.length > 20 && !input.startsWith('BQ') && !input.includes(' ')) {
      // Possible raw code string
      extractedCode = input;
    }

    if (extractedCode) {
      setStatusMessage({ text: 'Exchanging authorization code with Spotify...', type: 'info' });
      const result = await spotifyManager.exchangeCodeForToken(extractedCode);
      if (result.success) {
        setStatusMessage({ text: 'Successfully connected to Spotify!', type: 'success' });
        setTokenInput('');
      } else {
        setStatusMessage({
          text: `Code exchange failed: ${result.error}. Try pasting your Spotify Bearer token directly.`,
          type: 'error',
        });
      }
    } else {
      // Treat as direct Spotify access/bearer token
      spotifyManager.setAccessToken(input);
      setStatusMessage({ text: 'Token applied! Checking Spotify connection...', type: 'success' });
      setTokenInput('');
    }
    setIsProcessing(false);
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
              disabled={isProcessing}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-98"
            >
              <ExternalLink className="w-4 h-4" />
              {isProcessing ? 'Connecting...' : 'Authorize with Spotify (PKCE)'}
            </button>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`mt-3 p-2.5 rounded-lg text-xs leading-relaxed border ${
                statusMessage.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Manual Token or Redirect URL Paste */}
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <label className="text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center gap-1">
              <Key className="w-3 h-3 text-zinc-500" />
              Paste Redirected Spotify URL, Code, or Bearer Token:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://ireiji.github.io/chaoticroads?code=... OR BQB..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyTokenOrCode();
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleApplyTokenOrCode}
                disabled={isProcessing}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Connect
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              Supports both authorization code PKCE exchange and direct Spotify Web API bearer tokens.
            </p>
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

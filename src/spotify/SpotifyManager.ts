/**
 * Spotify Web API & Highway FM Radio Manager
 * Client ID: bd40a9a55b0848b0a3ef342305042b91
 * Redirect URI: https://ireiji.github.io/chaoticroads
 */

import { SpotifyTrack } from '../types';

export const SPOTIFY_CONFIG = {
  clientId: 'bd40a9a55b0848b0a3ef342305042b91',
  redirectUri: 'https://ireiji.github.io/chaoticroads',
  scopes: ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state'],
};

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  frequency: string;
  tracks: Array<{
    title: string;
    artist: string;
    album: string;
    durationSec: number;
    albumArt: string;
    tempo: number; // BPM for procedural synth generator
    key: string;
  }>;
}

export const HIGHWAY_STATIONS: RadioStation[] = [
  {
    id: 'synthwave',
    name: 'NEON HORIZON FM',
    genre: 'Synthwave / Retrowave',
    frequency: '98.4 FM',
    tracks: [
      {
        title: 'Nightcall Overdrive',
        artist: 'Kavinsky Highway',
        album: 'Endless Asphalt',
        durationSec: 218,
        albumArt: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&q=80',
        tempo: 116,
        key: 'Am',
      },
      {
        title: 'Sunset Cruiser 1986',
        artist: 'The Midnight Drive',
        album: 'Days of Thunder',
        durationSec: 254,
        albumArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
        tempo: 120,
        key: 'Dm',
      },
      {
        title: 'Cyberpunk Freeway',
        artist: 'Lazerhawk Velocity',
        album: 'Redline Neon',
        durationSec: 195,
        albumArt: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=300&q=80',
        tempo: 128,
        key: 'Em',
      },
    ],
  },
  {
    id: 'lofi',
    name: 'MIDNIGHT TOKYO CHILL',
    genre: 'Lo-Fi / Chillhop',
    frequency: '104.2 FM',
    tracks: [
      {
        title: 'Rain on the Windshield',
        artist: 'Shibuya Beats',
        album: 'Late Night Route 246',
        durationSec: 165,
        albumArt: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80',
        tempo: 82,
        key: 'F#m',
      },
      {
        title: 'Coffee at 3 AM',
        artist: 'Lofi Express',
        album: 'Highway Rest Stop',
        durationSec: 180,
        albumArt: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80',
        tempo: 78,
        key: 'Cmaj7',
      },
      {
        title: 'Distant City Lights',
        artist: 'Komorebi Sky',
        album: 'Tollgate Melodies',
        durationSec: 210,
        albumArt: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80',
        tempo: 85,
        key: 'Bb',
      },
    ],
  },
  {
    id: 'eurobeat',
    name: 'INITIAL BOOST EUROBEAT',
    genre: 'High-RPM Eurobeat',
    frequency: '107.9 FM',
    tracks: [
      {
        title: 'Speedy Speed Boy (Chaotic Mix)',
        artist: 'Dave Rodgers & SuperEuro',
        album: 'Highway Touge Vol. 4',
        durationSec: 240,
        albumArt: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300&q=80',
        tempo: 154,
        key: 'Fm',
      },
      {
        title: 'Deja Vu Midnight Rush',
        artist: 'Fastway Apex',
        album: 'Running in the 90s',
        durationSec: 232,
        albumArt: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&q=80',
        tempo: 158,
        key: 'Gm',
      },
    ],
  },
];

export class SpotifyManager {
  private accessToken: string | null = null;
  private isSpotifyConnected: boolean = false;
  private currentTrack: SpotifyTrack | null = null;
  private pollingInterval: number | null = null;

  // Radio fallback
  private currentStationIndex: number = 0;
  private currentTrackIndex: number = 0;
  private radioProgressMs: number = 0;
  private isRadioPlaying: boolean = true;
  private radioTimer: number | null = null;

  // Procedural background radio audio synth (soft soothing music)
  private radioAudioCtx: AudioContext | null = null;
  private radioGain: GainNode | null = null;
  private radioInterval: number | null = null;
  private isRadioMuted: boolean = false;

  private listeners: Array<(track: SpotifyTrack, isSpotify: boolean) => void> = [];

  constructor() {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('chaotic_roads_spotify_token');
    if (savedToken) {
      this.accessToken = savedToken;
      this.isSpotifyConnected = true;
    }

    // Check if redirected with authorization code in query params: ?code=...
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      this.exchangeCodeForToken(code).then(() => {
        window.history.replaceState(null, '', window.location.pathname);
      });
    }

    // Check if redirected with hash #access_token=... (implicit fallback)
    if (window.location.hash.includes('access_token')) {
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const token = hashParams.get('access_token');
      if (token) {
        this.setAccessToken(token);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    this.startRadioCycle();
    if (this.isSpotifyConnected) {
      this.startSpotifyPolling();
    }
  }

  /**
   * Generates PKCE code verifier (64 characters random string)
   */
  private generateCodeVerifier(length: number = 64): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }

  /**
   * Generates SHA-256 PKCE code challenge from verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Returns Spotify PKCE OAuth Authorization URL
   */
  public async getAuthUrl(): Promise<string> {
    const verifier = this.generateCodeVerifier();
    localStorage.setItem('chaotic_roads_spotify_verifier', verifier);
    const challenge = await this.generateCodeChallenge(verifier);

    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.clientId,
      response_type: 'code',
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      scope: SPOTIFY_CONFIG.scopes.join(' '),
      code_challenge_method: 'S256',
      code_challenge: challenge,
      show_dialog: 'true',
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for a Spotify Bearer Access Token
   */
  public async exchangeCodeForToken(code: string): Promise<{ success: boolean; error?: string }> {
    const verifier = localStorage.getItem('chaotic_roads_spotify_verifier') || '';
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CONFIG.clientId,
          grant_type: 'authorization_code',
          code: code.trim(),
          redirect_uri: SPOTIFY_CONFIG.redirectUri,
          code_verifier: verifier,
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        this.setAccessToken(data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('chaotic_roads_spotify_refresh', data.refresh_token);
        }
        return { success: true };
      } else {
        const errorMsg = data.error_description || data.error || 'Failed to exchange authorization code';
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error exchanging Spotify code';
      return { success: false, error: errorMsg };
    }
  }

  public setAccessToken(token: string) {
    this.accessToken = token.trim();
    this.isSpotifyConnected = !!this.accessToken;
    if (this.accessToken) {
      localStorage.setItem('chaotic_roads_spotify_token', this.accessToken);
      this.startSpotifyPolling();
    } else {
      localStorage.removeItem('chaotic_roads_spotify_token');
      this.stopSpotifyPolling();
    }
    this.emitChange();
  }

  public disconnectSpotify() {
    this.accessToken = null;
    this.isSpotifyConnected = false;
    localStorage.removeItem('chaotic_roads_spotify_token');
    this.stopSpotifyPolling();
    this.emitChange();
  }

  public isConnected(): boolean {
    return this.isSpotifyConnected;
  }

  public getStation(): RadioStation {
    return HIGHWAY_STATIONS[this.currentStationIndex];
  }

  public nextStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % HIGHWAY_STATIONS.length;
    this.currentTrackIndex = 0;
    this.radioProgressMs = 0;
    this.emitChange();
  }

  public prevStation() {
    this.currentStationIndex = (this.currentStationIndex - 1 + HIGHWAY_STATIONS.length) % HIGHWAY_STATIONS.length;
    this.currentTrackIndex = 0;
    this.radioProgressMs = 0;
    this.emitChange();
  }

  public togglePlayPause() {
    if (this.isSpotifyConnected) {
      // Toggle via Spotify API if permitted
      this.toggleSpotifyPlayback();
    } else {
      this.isRadioPlaying = !this.isRadioPlaying;
      if (this.radioGain && this.radioAudioCtx) {
        this.radioGain.gain.setValueAtTime(this.isRadioPlaying && !this.isRadioMuted ? 0.2 : 0, this.radioAudioCtx.currentTime);
      }
      this.emitChange();
    }
  }

  public toggleRadioMute(): boolean {
    this.isRadioMuted = !this.isRadioMuted;
    if (this.radioGain && this.radioAudioCtx) {
      this.radioGain.gain.setValueAtTime(this.isRadioPlaying && !this.isRadioMuted ? 0.2 : 0, this.radioAudioCtx.currentTime);
    }
    return this.isRadioMuted;
  }

  private async toggleSpotifyPlayback() {
    if (!this.accessToken) return;
    try {
      const endpoint = this.currentTrack?.isPlaying
        ? 'https://api.spotify.com/v1/me/player/pause'
        : 'https://api.spotify.com/v1/me/player/play';
      await fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      this.pollSpotifyCurrentTrack();
    } catch {
      // Ignore error
    }
  }

  private startSpotifyPolling() {
    this.stopSpotifyPolling();
    this.pollSpotifyCurrentTrack();
    this.pollingInterval = window.setInterval(() => {
      this.pollSpotifyCurrentTrack();
    }, 2800);
  }

  private stopSpotifyPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async pollSpotifyCurrentTrack() {
    if (!this.accessToken) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (res.status === 204 || res.status === 404) {
        // Nothing currently playing on Spotify, show paused or last track
        return;
      }

      if (res.status === 401) {
        // Token expired
        console.warn('Spotify token expired');
        this.disconnectSpotify();
        return;
      }

      if (!res.ok) return;

      const data = await res.json();
      if (data && data.item) {
        const item = data.item;
        this.currentTrack = {
          id: item.id,
          name: item.name,
          artist: item.artists.map((a: { name: string }) => a.name).join(', '),
          album: item.album.name,
          albumArtUrl: item.album.images?.[0]?.url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
          durationMs: item.duration_ms,
          progressMs: data.progress_ms || 0,
          isPlaying: data.is_playing,
          externalUrl: item.external_urls?.spotify,
          isRadioTrack: false,
        };
        this.emitChange();
      }
    } catch (e) {
      console.warn('Failed to poll Spotify track:', e);
    }
  }

  private startRadioCycle() {
    if (this.radioTimer) clearInterval(this.radioTimer);

    this.radioTimer = window.setInterval(() => {
      if (!this.isSpotifyConnected && this.isRadioPlaying) {
        const station = HIGHWAY_STATIONS[this.currentStationIndex];
        const track = station.tracks[this.currentTrackIndex];
        this.radioProgressMs += 1000;

        if (this.radioProgressMs >= track.durationSec * 1000) {
          this.radioProgressMs = 0;
          this.currentTrackIndex = (this.currentTrackIndex + 1) % station.tracks.length;
        }
        this.emitChange();
      }
    }, 1000);
  }

  public initRadioSynth() {
    if (this.radioAudioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.radioAudioCtx = new AudioContextClass();
      this.radioGain = this.radioAudioCtx.createGain();
      this.radioGain.gain.value = 0.15;
      this.radioGain.connect(this.radioAudioCtx.destination);

      // Start a gentle synth chord progression for chill in-car vibes
      const notes = [
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [196, 246.94, 293.66], // G
        [164.81, 207.65, 246.94], // E
      ];
      let chordIdx = 0;

      this.radioInterval = window.setInterval(() => {
        if (!this.radioAudioCtx || !this.isRadioPlaying || this.isSpotifyConnected || this.isRadioMuted) return;
        if (this.radioAudioCtx.state === 'suspended') return;

        const chord = notes[chordIdx % notes.length];
        chordIdx++;
        const now = this.radioAudioCtx.currentTime;

        chord.forEach((freq) => {
          if (!this.radioAudioCtx) return;
          const osc = this.radioAudioCtx.createOscillator();
          const gain = this.radioAudioCtx.createGain();
          const filter = this.radioAudioCtx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.radioGain!);

          osc.start(now);
          osc.stop(now + 3.0);
        });
      }, 3000);
    } catch {
      // Audio context might fail before user gesture
    }
  }

  public getCurrentDisplayTrack(): SpotifyTrack {
    if (this.isSpotifyConnected && this.currentTrack) {
      return this.currentTrack;
    }

    const station = HIGHWAY_STATIONS[this.currentStationIndex];
    const track = station.tracks[this.currentTrackIndex];

    return {
      id: `radio-${station.id}-${this.currentTrackIndex}`,
      name: track.title,
      artist: track.artist,
      album: `${station.name} • ${station.frequency}`,
      albumArtUrl: track.albumArt,
      durationMs: track.durationSec * 1000,
      progressMs: this.radioProgressMs,
      isPlaying: this.isRadioPlaying,
      isRadioTrack: true,
    };
  }

  public subscribe(listener: (track: SpotifyTrack, isSpotify: boolean) => void) {
    this.listeners.push(listener);
    listener(this.getCurrentDisplayTrack(), this.isSpotifyConnected);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emitChange() {
    const track = this.getCurrentDisplayTrack();
    this.listeners.forEach((l) => l(track, this.isSpotifyConnected));
  }
}

export const spotifyManager = new SpotifyManager();

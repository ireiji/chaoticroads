/**
 * Realistic Sound Engine powered by Web Audio API
 * No external file downloads needed - synthesizes instant low-latency automotive sounds
 */

import { VehicleType } from '../types';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine audio nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Wind audio nodes
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Tire screech nodes
  private screechNode: AudioBufferSourceNode | null = null;
  private screechGain: GainNode | null = null;

  // Turbo boost nodes
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;

  // Rain nodes
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;

  // Blinker
  private lastBlinkerState: boolean = false;

  private isStarted: boolean = false;
  private vehicleType: VehicleType = 'car';

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.setupWindSynth();
      this.setupScreechSynth();
      this.setupBoostSynth();
      this.setupRainSynth();

      this.isStarted = true;
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  public setVehicleType(type: VehicleType) {
    this.vehicleType = type;
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2) return;

    if (type === 'motorcycle') {
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'square';
    } else {
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Primary cylinders oscillator
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.value = 65;

    // Secondary harmonic oscillator
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.value = 130;

    // Deep sub-bass exhaust pulse
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.value = 32;

    // Lowpass filter controlled by throttle / intake
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 450;
    this.engineFilter.Q.value = 3.5;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.28;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);

    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSubOsc.start();
  }

  private createNoiseBuffer(seconds: number = 2): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private setupWindSynth() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(2);
    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = noiseBuffer;
    this.windNode.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 300;
    this.windFilter.Q.value = 1.2;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.0;

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.windNode.start();
  }

  private setupScreechSynth() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(1);
    this.screechNode = this.ctx.createBufferSource();
    this.screechNode.buffer = noiseBuffer;
    this.screechNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1400;

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.value = 0.0;

    this.screechNode.connect(filter);
    filter.connect(this.screechGain);
    this.screechGain.connect(this.masterGain);

    this.screechNode.start();
  }

  private setupBoostSynth() {
    if (!this.ctx || !this.masterGain) return;

    this.boostOsc = this.ctx.createOscillator();
    this.boostOsc.type = 'sawtooth';
    this.boostOsc.frequency.value = 1800;

    const boostFilter = this.ctx.createBiquadFilter();
    boostFilter.type = 'bandpass';
    boostFilter.frequency.value = 2400;
    boostFilter.Q.value = 4.0;

    this.boostGain = this.ctx.createGain();
    this.boostGain.gain.value = 0.0;

    this.boostOsc.connect(boostFilter);
    boostFilter.connect(this.boostGain);
    this.boostGain.connect(this.masterGain);

    this.boostOsc.start();
  }

  private setupRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(3);
    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = noiseBuffer;
    this.rainNode.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1200;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;

    this.rainNode.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainNode.start();
  }

  public update(
    speedMph: number,
    rpm: number,
    throttle: number,
    isBraking: boolean,
    isBoosting: boolean,
    isDrifting: boolean,
    isRaining: boolean
  ) {
    if (!this.ctx || !this.isStarted || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Engine RPM modulation
    if (this.engineOsc1 && this.engineOsc2 && this.engineSubOsc && this.engineFilter && this.engineGain) {
      const isMoto = this.vehicleType === 'motorcycle';
      const baseFreq = isMoto ? 45 + (rpm / 13000) * 220 : 35 + (rpm / 8000) * 160;

      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * (isMoto ? 2.5 : 2.0), now, 0.04);
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

      // Throttle opens intake filter for aggressive throatiness
      const cutoffFreq = isMoto
        ? 600 + throttle * 4200 + (rpm / 13000) * 2500
        : 400 + throttle * 2800 + (rpm / 8000) * 2000;
      this.engineFilter.frequency.setTargetAtTime(cutoffFreq, now, 0.05);

      const targetGain = 0.18 + throttle * 0.22 + (rpm / (isMoto ? 13000 : 8000)) * 0.15;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
    }

    // 2. Wind noise (scales non-linearly with speed)
    if (this.windGain && this.windFilter) {
      const speedNorm = Math.min(1, Math.max(0, speedMph / 140));
      const windVol = Math.pow(speedNorm, 1.8) * 0.45;
      this.windGain.gain.setTargetAtTime(windVol, now, 0.1);
      this.windFilter.frequency.setTargetAtTime(200 + speedNorm * 1100, now, 0.1);
    }

    // 3. Tire screech
    if (this.screechGain) {
      const shouldScreech = (isBraking && speedMph > 25) || (isDrifting && speedMph > 35);
      const targetScreech = shouldScreech ? 0.35 : 0.0;
      this.screechGain.gain.setTargetAtTime(targetScreech, now, 0.06);
    }

    // 4. Nitro Boost whine / jet intake
    if (this.boostGain && this.boostOsc) {
      const targetBoost = isBoosting ? 0.38 : 0.0;
      this.boostGain.gain.setTargetAtTime(targetBoost, now, 0.08);
      if (isBoosting) {
        this.boostOsc.frequency.setTargetAtTime(2200 + Math.sin(now * 15) * 180, now, 0.05);
      }
    }

    // 5. Rain ambient
    if (this.rainGain) {
      const targetRain = isRaining ? 0.25 : 0.0;
      this.rainGain.gain.setTargetAtTime(targetRain, now, 0.5);
    }
  }

  // Blinker click relay sound
  public playBlinkerClick(isOn: boolean) {
    if (!this.ctx || this.isMuted) return;
    if (isOn === this.lastBlinkerState) return;
    this.lastBlinkerState = isOn;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.value = isOn ? 1400 : 950;

    filter.type = 'highpass';
    filter.frequency.value = 700;

    gain.gain.value = 0.12;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  // Turbo blow-off valve pop / hiss
  public playBlowOffValve() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(0.3);
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.28);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    src.start();
    src.stop(now + 0.3);
  }

  // Automotive dual-tone horn
  public startHorn() {
    if (!this.ctx || this.isMuted) return;
    // We can handle continuous horn or short burst
    this.playHornBurst(0.25);
  }

  public playHornBurst(duration: number = 0.35) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const oscLow = this.ctx.createOscillator();
    const oscHigh = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscLow.type = 'sawtooth';
    oscHigh.type = 'sawtooth';

    // Standard automotive dual horn frequencies
    oscLow.frequency.value = 380;
    oscHigh.frequency.value = 460;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.35, now + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscLow.connect(filter);
    oscHigh.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    oscLow.start();
    oscHigh.start();
    oscLow.stop(now + duration);
    oscHigh.stop(now + duration);
  }

  // Near miss chime
  public playNearMissChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start();
    osc.stop(now + 0.25);
  }

  // Crash / impact metallic thud
  public playCrashThud() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start();
    osc.stop(now + 0.35);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();

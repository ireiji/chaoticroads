/**
 * CockpitScreens.ts
 * Generates and updates dynamic CanvasTextures for in-cockpit 3D displays:
 * 1. Instrument Gauge Cluster (behind the steering wheel)
 * 2. Infotainment Touchscreen Display (to the right on center console)
 */

import * as THREE from 'three';
import { VehiclePhysicsState, SpotifyTrack } from '../types';
import { spotifyManager } from '../spotify/SpotifyManager';

export class CockpitScreens {
  // --- GAUGE CLUSTER SCREEN ---
  public gaugeCanvas: HTMLCanvasElement;
  public gaugeCtx: CanvasRenderingContext2D;
  public gaugeTexture: THREE.CanvasTexture;
  public gaugeMaterial: THREE.MeshBasicMaterial;

  // --- INFOTAINMENT DISPLAY ---
  public infotainmentCanvas: HTMLCanvasElement;
  public infotainmentCtx: CanvasRenderingContext2D;
  public infotainmentTexture: THREE.CanvasTexture;
  public infotainmentMaterial: THREE.MeshBasicMaterial;

  // Visualizer anim timer
  private visualizerTimer: number = 0;
  private visualizerBars: number[] = new Array(24).fill(0);

  constructor() {
    // 1. Gauge Cluster Canvas (1024 x 512)
    this.gaugeCanvas = document.createElement('canvas');
    this.gaugeCanvas.width = 1024;
    this.gaugeCanvas.height = 512;
    this.gaugeCtx = this.gaugeCanvas.getContext('2d')!;

    this.gaugeTexture = new THREE.CanvasTexture(this.gaugeCanvas);
    this.gaugeTexture.minFilter = THREE.LinearFilter;
    this.gaugeTexture.magFilter = THREE.LinearFilter;
    this.gaugeMaterial = new THREE.MeshBasicMaterial({
      map: this.gaugeTexture,
      toneMapped: false,
    });

    // 2. Infotainment Canvas (1024 x 600)
    this.infotainmentCanvas = document.createElement('canvas');
    this.infotainmentCanvas.width = 1024;
    this.infotainmentCanvas.height = 600;
    this.infotainmentCtx = this.infotainmentCanvas.getContext('2d')!;

    this.infotainmentTexture = new THREE.CanvasTexture(this.infotainmentCanvas);
    this.infotainmentTexture.minFilter = THREE.LinearFilter;
    this.infotainmentTexture.magFilter = THREE.LinearFilter;
    this.infotainmentMaterial = new THREE.MeshBasicMaterial({
      map: this.infotainmentTexture,
      toneMapped: false,
    });

    // Initial render
    this.renderGaugeCluster({
      speed: 0,
      rpm: 900,
      gear: 1,
      steerAngle: 0,
      throttle: 0,
      brake: 0,
      isBoosting: false,
      boostFuel: 100,
      leftBlinker: false,
      rightBlinker: false,
      headlights: false,
      odometerMiles: 0,
      highwayDistance: 0,
      laneOffset: 0,
      roll: 0,
      pitch: 0,
      yaw: 0,
      yawRate: 0,
      lateralVelocity: 0,
      steeringWheelAngle: 0,
      isDrifting: false,
      worldX: 0,
      worldY: 0,
      worldZ: 0,
    }, false, 'car');

    this.renderInfotainment(0.016, 0);
  }

  /**
   * Update and render the Digital Gauge Cluster behind the steering wheel
   */
  public renderGaugeCluster(
    physics: VehiclePhysicsState,
    blinkerState: boolean,
    vehicleType: 'car' | 'motorcycle'
  ) {
    const ctx = this.gaugeCtx;
    const w = this.gaugeCanvas.width;
    const h = this.gaugeCanvas.height;

    // Dark high-contrast sports cluster background
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, w, h);

    // Subtle metallic carbon / bezel border
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(12, 12, w - 24, h - 24);

    // Header bar (Time, Drive Mode, Indicators)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 20, w - 40, 48);

    // Drive Mode Pill
    ctx.fillStyle = physics.isBoosting ? '#ef4444' : '#0284c7';
    ctx.beginPath();
    ctx.roundRect(36, 28, 120, 32, 6);
    ctx.fill();
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(physics.isBoosting ? '⚡ NITRO' : 'SPORT MODE', 96, 50);

    // Left Blinker Arrow
    const isBlinkL = physics.leftBlinker && blinkerState;
    ctx.fillStyle = isBlinkL ? '#22c55e' : '#334155';
    ctx.beginPath();
    ctx.moveTo(340, 44);
    ctx.lineTo(365, 30);
    ctx.lineTo(365, 38);
    ctx.lineTo(385, 38);
    ctx.lineTo(385, 50);
    ctx.lineTo(365, 50);
    ctx.lineTo(365, 58);
    ctx.closePath();
    ctx.fill();

    // High Beams / Headlights Icon
    ctx.fillStyle = physics.headlights ? '#38bdf8' : '#334155';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💡 HEADLIGHTS', 512, 51);

    // Right Blinker Arrow
    const isBlinkR = physics.rightBlinker && blinkerState;
    ctx.fillStyle = isBlinkR ? '#22c55e' : '#334155';
    ctx.beginPath();
    ctx.moveTo(684, 44);
    ctx.lineTo(659, 30);
    ctx.lineTo(659, 38);
    ctx.lineTo(639, 38);
    ctx.lineTo(639, 50);
    ctx.lineTo(659, 50);
    ctx.lineTo(659, 58);
    ctx.closePath();
    ctx.fill();

    // Status message on right of header
    ctx.font = '14px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(vehicleType === 'car' ? 'HIGHWAY V8 TURBO' : '1000CC SUPERBIKE', w - 40, 50);

    // --- MAIN SPEEDOMETER (CENTER) ---
    const speed = Math.round(physics.speed);
    ctx.textAlign = 'center';

    // Speed display arc
    const centerX = w / 2;
    const centerY = 270;
    const radius = 160;

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Active speed arc
    const maxSpeed = vehicleType === 'car' ? 200 : 240;
    const speedAngle = Math.PI * 0.75 + (Math.min(speed, maxSpeed) / maxSpeed) * (Math.PI * 1.5);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI * 0.75, speedAngle);
    ctx.lineWidth = 14;
    const speedGrad = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    speedGrad.addColorStop(0, '#38bdf8');
    speedGrad.addColorStop(0.7, '#3b82f6');
    speedGrad.addColorStop(1, '#ef4444');
    ctx.strokeStyle = speedGrad;
    ctx.stroke();

    // Center Speed Digits
    ctx.font = 'bold 96px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(speed.toString(), centerX, centerY + 30);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('MPH', centerX, centerY + 65);

    // Current Gear Box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(centerX - 40, centerY + 80, 80, 50, 8);
    ctx.fill();
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(physics.gear.toString(), centerX, centerY + 118);

    // --- LEFT DIAL: TACHOMETER (RPM) ---
    const leftDialX = 220;
    const leftDialY = 300;
    const dialR = 125;

    // RPM dial background arc
    ctx.beginPath();
    ctx.arc(leftDialX, leftDialY, dialR, Math.PI * 0.75, Math.PI * 2.25);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Active RPM arc
    const maxRpm = vehicleType === 'car' ? 8000 : 13000;
    const rpmFraction = Math.min(1, Math.max(0, physics.rpm / maxRpm));
    const rpmAngle = Math.PI * 0.75 + rpmFraction * (Math.PI * 1.5);

    ctx.beginPath();
    ctx.arc(leftDialX, leftDialY, dialR, Math.PI * 0.75, rpmAngle);
    ctx.lineWidth = 10;
    const rpmGrad = ctx.createLinearGradient(leftDialX - dialR, leftDialY, leftDialX + dialR, leftDialY);
    rpmGrad.addColorStop(0, '#22c55e');
    rpmGrad.addColorStop(0.75, '#eab308');
    rpmGrad.addColorStop(0.9, '#ef4444');
    ctx.strokeStyle = rpmGrad;
    ctx.stroke();

    // RPM readout
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(Math.round(physics.rpm).toString(), leftDialX, leftDialY + 12);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('RPM x1000', leftDialX, leftDialY + 36);

    // --- RIGHT DIAL: BOOST & TELEMETRY ---
    const rightDialX = w - 220;
    const rightDialY = 300;

    // Boost fuel arc
    ctx.beginPath();
    ctx.arc(rightDialX, rightDialY, dialR, Math.PI * 0.75, Math.PI * 2.25);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    const boostFraction = Math.min(1, Math.max(0, physics.boostFuel / 100));
    const boostAngle = Math.PI * 0.75 + boostFraction * (Math.PI * 1.5);

    ctx.beginPath();
    ctx.arc(rightDialX, rightDialY, dialR, Math.PI * 0.75, boostAngle);
    ctx.lineWidth = 10;
    ctx.strokeStyle = physics.isBoosting ? '#38bdf8' : '#0284c7';
    ctx.stroke();

    // Boost text
    ctx.font = 'bold 38px sans-serif';
    ctx.fillStyle = physics.isBoosting ? '#38bdf8' : '#ffffff';
    ctx.fillText(`${Math.round(physics.boostFuel)}%`, rightDialX, rightDialY + 10);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('NITRO BOOST', rightDialX, rightDialY + 34);

    // Bottom telemetry footer
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, h - 55, w - 40, 40);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(`TRIP: ${physics.odometerMiles.toFixed(1)} MI`, 45, h - 30);

    ctx.textAlign = 'center';
    ctx.fillText(`THROTTLE: ${Math.round(physics.throttle * 100)}%   |   BRAKE: ${Math.round(physics.brake * 100)}%`, centerX, h - 30);

    ctx.textAlign = 'right';
    ctx.fillText(`DIST: ${(physics.highwayDistance / 1000).toFixed(2)} KM`, w - 45, h - 30);

    this.gaugeTexture.needsUpdate = true;
  }

  /**
   * Update and render the In-Dash Infotainment Display (Spotify & Radio)
   */
  public renderInfotainment(delta: number, playerSpeed: number) {
    const ctx = this.infotainmentCtx;
    const w = this.infotainmentCanvas.width;
    const h = this.infotainmentCanvas.height;

    const track: SpotifyTrack = spotifyManager.getCurrentDisplayTrack();
    const isSpotify = spotifyManager.isConnected();
    const station = spotifyManager.getStation();

    // Sleek automotive glass dashboard UI background
    ctx.fillStyle = '#090b10';
    ctx.fillRect(0, 0, w, h);

    // Glowing border frame
    ctx.strokeStyle = isSpotify ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    // Top Brand & Status Bar
    ctx.fillStyle = '#111827';
    ctx.fillRect(10, 10, w - 20, 65);

    // Brand icon & name
    ctx.fillStyle = isSpotify ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(45, 42, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(isSpotify ? 'SPOTIFY CONNECT' : 'HIGHWAY FM RADIO', 75, 50);

    // Source Pill
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = isSpotify ? '#34d399' : '#fbbf24';
    ctx.textAlign = 'right';
    ctx.fillText(isSpotify ? '🟢 LIVE STREAM' : `📻 ${station.frequency}`, w - 35, 48);

    // Left Section: Album Cover Art Box / Cassette Graphic
    const artX = 50;
    const artY = 110;
    const artSize = 320;

    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(artX, artY, artSize, artSize, 16);
    ctx.fill();

    // Draw stylized soundwave or vinyl art in cover box
    const artGrad = ctx.createLinearGradient(artX, artY, artX + artSize, artY + artSize);
    artGrad.addColorStop(0, isSpotify ? '#064e3b' : '#78350f');
    artGrad.addColorStop(1, isSpotify ? '#022c22' : '#451a03');
    ctx.fillStyle = artGrad;
    ctx.beginPath();
    ctx.roundRect(artX + 10, artY + 10, artSize - 20, artSize - 20, 12);
    ctx.fill();

    // Central vinyl record ring
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(artX + artSize / 2, artY + artSize / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isSpotify ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(artX + artSize / 2, artY + artSize / 2, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(isSpotify ? 'SPOTIFY' : 'FM', artX + artSize / 2, artY + artSize / 2 + 5);

    // Right Section: Track Metadata & Controls
    const infoX = 410;
    ctx.textAlign = 'left';

    // Playing label
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = isSpotify ? '#10b981' : '#38bdf8';
    ctx.fillText(isSpotify ? 'NOW PLAYING VIA SPOTIFY' : `BROADCAST: ${station.name}`, infoX, 140);

    // Track Title (bold, prominent)
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    const title = track.name.length > 25 ? track.name.substring(0, 25) + '...' : track.name;
    ctx.fillText(title, infoX, 190);

    // Artist Name
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const artist = track.artist.length > 30 ? track.artist.substring(0, 30) + '...' : track.artist;
    ctx.fillText(artist, infoX, 230);

    // Album Name
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(track.album || 'Highway Audio Drive', infoX, 265);

    // Animated Real-Time Audio Visualizer Bars
    this.visualizerTimer += delta * 6;
    const numBars = 22;
    const barWidth = 18;
    const barGap = 6;
    const vizX = infoX;
    const vizY = 360;
    const maxBarH = 65;

    for (let i = 0; i < numBars; i++) {
      const targetH = Math.abs(Math.sin(this.visualizerTimer + i * 0.45) * Math.cos(this.visualizerTimer * 0.7 + i * 0.2)) * maxBarH + 8;
      this.visualizerBars[i] = THREE.MathUtils.lerp(this.visualizerBars[i] || 10, targetH, delta * 12);

      const bh = this.visualizerBars[i];
      const bx = vizX + i * (barWidth + barGap);
      const by = vizY - bh;

      const barGrad = ctx.createLinearGradient(bx, by, bx, vizY);
      barGrad.addColorStop(0, isSpotify ? '#34d399' : '#38bdf8');
      barGrad.addColorStop(1, isSpotify ? '#059669' : '#0284c7');

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(bx, by, barWidth, bh, 4);
      ctx.fill();
    }

    // Progress Bar Track
    const progX = 50;
    const progY = 470;
    const progW = w - 100;
    const progH = 10;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW, progH, 5);
    ctx.fill();

    const progressFraction = Math.min(1, Math.max(0, track.durationMs > 0 ? track.progressMs / track.durationMs : 0.4));
    const activeProgW = progW * progressFraction;

    ctx.fillStyle = isSpotify ? '#10b981' : '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(progX, progY, Math.max(8, activeProgW), progH, 5);
    ctx.fill();

    // Progress time text
    const formatTime = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(formatTime(track.progressMs), progX, progY + 30);

    ctx.textAlign = 'right';
    ctx.fillText(formatTime(track.durationMs), progX + progW, progY + 30);

    // Media Touch Bar Buttons (Bottom)
    const btnY = 530;
    const btnCenterX = w / 2;

    // Previous Button
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(btnCenterX - 110, btnY, 60, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏮', btnCenterX - 80, btnY + 28);

    // Play / Pause Button
    ctx.fillStyle = isSpotify ? '#10b981' : '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(btnCenterX - 35, btnY - 2, 70, 48, 10);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(track.isPlaying ? '⏸' : '▶', btnCenterX, btnY + 30);

    // Next Button
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(btnCenterX + 50, btnY, 60, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText('⏭', btnCenterX + 80, btnY + 28);

    // Instruction prompt
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('[M] Cycle Radio Station / Mute   |   [TAB] Spotify Auth Modal', 50, btnY + 28);

    this.infotainmentTexture.needsUpdate = true;
  }
}

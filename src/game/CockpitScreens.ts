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

    // Slow Roads aesthetic dark cluster background
    ctx.fillStyle = '#181b1c';
    ctx.fillRect(0, 0, w, h);

    // Arched cluster pod outline (Slow Roads binnacle shape)
    const podX = 60;
    const podY = 30;
    const podW = w - 120;
    const podH = h - 60;

    // Pod background with warm bronze/charcoal gradient
    const podGrad = ctx.createLinearGradient(0, podY, 0, podY + podH);
    podGrad.addColorStop(0, '#262928');
    podGrad.addColorStop(0.4, '#1f2221');
    podGrad.addColorStop(1, '#181a1a');

    ctx.save();
    ctx.beginPath();
    // Arched top with rounded corners matching IMG_7411.png
    ctx.roundRect(podX, podY, podW, podH, [160, 160, 24, 24]);
    ctx.fillStyle = podGrad;
    ctx.fill();

    // Subtle ambient inner rim stroke
    ctx.strokeStyle = '#353a39';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Soft inner glow vignette
    const innerGlow = ctx.createRadialGradient(w / 2, podY + podH * 0.45, podW * 0.15, w / 2, podY + podH * 0.45, podW * 0.6);
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = innerGlow;
    ctx.fill();

    // --- LEFT SECTION: DIGITAL SPEED (IMG_7411.png) ---
    const speed = Math.round(physics.speed);
    ctx.textAlign = 'center';

    // Speed value
    ctx.font = '500 96px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(speed.toString(), 250, 255);

    // KPH / MPH label below speed
    ctx.font = '600 20px sans-serif';
    ctx.fillStyle = '#7a8587';
    ctx.fillText('MPH', 250, 298);

    // --- CENTER SECTION: DYNAMIC ROAD TRAJECTORY & ODOMETER (IMG_7411.png) ---
    // 1. Dynamic curving road line matching IMG_7411.png (curves left when steering left, curves right when steering right)
    const curveOffset = THREE.MathUtils.clamp((physics.steerAngle * 130) + (physics.yawRate * 80), -140, 140);
    ctx.beginPath();
    ctx.moveTo(512, 305);
    ctx.bezierCurveTo(512, 245, 512 + curveOffset * 0.55, 205, 512 + curveOffset, 160);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // 2. Odometer (e.g. 00020 KM / MI) with styled leading zeros
    const odoTotal = Math.floor(physics.odometerMiles);
    const odoStr = odoTotal.toString().padStart(5, '0');
    const activeLen = odoTotal.toString().length;
    const leadingZeros = odoStr.slice(0, 5 - activeLen);
    const activeDigits = odoStr.slice(5 - activeLen);

    ctx.font = '600 28px monospace';
    // Draw leading zeros in muted tone
    ctx.textAlign = 'right';
    ctx.fillStyle = '#555f61';
    ctx.fillText(leadingZeros, 512 - (activeDigits.length * 8), 350);
    // Draw active digits in warm white
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(activeDigits, 512 - (activeDigits.length * 8), 350);

    // KM / MI label
    ctx.textAlign = 'center';
    ctx.font = '600 13px sans-serif';
    ctx.fillStyle = '#717c7e';
    ctx.fillText('MI', 512, 372);

    // 3. Digital Clock matching IMG_7411.png (e.g. 08:12)
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#838e90';
    ctx.fillText(`${hours}:${minutes}`, 512, 412);

    // --- RIGHT SECTION: LIGHTNING BOLT & AWD (IMG_7411.png) ---
    // 1. Lightning Bolt symbol ⚡
    ctx.save();
    ctx.translate(770, 225);
    ctx.fillStyle = physics.isBoosting ? '#38bdf8' : '#f1f5f9';
    ctx.shadowColor = physics.isBoosting ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = physics.isBoosting ? 16 : 6;
    ctx.beginPath();
    ctx.moveTo(3, -22);
    ctx.lineTo(-14, 2);
    ctx.lineTo(-2, 2);
    ctx.lineTo(-6, 22);
    ctx.lineTo(14, -2);
    ctx.lineTo(2, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. AWD badge below bolt
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#788486';
    ctx.fillText('AWD', 770, 285);

    // 3. Energy / Nitro Fuel gauge line
    const fuelW = 90;
    const fuelX = 770 - fuelW / 2;
    const fuelY = 305;
    ctx.fillStyle = '#2d3334';
    ctx.beginPath();
    ctx.roundRect(fuelX, fuelY, fuelW, 6, 3);
    ctx.fill();

    const currentFuelW = (physics.boostFuel / 100) * fuelW;
    ctx.fillStyle = physics.isBoosting ? '#38bdf8' : '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(fuelX, fuelY, currentFuelW, 6, 3);
    ctx.fill();

    // --- INDICATORS (Blinkers & Headlights) ---
    if (physics.leftBlinker && blinkerState) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('◀', 160, 95);
    }
    if (physics.rightBlinker && blinkerState) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('▶', w - 160, 95);
    }
    if (physics.headlights) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('💡', 512, 105);
    }

    // Spotify track ticker along bottom edge if connected
    const currentTrack = spotifyManager.getCurrentDisplayTrack();
    if (currentTrack && currentTrack.name && currentTrack.name !== 'Slow Roads Radio') {
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`♫ ${currentTrack.name} • ${currentTrack.artist}`, 512, 452);
    }

    ctx.restore();

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

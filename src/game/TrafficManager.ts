/**
 * AI Traffic Simulation System
 * Manages vehicles, lane switching, overtaking, collision, and near-misses
 */

import * as THREE from 'three';
import { AITrafficVehicle, TrafficDensity } from '../types';
import { HighwaySpline } from './HighwaySpline';
import { Vehicles3D } from './Vehicles3D';
import { soundEngine } from '../audio/SoundEngine';

export class TrafficManager {
  private scene: THREE.Scene;
  private density: TrafficDensity = 'moderate';
  private vehicles: AITrafficVehicle[] = [];
  private vehicleMeshes: Array<{
    root: THREE.Group;
    taillights: THREE.Mesh[];
    leftBlinkers: THREE.Mesh[];
    rightBlinkers: THREE.Mesh[];
  }> = [];

  private nextId: number = 1;
  private blinkerFlashState: boolean = false;
  private blinkerTimer: number = 0;

  // Near miss callback
  public onNearMiss?: (combo: number) => void;
  public onCollision?: () => void;
  private nearMissStreak: number = 0;
  private lastNearMissTime: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setDensity('moderate');
  }

  public setDensity(density: TrafficDensity) {
    this.density = density;
    this.rebuildTrafficPool();
  }

  private getMaxVehicles(): number {
    switch (this.density) {
      case 'off':
        return 0;
      case 'light':
        return 10;
      case 'moderate':
        return 22;
      case 'heavy':
        return 38;
      case 'chaotic':
        return 55;
    }
  }

  private rebuildTrafficPool() {
    // Remove existing meshes from scene
    this.vehicleMeshes.forEach((m) => {
      this.scene.remove(m.root);
    });
    this.vehicleMeshes = [];
    this.vehicles = [];

    const maxCount = this.getMaxVehicles();
    if (maxCount === 0) return;

    const vehicleColors = [
      0xf1f5f9, // Pearl white
      0x0f172a, // Obsidian black
      0x64748b, // Graphite grey
      0x2563eb, // Sapphire blue
      0xdc2626, // Crimson red
      0x16a34a, // Forest emerald
      0xd97706, // Amber gold
      0x7c3aed, // Royal purple
    ];

    const types: Array<'sedan' | 'suv' | 'truck' | 'sportscar' | 'tanker'> = [
      'sedan',
      'sedan',
      'suv',
      'truck',
      'sportscar',
      'suv',
      'tanker',
    ];

    for (let i = 0; i < maxCount; i++) {
      const type = types[i % types.length];
      const color = vehicleColors[i % vehicleColors.length];
      const meshData = Vehicles3D.createAITrafficMesh(type, color);
      this.scene.add(meshData.root);
      this.vehicleMeshes.push(meshData);

      // Initial placement spaced out along highway
      const lane = i % 4;
      const initialDistance = 50 + i * 22;
      const laneOffset = HighwaySpline.getLaneOffset(lane);

      let targetSpeed = 65;
      if (type === 'truck' || type === 'tanker') {
        targetSpeed = 52 + Math.random() * 8; // Trucks drive 52-60 mph
      } else if (type === 'sportscar') {
        targetSpeed = 78 + Math.random() * 14; // Sports cars drive 78-92 mph
      } else if (lane === 0) {
        targetSpeed = 58 + Math.random() * 8;
      } else if (lane === 3) {
        targetSpeed = 76 + Math.random() * 10;
      } else {
        targetSpeed = 66 + Math.random() * 8;
      }

      this.vehicles.push({
        id: this.nextId++,
        type,
        color: `#${color.toString(16)}`,
        lane,
        currentLaneOffset: laneOffset,
        distance: initialDistance,
        speed: targetSpeed,
        targetSpeed,
        laneChangeDirection: null,
        laneChangeProgress: 0,
        blinkerTimer: 0,
        meshIndex: i,
        width: type === 'truck' || type === 'tanker' ? 2.6 : 2.0,
        length: type === 'truck' || type === 'tanker' ? 12.0 : 4.4,
        height: type === 'truck' || type === 'tanker' ? 3.4 : 1.4,
      });
    }
  }

  public update(
    delta: number,
    playerDistance: number,
    playerLaneOffset: number,
    playerSpeed: number,
    playerWidth: number,
    playerLength: number
  ) {
    if (this.vehicles.length === 0) return;

    // Blinkers flash timer
    this.blinkerTimer += delta;
    if (this.blinkerTimer > 0.38) {
      this.blinkerTimer = 0;
      this.blinkerFlashState = !this.blinkerFlashState;
    }

    const forwardSpawnDist = 320;
    const backwardDespawnDist = 70;

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const mesh = this.vehicleMeshes[v.meshIndex];

      // Recycle if too far behind player
      if (v.distance < playerDistance - backwardDespawnDist) {
        v.distance = playerDistance + forwardSpawnDist + Math.random() * 60;
        v.lane = Math.floor(Math.random() * 4);
        v.currentLaneOffset = HighwaySpline.getLaneOffset(v.lane);
        v.laneChangeDirection = null;
        v.laneChangeProgress = 0;
        v.speed = v.targetSpeed;
      } else if (v.distance > playerDistance + forwardSpawnDist + 90) {
        // Too far ahead, bring closer
        v.distance = playerDistance + forwardSpawnDist - 30;
      }

      // Check for vehicle ahead in current lane (AI overtaking & braking logic)
      let vehicleAhead: AITrafficVehicle | null = null;
      let minGap = 999;

      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.lane === v.lane && other.distance > v.distance) {
          const gap = other.distance - v.distance;
          if (gap < minGap) {
            minGap = gap;
            vehicleAhead = other;
          }
        }
      }

      // Dynamic Overtaking logic:
      // If blocked by slower car ahead within 28 meters
      let isBraking = false;
      if (vehicleAhead && minGap < 30) {
        if (v.laneChangeDirection === null) {
          // Attempt lane change: check if left lane (or right lane) is clear
          const canOvertakeLeft = v.lane < 3 && this.isLaneClear(v.lane + 1, v.distance);
          const canOvertakeRight = v.lane > 0 && this.isLaneClear(v.lane - 1, v.distance);

          if (canOvertakeLeft) {
            v.laneChangeDirection = 'left';
            v.laneChangeProgress = 0;
          } else if (canOvertakeRight) {
            v.laneChangeDirection = 'right';
            v.laneChangeProgress = 0;
          } else {
            // Cannot change lane: slow down to avoid rear-ending
            v.speed = Math.max(30, vehicleAhead.speed - 3);
            isBraking = true;
          }
        }
      } else if (!vehicleAhead || minGap > 45) {
        // Return to normal cruise speed
        if (v.speed < v.targetSpeed) {
          v.speed += delta * 10;
        }
      }

      // Execute lane change transition
      if (v.laneChangeDirection !== null) {
        v.laneChangeProgress += delta * 0.45; // ~2.2s lane change
        const sourceOffset = HighwaySpline.getLaneOffset(v.lane);
        const targetLane = v.laneChangeDirection === 'left' ? v.lane + 1 : v.lane - 1;
        const targetOffset = HighwaySpline.getLaneOffset(targetLane);

        // Smooth cubic ease
        const t = Math.min(1, v.laneChangeProgress);
        const easeT = t * t * (3 - 2 * t);
        v.currentLaneOffset = THREE.MathUtils.lerp(sourceOffset, targetOffset, easeT);

        if (v.laneChangeProgress >= 1) {
          v.lane = targetLane;
          v.currentLaneOffset = targetOffset;
          v.laneChangeDirection = null;
          v.laneChangeProgress = 0;
        }
      }

      // Move along highway (convert mph to m/s: 1 mph = 0.44704 m/s)
      const speedMps = v.speed * 0.44704;
      v.distance += speedMps * delta;

      // Update 3D Transform on highway spline
      const point = HighwaySpline.getPointWithOffset(v.distance, v.currentLaneOffset);
      const tangent = HighwaySpline.getTangentAtDistance(v.distance);

      mesh.root.position.copy(point);
      mesh.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Taillights activation (if braking)
      mesh.taillights.forEach((tl) => {
        (tl.material as THREE.Material) = isBraking ? Vehicles3D.taillightOnMaterial : Vehicles3D.taillightOffMaterial;
      });

      // Blinkers activation
      const isBlinkingLeft = v.laneChangeDirection === 'left' && this.blinkerFlashState;
      const isBlinkingRight = v.laneChangeDirection === 'right' && this.blinkerFlashState;

      mesh.leftBlinkers.forEach((bl) => {
        (bl.material as THREE.Material) = isBlinkingLeft ? Vehicles3D.blinkerOnMaterial : Vehicles3D.blinkerOffMaterial;
      });
      mesh.rightBlinkers.forEach((br) => {
        (br.material as THREE.Material) = isBlinkingRight ? Vehicles3D.blinkerOnMaterial : Vehicles3D.blinkerOffMaterial;
      });

      // Player Collision & Near-Miss check
      const distDelta = Math.abs(v.distance - playerDistance);
      const latDelta = Math.abs(v.currentLaneOffset - playerLaneOffset);

      // Collision box check
      const halfLength = (v.length + playerLength) * 0.5 * 0.85;
      const halfWidth = (v.width + playerWidth) * 0.5 * 0.85;

      if (distDelta < halfLength && latDelta < halfWidth) {
        // Crash / bump
        soundEngine.playCrashThud();
        if (this.onCollision) this.onCollision();
      } else if (
        distDelta < 6.0 &&
        latDelta > halfWidth &&
        latDelta < halfWidth + 1.6 &&
        playerSpeed > v.speed + 18
      ) {
        // Near miss!
        const now = performance.now();
        if (now - this.lastNearMissTime > 1200) {
          this.lastNearMissTime = now;
          this.nearMissStreak++;
          soundEngine.playNearMissChime();
          if (this.onNearMiss) {
            this.onNearMiss(this.nearMissStreak);
          }
        }
      }
    }
  }

  private isLaneClear(targetLane: number, distance: number): boolean {
    for (const other of this.vehicles) {
      if (other.lane === targetLane) {
        if (Math.abs(other.distance - distance) < 22) {
          return false;
        }
      }
    }
    return true;
  }
}

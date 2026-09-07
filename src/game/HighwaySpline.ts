/**
 * HighwaySpline - Procedural Infinite Highway Generator
 * Generates continuous smooth highway curves, elevation changes, and roadside infrastructure
 */

import * as THREE from 'three';

export class HighwaySpline {
  public static readonly LANE_WIDTH = 4.2; // meters
  public static readonly NUM_LANES = 4; // 4 lanes
  public static readonly TOTAL_ROAD_WIDTH = HighwaySpline.LANE_WIDTH * HighwaySpline.NUM_LANES + 4.0; // + shoulders

  // Curvature harmonics
  private static readonly CURVE_FREQS = [0.0012, 0.0028, 0.0006];
  private static readonly CURVE_AMPS = [140, 65, 260];

  // Elevation harmonics
  private static readonly ELEV_FREQS = [0.0018, 0.0042, 0.0008];
  private static readonly ELEV_AMPS = [28, 12, 45];

  /**
   * Get 3D coordinate at road distance `s`
   */
  public static getPointAtDistance(s: number, target: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
    let x = 0;
    for (let i = 0; i < this.CURVE_FREQS.length; i++) {
      x += Math.sin(s * this.CURVE_FREQS[i]) * this.CURVE_AMPS[i];
    }

    let y = 0;
    for (let i = 0; i < this.ELEV_FREQS.length; i++) {
      y += Math.sin(s * this.ELEV_FREQS[i]) * this.ELEV_AMPS[i];
    }

    const z = s;
    target.set(x, y, z);
    return target;
  }

  /**
   * Get tangent vector (forward heading) at distance `s`
   */
  public static getTangentAtDistance(s: number, target: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
    const delta = 1.0;
    const p1 = this.getPointAtDistance(s - delta);
    const p2 = this.getPointAtDistance(s + delta);
    target.subVectors(p2, p1).normalize();
    return target;
  }

  /**
   * Get right-hand normal vector (perpendicular to road heading, horizontal)
   */
  public static getNormalAtDistance(s: number, target: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
    const tangent = this.getTangentAtDistance(s);
    // Cross product of tangent with UP vector (0, 1, 0)
    target.set(tangent.z, 0, -tangent.x).normalize();
    return target;
  }

  /**
   * Get 3D position of a specific lane offset at distance `s`
   * laneOffset: lateral position in meters from highway centerline
   */
  public static getPointWithOffset(s: number, offsetMeters: number, target: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
    this.getPointAtDistance(s, target);
    const normal = this.getNormalAtDistance(s);
    target.addScaledVector(normal, offsetMeters);
    return target;
  }

  /**
   * Get target lane center offset in meters
   * Lane 0: Far Right (slow / trucks)
   * Lane 1: Middle Right
   * Lane 2: Middle Left
   * Lane 3: Far Left (overtaking / fast)
   */
  public static getLaneOffset(laneIndex: number): number {
    // 4 lanes centered around 0
    // Lane 0 = +1.5 * LANE_WIDTH
    // Lane 1 = +0.5 * LANE_WIDTH
    // Lane 2 = -0.5 * LANE_WIDTH
    // Lane 3 = -1.5 * LANE_WIDTH
    const normIndex = Math.max(0, Math.min(3, laneIndex));
    return (1.5 - normIndex) * this.LANE_WIDTH;
  }
}

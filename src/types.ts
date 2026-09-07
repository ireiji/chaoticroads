/**
 * Chaotic Roads - Core Types
 */

export type VehicleType = 'car' | 'motorcycle';
export type CameraView = 'cockpit' | 'chase';
export type TrafficDensity = 'off' | 'light' | 'moderate' | 'heavy' | 'chaotic';
export type WeatherType = 'clear' | 'foggy' | 'rain' | 'overcast';
export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

export interface VehiclePhysicsState {
  speed: number; // in mph
  rpm: number; // 800 - 8000 (car) or 1000 - 13000 (motorcycle)
  gear: number; // 1 - 6, or -1 for R, 0 for N
  steerAngle: number; // -1 to 1
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  isBoosting: boolean;
  boostFuel: number; // 0 to 100
  laneOffset: number; // lateral position on highway (-3 to 3 lanes)
  highwayDistance: number; // distance along highway track
  worldX: number;
  worldY: number;
  worldZ: number;
  roll: number; // lean angle (motorcycle banking or car body roll)
  pitch: number;
  yaw: number;
  yawRate: number; // rad/s
  lateralVelocity: number; // m/s
  steeringWheelAngle: number; // radians of steering wheel rotation
  leftBlinker: boolean;
  rightBlinker: boolean;
  headlights: boolean;
  isDrifting: boolean;
  odometerMiles: number;
}

export interface AITrafficVehicle {
  id: number;
  type: 'sedan' | 'suv' | 'truck' | 'sportscar' | 'tanker';
  color: string;
  lane: number; // target lane (0: slow right, 1: center right, 2: center left, 3: fast left)
  currentLaneOffset: number; // actual lateral position (-1.5 to 1.5 lanes * laneWidth)
  distance: number; // distance along highway track
  speed: number; // current speed in mph
  targetSpeed: number; // desired speed
  laneChangeDirection: 'left' | 'right' | null;
  laneChangeProgress: number; // 0 to 1
  blinkerTimer: number;
  meshIndex: number;
  width: number;
  length: number;
  height: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
  externalUrl?: string;
  isRadioTrack?: boolean;
}

export interface HighwaySegment {
  t: number; // parameter along curve
  x: number;
  y: number; // elevation
  z: number;
  tangentX: number;
  tangentY: number;
  tangentZ: number;
  normalX: number;
  normalZ: number;
}

/**
 * GameEngine.ts - Procedural Highway Driving Engine for Three.js
 * Implements physically realistic vehicle dynamics, visible multi-lane highway rendering,
 * in-dash 3D gauge cluster & Spotify infotainment, day/weather cycle, and traffic simulation.
 */

import * as THREE from 'three';
import {
  CameraView,
  TimeOfDay,
  TrafficDensity,
  VehiclePhysicsState,
  VehicleType,
  WeatherType,
} from '../types';
import { HighwaySpline } from './HighwaySpline';
import { TrafficManager } from './TrafficManager';
import { Vehicles3D } from './Vehicles3D';
import { CockpitScreens } from './CockpitScreens';
import { soundEngine } from '../audio/SoundEngine';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private streetLightsGroup: THREE.Group;

  // Road & Environment
  private roadGroup: THREE.Group;
  private roadMesh: THREE.Mesh | null = null;
  private terrainMesh: THREE.Mesh | null = null;
  private roadMarkingsMesh: THREE.Mesh | null = null;
  private guardrailsMesh: THREE.Mesh | null = null;
  private sceneryGroup: THREE.Group;
  private sceneryEntities: Array<{ mesh: THREE.Object3D; distance: number }> = [];

  // Weather particles
  private rainParticles: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry | null = null;

  // Traffic
  private trafficManager: TrafficManager;

  // Vehicle Meshes & In-Cockpit 3D Screens
  private cockpitScreens: CockpitScreens;
  private carExterior: ReturnType<typeof Vehicles3D.createPlayerCarMesh>;
  private carCockpit: ReturnType<typeof Vehicles3D.createCarCockpit>;
  private motoExterior: ReturnType<typeof Vehicles3D.createPlayerMotorcycleMesh>;
  private motoCockpit: ReturnType<typeof Vehicles3D.createPlayerMotorcycleCockpit>;

  // Game & Physics State
  private vehicleType: VehicleType = 'car';
  private cameraView: CameraView = 'cockpit';
  private weather: WeatherType = 'clear';
  private timeOfDay: TimeOfDay = 'day';
  private autoTimeCycle: boolean = false;
  private timeCycleProgress: number = 0.5; // midday

  public physics: VehiclePhysicsState = {
    speed: 0,
    rpm: 900,
    gear: 1,
    steerAngle: 0,
    throttle: 0,
    brake: 0,
    isBoosting: false,
    boostFuel: 100,
    laneOffset: HighwaySpline.getLaneOffset(1), // middle right lane
    highwayDistance: 100,
    worldX: 0,
    worldY: 0,
    worldZ: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    yawRate: 0,
    lateralVelocity: 0,
    steeringWheelAngle: 0,
    leftBlinker: false,
    rightBlinker: false,
    headlights: true,
    isDrifting: false,
    odometerMiles: 0,
  };

  // Input states
  private keys: Record<string, boolean> = {};

  // Blinker timer
  private blinkerFlashState: boolean = false;
  private blinkerCycleTimer: number = 0;

  // Wiper animation
  private wiperAngle: number = 0;
  private wiperDirection: number = 1;

  // Loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  // Callbacks for React HUD updates
  public onPhysicsUpdate?: (state: VehiclePhysicsState) => void;
  public onNearMissScore?: (streak: number) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x60a5fa);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0016);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      1200
    );

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.7);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 240;
    const d = 55;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Street lights group
    this.streetLightsGroup = new THREE.Group();
    this.scene.add(this.streetLightsGroup);

    // 5. Road & Scenery Groups
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);

    this.sceneryGroup = new THREE.Group();
    this.scene.add(this.sceneryGroup);

    // 6. Traffic Manager
    this.trafficManager = new TrafficManager(this.scene);
    this.trafficManager.onNearMiss = (streak) => {
      if (this.onNearMissScore) this.onNearMissScore(streak);
    };
    this.trafficManager.onCollision = () => {
      // Impact penalty & sound
      soundEngine.playCrashThud();
      this.physics.speed = Math.max(10, this.physics.speed * 0.45);
      this.physics.lateralVelocity *= -0.5;
      this.physics.steerAngle += (Math.random() - 0.5) * 0.4;
    };

    // 7. Initialize In-Dash 3D Cockpit Displays & Vehicle Meshes
    this.cockpitScreens = new CockpitScreens();
    this.carExterior = Vehicles3D.createPlayerCarMesh();
    this.carCockpit = Vehicles3D.createCarCockpit(this.cockpitScreens);
    this.motoExterior = Vehicles3D.createPlayerMotorcycleMesh();
    this.motoCockpit = Vehicles3D.createPlayerMotorcycleCockpit(this.cockpitScreens);

    this.scene.add(this.carExterior.root);
    this.scene.add(this.carCockpit.root);
    this.scene.add(this.motoExterior.root);
    this.scene.add(this.motoCockpit.root);

    this.updateVehicleVisibility();

    // 8. Rain Particles
    this.setupRain();

    // 9. Event Listeners
    this.setupInputListeners();
    window.addEventListener('resize', this.onWindowResize);

    // 10. Initial Road Generation & Environment
    this.rebuildRoadGeometry(this.physics.highwayDistance);
    this.spawnRoadsideScenery(this.physics.highwayDistance);
    this.updateEnvironmentLighting();
  }

  private setupRain() {
    const rainCount = 4500;
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.16,
      transparent: true,
      opacity: 0.5,
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  private setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      soundEngine.init();
      this.keys[e.code] = true;

      // Toggle Blinker controls (Left / Right Arrow)
      if (e.code === 'ArrowLeft') {
        this.physics.leftBlinker = !this.physics.leftBlinker;
        if (this.physics.leftBlinker) this.physics.rightBlinker = false;
        soundEngine.playBlinkerClick(true);
      } else if (e.code === 'ArrowRight') {
        this.physics.rightBlinker = !this.physics.rightBlinker;
        if (this.physics.rightBlinker) this.physics.leftBlinker = false;
        soundEngine.playBlinkerClick(true);
      } else if (e.code === 'KeyC') {
        this.setCameraView(this.cameraView === 'cockpit' ? 'chase' : 'cockpit');
      } else if (e.code === 'KeyV') {
        this.setVehicleType(this.vehicleType === 'car' ? 'motorcycle' : 'car');
      } else if (e.code === 'KeyL') {
        this.physics.headlights = !this.physics.headlights;
      } else if (e.code === 'KeyH') {
        soundEngine.startHorn();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.physics.isBoosting) {
          soundEngine.playBlowOffValve();
        }
      }
    });
  }

  private onWindowResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public setVehicleType(type: VehicleType) {
    this.vehicleType = type;
    soundEngine.setVehicleType(type);
    this.updateVehicleVisibility();
  }

  public setCameraView(view: CameraView) {
    this.cameraView = view;
    this.updateVehicleVisibility();
  }

  public setTrafficDensity(density: TrafficDensity) {
    this.trafficManager.setDensity(density);
  }

  public setWeather(weather: WeatherType) {
    this.weather = weather;
    if (this.rainParticles) {
      this.rainParticles.visible = weather === 'rain';
    }
    this.updateEnvironmentLighting();
  }

  public setTimeOfDay(tod: TimeOfDay) {
    this.timeOfDay = tod;
    this.updateEnvironmentLighting();
  }

  public setAutoTimeCycle(enabled: boolean) {
    this.autoTimeCycle = enabled;
  }

  private updateVehicleVisibility() {
    const isCar = this.vehicleType === 'car';
    const isCockpit = this.cameraView === 'cockpit';

    if (isCockpit) {
      // In cockpit view: show interior dashboard, hide exterior shell
      this.carExterior.root.visible = false;
      this.motoExterior.root.visible = false;
      this.carCockpit.root.visible = isCar;
      this.motoCockpit.root.visible = !isCar;
    } else {
      // In 3rd person chase view: show exterior, hide interior cockpit
      this.carExterior.root.visible = isCar;
      this.motoExterior.root.visible = !isCar;
      this.carCockpit.root.visible = false;
      this.motoCockpit.root.visible = false;
    }
  }

  private updateEnvironmentLighting() {
    let skyColor = 0x60a5fa;
    let fogColor = 0xbae6fd;
    let sunColor = 0xffedd5;
    let sunIntensity = 1.7;
    let hemiSky = 0xffffff;
    let hemiGround = 0x334155;
    let fogDensity = 0.0016;

    switch (this.timeOfDay) {
      case 'dawn':
        skyColor = 0xfdba74;
        fogColor = 0xfed7aa;
        sunColor = 0xfb923c;
        sunIntensity = 1.3;
        hemiSky = 0xfef08a;
        hemiGround = 0x475569;
        break;
      case 'day':
        skyColor = 0x60a5fa; // Clear natural blue
        fogColor = 0xbae6fd;
        sunColor = 0xffedd5;
        sunIntensity = 1.7;
        hemiSky = 0xffffff;
        hemiGround = 0x334155;
        break;
      case 'sunset':
        skyColor = 0xf43f5e;
        fogColor = 0xfb7185;
        sunColor = 0xf97316;
        sunIntensity = 1.4;
        hemiSky = 0xfca5a5;
        hemiGround = 0x1e293b;
        break;
      case 'night':
        skyColor = 0x030712;
        fogColor = 0x090d16;
        sunColor = 0x38bdf8;
        sunIntensity = 0.25;
        hemiSky = 0x1e293b;
        hemiGround = 0x020617;
        fogDensity = 0.0028;
        break;
    }

    // Weather adjustments
    if (this.weather === 'rain') {
      skyColor = 0x334155;
      fogColor = 0x475569;
      sunIntensity *= 0.55;
      fogDensity = 0.0035;
    } else if (this.weather === 'foggy') {
      fogColor = 0xcfd8dc;
      skyColor = 0xb0bec5;
      sunIntensity *= 0.35;
      fogDensity = 0.0085;
    } else if (this.weather === 'overcast') {
      skyColor = 0x64748b;
      fogColor = 0x94a3b8;
      sunIntensity *= 0.65;
      fogDensity = 0.0022;
    }

    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(fogColor, fogDensity);
    this.sunLight.color.setHex(sunColor);
    this.sunLight.intensity = sunIntensity;
    this.hemiLight.color.setHex(hemiSky);
    this.hemiLight.groundColor.setHex(hemiGround);

    // Headlight Spotlights toggled
    const isNightOrRain = this.timeOfDay === 'night' || this.timeOfDay === 'sunset' || this.weather === 'rain';
    const lightsOn = this.physics.headlights || isNightOrRain;

    this.carExterior.headlightSpots.forEach((s) => (s.visible = lightsOn));
    this.motoExterior.headlightSpots.forEach((s) => (s.visible = lightsOn));
  }

  /**
   * Rebuild Highway Road Geometry with Clearly Visible Multi-Lane Markings & Guardrails
   */
  private rebuildRoadGeometry(centerDist: number) {
    const startS = Math.floor((centerDist - 80) / 4) * 4;
    const endS = centerDist + 520;
    const stepDist = 3.0; // tight resolution for smooth curves
    const steps = Math.ceil((endS - startS) / stepDist);

    const halfRoad = HighwaySpline.TOTAL_ROAD_WIDTH * 0.5;

    // 1. Road Tarmac Vertices
    const roadVerts: number[] = [];
    const roadNorms: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    // 2. Terrain Vertices
    const terrainVerts: number[] = [];
    const terrainNorms: number[] = [];
    const terrainIndices: number[] = [];

    // 3. Crisp Road Markings (Solid Yellow Left, 3 Dashed White Lines, Solid White Right)
    const markVerts: number[] = [];
    const markColors: number[] = [];
    const markIndices: number[] = [];

    // 4. Guardrails (Galvanized steel W-beams along both shoulders)
    const guardVerts: number[] = [];
    const guardIndices: number[] = [];

    const addMarkingQuad = (
      p1L: THREE.Vector3,
      p1R: THREE.Vector3,
      p2L: THREE.Vector3,
      p2R: THREE.Vector3,
      r: number,
      g: number,
      b: number
    ) => {
      const base = markVerts.length / 3;
      const yElev = 0.038; // Raised slightly above tarmac to prevent z-fighting
      markVerts.push(
        p1L.x, p1L.y + yElev, p1L.z,
        p1R.x, p1R.y + yElev, p1R.z,
        p2L.x, p2L.y + yElev, p2L.z,
        p2R.x, p2R.y + yElev, p2R.z
      );
      for (let c = 0; c < 4; c++) {
        markColors.push(r, g, b);
      }
      markIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      // Double side
      markIndices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    };

    const addGuardrailSegment = (
      p1: THREE.Vector3,
      n1: THREE.Vector3,
      p2: THREE.Vector3,
      n2: THREE.Vector3,
      side: number
    ) => {
      const base = guardVerts.length / 3;
      const offset = side * (halfRoad + 0.35);
      const railH = 0.75;
      const railW = 0.28;

      const p1B = p1.clone().addScaledVector(n1, offset);
      const p2B = p2.clone().addScaledVector(n2, offset);

      guardVerts.push(
        p1B.x, p1B.y + railH - railW, p1B.z,
        p1B.x, p1B.y + railH, p1B.z,
        p2B.x, p2B.y + railH - railW, p2B.z,
        p2B.x, p2B.y + railH, p2B.z
      );
      guardIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      guardIndices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    };

    const p = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const pNext = new THREE.Vector3();
    const normalNext = new THREE.Vector3();

    for (let i = 0; i <= steps; i++) {
      const s = startS + i * stepDist;
      HighwaySpline.getPointAtDistance(s, p);
      HighwaySpline.getNormalAtDistance(s, normal);

      // --- ROAD SURFACE ---
      const roadL = p.clone().addScaledVector(normal, -halfRoad);
      const roadR = p.clone().addScaledVector(normal, halfRoad);

      roadVerts.push(roadL.x, roadL.y, roadL.z);
      roadNorms.push(0, 1, 0);
      roadUvs.push(0, s * 0.08);

      roadVerts.push(roadR.x, roadR.y, roadR.z);
      roadNorms.push(0, 1, 0);
      roadUvs.push(1, s * 0.08);

      if (i < steps) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        roadIndices.push(row1, row1 + 1, row2);
        roadIndices.push(row1 + 1, row2 + 1, row2);
        roadIndices.push(row1, row2, row1 + 1);
        roadIndices.push(row1 + 1, row2, row2 + 1);
      }

      // --- COUNTRYSIDE TERRAIN MESH RIBBONS ---
      const tFarL = p.clone().addScaledVector(normal, -170);
      tFarL.y -= 7.0 + Math.sin(s * 0.015) * 4.0;
      const tNearL = roadL.clone();
      tNearL.y -= 0.12;

      const tNearR = roadR.clone();
      tNearR.y -= 0.12;
      const tFarR = p.clone().addScaledVector(normal, 170);
      tFarR.y -= 7.0 + Math.cos(s * 0.015) * 4.0;

      const tBase = i * 4;
      terrainVerts.push(tFarL.x, tFarL.y, tFarL.z);
      terrainVerts.push(tNearL.x, tNearL.y, tNearL.z);
      terrainVerts.push(tNearR.x, tNearR.y, tNearR.z);
      terrainVerts.push(tFarR.x, tFarR.y, tFarR.z);
      terrainNorms.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

      if (i < steps) {
        const nextBase = (i + 1) * 4;
        terrainIndices.push(tBase, tBase + 1, nextBase);
        terrainIndices.push(tBase + 1, nextBase + 1, nextBase);
        terrainIndices.push(tBase + 2, tBase + 3, nextBase + 2);
        terrainIndices.push(tBase + 3, nextBase + 3, nextBase + 2);
      }

      // --- HIGHWAY LANES & MARKINGS GENERATION ---
      if (i < steps) {
        const sNext = s + stepDist;
        HighwaySpline.getPointAtDistance(sNext, pNext);
        HighwaySpline.getNormalAtDistance(sNext, normalNext);

        // 1. Inner Left Median Line (Solid Vibrant Highway Yellow)
        const leftShoulderOffset = -halfRoad + 1.2;
        const yellowWidth = 0.26;
        addMarkingQuad(
          p.clone().addScaledVector(normal, leftShoulderOffset - yellowWidth * 0.5),
          p.clone().addScaledVector(normal, leftShoulderOffset + yellowWidth * 0.5),
          pNext.clone().addScaledVector(normalNext, leftShoulderOffset - yellowWidth * 0.5),
          pNext.clone().addScaledVector(normalNext, leftShoulderOffset + yellowWidth * 0.5),
          1.0, 0.82, 0.1 // Vibrant amber-yellow
        );

        // 2. Outer Right Shoulder Line (Solid Crisp White)
        const rightShoulderOffset = halfRoad - 1.2;
        const whiteLineWidth = 0.26;
        addMarkingQuad(
          p.clone().addScaledVector(normal, rightShoulderOffset - whiteLineWidth * 0.5),
          p.clone().addScaledVector(normal, rightShoulderOffset + whiteLineWidth * 0.5),
          pNext.clone().addScaledVector(normalNext, rightShoulderOffset - whiteLineWidth * 0.5),
          pNext.clone().addScaledVector(normalNext, rightShoulderOffset + whiteLineWidth * 0.5),
          1.0, 1.0, 1.0 // Pure reflective white
        );

        // 3. Three Dashed Lane Dividers (Lane 3 | Lane 2 | Lane 1 | Lane 0)
        // Standard highway dash cycle: 4.5m dash, 5.5m gap (10m cycle)
        const midS = (s + sNext) * 0.5;
        const isDashPainted = (midS % 10.0) < 4.5;

        if (isDashPainted) {
          const dashWidth = 0.22;
          const laneDividers = [
            -HighwaySpline.LANE_WIDTH, // between lane 3 & 2
            0.0,                        // center divider between lane 2 & 1
            HighwaySpline.LANE_WIDTH,  // between lane 1 & 0
          ];

          laneDividers.forEach((divOffset) => {
            addMarkingQuad(
              p.clone().addScaledVector(normal, divOffset - dashWidth * 0.5),
              p.clone().addScaledVector(normal, divOffset + dashWidth * 0.5),
              pNext.clone().addScaledVector(normalNext, divOffset - dashWidth * 0.5),
              pNext.clone().addScaledVector(normalNext, divOffset + dashWidth * 0.5),
              1.0, 1.0, 1.0 // Pure reflective white
            );
          });
        }

        // 4. Guardrails along left and right highway shoulders
        addGuardrailSegment(p, normal, pNext, normalNext, -1);
        addGuardrailSegment(p, normal, pNext, normalNext, 1);
      }
    }

    // Remove old meshes
    if (this.roadMesh) this.roadGroup.remove(this.roadMesh);
    if (this.terrainMesh) this.roadGroup.remove(this.terrainMesh);
    if (this.roadMarkingsMesh) this.roadGroup.remove(this.roadMarkingsMesh);
    if (this.guardrailsMesh) this.roadGroup.remove(this.guardrailsMesh);

    // Build Road Tarmac Mesh
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);

    const isWet = this.weather === 'rain';
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x22242a, // Rich highway dark tarmac
      roughness: isWet ? 0.22 : 0.68,
      metalness: isWet ? 0.4 : 0.08,
      side: THREE.DoubleSide,
    });
    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.receiveShadow = true;
    this.roadGroup.add(this.roadMesh);

    // Build Landscape Terrain Mesh
    const terrainGeo = new THREE.BufferGeometry();
    terrainGeo.setAttribute('position', new THREE.Float32BufferAttribute(terrainVerts, 3));
    terrainGeo.setAttribute('normal', new THREE.Float32BufferAttribute(terrainNorms, 3));
    terrainGeo.setIndex(terrainIndices);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Vibrant countryside green
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.roadGroup.add(this.terrainMesh);

    // Build Visible Lane Markings Mesh
    if (markVerts.length > 0) {
      const markGeo = new THREE.BufferGeometry();
      markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markVerts, 3));
      markGeo.setAttribute('color', new THREE.Float32BufferAttribute(markColors, 3));
      markGeo.setIndex(markIndices);

      const markMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
      });
      this.roadMarkingsMesh = new THREE.Mesh(markGeo, markMat);
      this.roadGroup.add(this.roadMarkingsMesh);
    }

    // Build Guardrails Mesh
    if (guardVerts.length > 0) {
      const guardGeo = new THREE.BufferGeometry();
      guardGeo.setAttribute('position', new THREE.Float32BufferAttribute(guardVerts, 3));
      guardGeo.setIndex(guardIndices);

      const guardMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8, // Galvanized metal
        roughness: 0.35,
        metalness: 0.85,
        side: THREE.DoubleSide,
      });
      this.guardrailsMesh = new THREE.Mesh(guardGeo, guardMat);
      this.roadGroup.add(this.guardrailsMesh);
    }
  }

  /**
   * Spawn Roadside scenery (Streetlights, highway sign gantries, trees, distant rolling hills)
   */
  private spawnRoadsideScenery(centerDist: number) {
    this.sceneryGroup.clear();
    this.streetLightsGroup.clear();
    this.sceneryEntities = [];

    const startS = centerDist - 60;
    const endS = centerDist + 450;
    const halfRoad = HighwaySpline.TOTAL_ROAD_WIDTH * 0.5;

    // 1. Street Lamp Posts every 50 meters
    const lampPostGeo = new THREE.CylinderGeometry(0.12, 0.15, 8.5, 8);
    const lampArmGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    lampArmGeo.rotateZ(Math.PI / 2);
    const lampHeadGeo = new THREE.BoxGeometry(0.6, 0.2, 0.4);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.4, metalness: 0.8 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });

    for (let s = Math.floor(startS / 50) * 50; s < endS; s += 50) {
      const p = HighwaySpline.getPointAtDistance(s);
      const normal = HighwaySpline.getNormalAtDistance(s);

      [-1, 1].forEach((side) => {
        const lampGroup = new THREE.Group();
        const pos = p.clone().addScaledVector(normal, side * (halfRoad + 2.0));
        lampGroup.position.copy(pos);

        const pole = new THREE.Mesh(lampPostGeo, metalMat);
        pole.position.y = 4.25;
        lampGroup.add(pole);

        const arm = new THREE.Mesh(lampArmGeo, metalMat);
        arm.position.set(-side * 1.4, 8.2, 0);
        lampGroup.add(arm);

        const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
        head.position.set(-side * 2.8, 8.0, 0);
        lampGroup.add(head);

        if (this.timeOfDay === 'night' || this.timeOfDay === 'sunset') {
          const streetLight = new THREE.SpotLight(0xfef3c7, 1.8, 45, Math.PI / 3.5, 0.6, 1.5);
          streetLight.position.set(-side * 2.8, 8.0, 0);
          streetLight.target.position.set(-side * 2.8, 0, 0);
          lampGroup.add(streetLight);
          lampGroup.add(streetLight.target);
        }

        this.streetLightsGroup.add(lampGroup);
        this.sceneryEntities.push({ mesh: lampGroup, distance: s });
      });
    }

    // 2. Overhead Highway Sign Gantries every ~350m
    const gantryGeo = new THREE.BoxGeometry(HighwaySpline.TOTAL_ROAD_WIDTH + 4, 0.8, 0.4);
    const signBoardGeo = new THREE.BoxGeometry(6.5, 2.2, 0.15);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 }); // Highway Green

    for (let s = Math.floor(startS / 350) * 350; s < endS; s += 350) {
      const p = HighwaySpline.getPointAtDistance(s);
      const normal = HighwaySpline.getNormalAtDistance(s);
      const tangent = HighwaySpline.getTangentAtDistance(s);

      const gantryGroup = new THREE.Group();
      gantryGroup.position.copy(p);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      gantryGroup.quaternion.copy(quat);

      const bar = new THREE.Mesh(gantryGeo, metalMat);
      bar.position.set(0, 8.5, 0);
      gantryGroup.add(bar);

      const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8.5), metalMat);
      pillarL.position.set(-halfRoad - 1.5, 4.25, 0);
      const pillarR = pillarL.clone();
      pillarR.position.x = halfRoad + 1.5;
      gantryGroup.add(pillarL, pillarR);

      const signL = new THREE.Mesh(signBoardGeo, signBoardMat);
      signL.position.set(-4.0, 8.5, 0.25);
      const signR = new THREE.Mesh(signBoardGeo, signBoardMat);
      signR.position.set(4.0, 8.5, 0.25);
      gantryGroup.add(signL, signR);

      this.sceneryGroup.add(gantryGroup);
      this.sceneryEntities.push({ mesh: gantryGroup, distance: s });
    }

    // 3. Mountains in background & Roadside Trees
    const mountainGeo = new THREE.ConeGeometry(90, 95, 6);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.95,
      metalness: 0.0,
    });

    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 4.0, 6);
    const treeLeavesGeo = new THREE.ConeGeometry(3.2, 6.8, 6);
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.85,
      metalness: 0.0,
    });
    const treeLeavesMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.65,
      metalness: 0.0,
    });
    const treeLeavesMatAlt = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.65,
      metalness: 0.0,
    });

    for (let s = startS; s < endS; s += 32) {
      const p = HighwaySpline.getPointAtDistance(s);
      const normal = HighwaySpline.getNormalAtDistance(s);

      [-1, 1].forEach((side, sideIdx) => {
        const tree = new THREE.Group();
        const treePos = p.clone().addScaledVector(normal, side * (halfRoad + 6 + Math.random() * 12));
        treePos.y -= 0.2;
        tree.position.copy(treePos);

        const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
        trunk.position.y = 2.0;
        tree.add(trunk);

        const leavesMat = (Math.floor(s) + sideIdx) % 2 === 0 ? treeLeavesMat : treeLeavesMatAlt;
        const leaves = new THREE.Mesh(treeLeavesGeo, leavesMat);
        leaves.position.y = 6.0;
        tree.add(leaves);

        this.sceneryGroup.add(tree);
      });

      if (Math.floor(s) % 140 === 0) {
        const mountain = new THREE.Mesh(mountainGeo, mountainMat);
        const mPos = p.clone().addScaledVector(normal, (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 50));
        mPos.y -= 25;
        mountain.position.copy(mPos);
        this.sceneryGroup.add(mountain);
      }
    }
  }

  /**
   * Main Simulation Step - Realistic Vehicle Physics & In-Dash Cockpit Rendering
   */
  public update(delta: number) {
    if (delta > 0.1) delta = 0.1;

    // 1. Process Player Driving Inputs
    const isW = !!(this.keys['KeyW'] || this.keys['ArrowUp']);
    const isS = !!(this.keys['KeyS'] || this.keys['ArrowDown']);
    const isA = !!this.keys['KeyA'];
    const isD = !!this.keys['KeyD'];
    const isSpace = !!this.keys['Space'];
    const isShift = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    const isCar = this.vehicleType === 'car';
    const maxSpeed = isCar ? 160 : 195; // mph top speed
    const boostSpeed = isCar ? 205 : 240; // boost top speed
    const accelRate = isCar ? 34 : 48; // mph/s acceleration

    // Throttle & Brake
    this.physics.throttle = isW ? 1 : 0;
    this.physics.brake = isSpace ? 1 : isS ? 0.65 : 0;

    // Boost logic
    if (isShift && this.physics.boostFuel > 0 && isW) {
      this.physics.isBoosting = true;
      this.physics.boostFuel = Math.max(0, this.physics.boostFuel - delta * 25);
    } else {
      this.physics.isBoosting = false;
      this.physics.boostFuel = Math.min(100, this.physics.boostFuel + delta * 12);
    }

    // Speed calculation
    const currentMax = this.physics.isBoosting ? boostSpeed : maxSpeed;
    if (this.physics.throttle > 0) {
      const boostBonus = this.physics.isBoosting ? 2.2 : 1.0;
      this.physics.speed = Math.min(currentMax, this.physics.speed + accelRate * boostBonus * delta);
    } else if (this.physics.brake > 0) {
      const brakeForce = isSpace ? 85 : 42;
      this.physics.speed = Math.max(0, this.physics.speed - brakeForce * delta);
    } else {
      // Natural rolling aerodynamic drag
      this.physics.speed = Math.max(0, this.physics.speed - (8 + this.physics.speed * 0.04) * delta);
    }

    // --- 2. PHYSICALLY REALISTIC STEERING & LANE CHANGING ---
    const speedMps = this.physics.speed * 0.44704;

    // Speed-sensitive steering rack ratio:
    // At low speeds (20 mph), steering is responsive; at 120 mph, steering is smooth and stable
    const speedSensitivity = Math.max(0.28, Math.min(1.0, 48 / Math.max(15, this.physics.speed)));
    let targetSteer = 0;
    if (isA) targetSteer += 1.0; // steer left toward lower laneOffset
    if (isD) targetSteer -= 1.0; // steer right toward higher laneOffset

    // Dynamic steering rack turning with natural inertia
    const steerSpeed = 6.2;
    this.physics.steerAngle = THREE.MathUtils.lerp(this.physics.steerAngle, targetSteer * speedSensitivity, delta * steerSpeed);

    // 3D Steering wheel visual rotation in driver's hands (up to 240 degrees)
    const targetWheelAngle = this.physics.steerAngle * Math.PI * 1.35;
    this.physics.steeringWheelAngle = THREE.MathUtils.lerp(this.physics.steeringWheelAngle, targetWheelAngle, delta * 14);

    // Physical Lateral Force & Tire Cornering Grip:
    // Tires develop lateral acceleration proportional to steer angle and forward speed
    const maxLatVel = Math.min(speedMps * 0.4, 15.0);
    const targetLatVel = this.physics.steerAngle * maxLatVel;
    this.physics.lateralVelocity = THREE.MathUtils.lerp(this.physics.lateralVelocity, targetLatVel, delta * 7.5);

    // Integrate lane offset
    this.physics.laneOffset -= this.physics.lateralVelocity * delta;

    // Boundary clamping (guardrails at highway shoulder edges)
    const maxOffset = HighwaySpline.TOTAL_ROAD_WIDTH * 0.5 - 1.2;
    if (Math.abs(this.physics.laneOffset) > maxOffset) {
      this.physics.laneOffset = THREE.MathUtils.clamp(this.physics.laneOffset, -maxOffset, maxOffset);
      this.physics.lateralVelocity *= -0.25; // slight elastic bump off guardrail
      this.physics.speed = Math.max(0, this.physics.speed - 30 * delta);
    }

    // Realistic Chassis Suspension Roll & Pitch:
    // Centrifugal force rolls the car chassis outward into the turn
    // In a motorcycle, counter-steering leans the bike dramatically inward into the turn
    const targetRoll = isCar
      ? -this.physics.lateralVelocity * 0.038
      : this.physics.lateralVelocity * 0.16 * Math.min(1.0, speedMps / 12);
    this.physics.roll = THREE.MathUtils.lerp(this.physics.roll, targetRoll, delta * 10);

    // Chassis Pitch (Squat on acceleration, dive on braking)
    const targetPitch = (this.physics.brake * -0.04) + (this.physics.throttle * (this.physics.isBoosting ? 0.045 : 0.02));
    this.physics.pitch = THREE.MathUtils.lerp(this.physics.pitch, targetPitch, delta * 8);

    // Yaw heading alignment with road
    this.physics.yaw = (this.physics.lateralVelocity / Math.max(8, speedMps)) * 0.3;

    // RPM & Gear calculation
    const maxRpm = isCar ? 8000 : 13000;
    const idleRpm = isCar ? 900 : 1200;
    const gearRatios = isCar ? [30, 55, 85, 115, 145, 215] : [45, 75, 110, 145, 175, 245];
    let gear = 1;
    for (let g = 0; g < gearRatios.length; g++) {
      if (this.physics.speed <= gearRatios[g] || g === gearRatios.length - 1) {
        gear = g + 1;
        break;
      }
    }
    this.physics.gear = gear;

    const prevRatio = gear === 1 ? 0 : gearRatios[gear - 2];
    const nextRatio = gearRatios[gear - 1];
    const gearProgress = Math.min(1, Math.max(0, (this.physics.speed - prevRatio) / (nextRatio - prevRatio)));
    this.physics.rpm = idleRpm + gearProgress * (maxRpm - idleRpm) * (this.physics.throttle > 0 ? 1 : 0.8);

    // Odometer & Forward travel
    this.physics.highwayDistance += speedMps * delta;
    this.physics.odometerMiles += (this.physics.speed * delta) / 3600;

    // 3. Day-Night Auto Cycle
    if (this.autoTimeCycle) {
      this.timeCycleProgress = (this.timeCycleProgress + delta * 0.006) % 1;
      if (this.timeCycleProgress < 0.25) this.timeOfDay = 'night';
      else if (this.timeCycleProgress < 0.5) this.timeOfDay = 'dawn';
      else if (this.timeCycleProgress < 0.75) this.timeOfDay = 'day';
      else this.timeOfDay = 'sunset';
      this.updateEnvironmentLighting();
    }

    // 4. Update Engine Sounds
    soundEngine.update(
      this.physics.speed,
      this.physics.rpm,
      this.physics.throttle,
      this.physics.brake > 0.1,
      this.physics.isBoosting,
      this.physics.isDrifting,
      this.weather === 'rain'
    );

    // 5. Update Traffic AI Simulation
    const playerW = isCar ? 2.0 : 0.8;
    const playerL = isCar ? 4.6 : 2.2;
    this.trafficManager.update(
      delta,
      this.physics.highwayDistance,
      this.physics.laneOffset,
      this.physics.speed,
      playerW,
      playerL
    );

    // 6. Update Road & Scenery Chunks
    if (
      !this.roadMesh ||
      this.physics.highwayDistance > (this.roadMesh.userData.lastCenter || 0) + 120
    ) {
      this.rebuildRoadGeometry(this.physics.highwayDistance);
      if (this.roadMesh) this.roadMesh.userData.lastCenter = this.physics.highwayDistance;
      this.spawnRoadsideScenery(this.physics.highwayDistance);
    }

    // 7. Update Player Vehicle 3D Transform
    const playerPos = HighwaySpline.getPointWithOffset(this.physics.highwayDistance, this.physics.laneOffset);
    const tangent = HighwaySpline.getTangentAtDistance(this.physics.highwayDistance);

    this.physics.worldX = playerPos.x;
    this.physics.worldY = playerPos.y;
    this.physics.worldZ = playerPos.z;

    const vehicleQuat = new THREE.Quaternion();
    vehicleQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.physics.roll);
    vehicleQuat.multiply(rollQuat);

    // Pitch quat
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.physics.pitch);
    vehicleQuat.multiply(pitchQuat);

    // Update active player vehicle
    const activeExterior = isCar ? this.carExterior : this.motoExterior;
    const activeCockpit = isCar ? this.carCockpit : this.motoCockpit;

    activeExterior.root.position.copy(playerPos);
    activeExterior.root.quaternion.copy(vehicleQuat);

    activeCockpit.root.position.copy(playerPos);
    activeCockpit.root.quaternion.copy(vehicleQuat);

    // Wheel rotation & steering turning
    const wheelRotSpeed = speedMps * delta * 2.8;
    activeExterior.wheels.forEach((w, idx) => {
      // Front wheels steer with steering rack
      if (idx === 0 || idx === 1) {
        w.rotation.y = this.physics.steerAngle * 0.45;
      }
      w.rotation.x += wheelRotSpeed;
    });

    // Taillights activation on braking
    const isBraking = this.physics.brake > 0.1;
    activeExterior.taillights.forEach((tl) => {
      (tl.material as THREE.Material) = isBraking ? Vehicles3D.taillightOnMaterial : Vehicles3D.taillightOffMaterial;
    });

    // Blinker flash sync
    this.blinkerCycleTimer += delta;
    if (this.blinkerCycleTimer > 0.35) {
      this.blinkerCycleTimer = 0;
      this.blinkerFlashState = !this.blinkerFlashState;
      if (this.physics.leftBlinker || this.physics.rightBlinker) {
        soundEngine.playBlinkerClick(this.blinkerFlashState);
      }
    }

    const isBlinkingL = this.physics.leftBlinker && this.blinkerFlashState;
    const isBlinkingR = this.physics.rightBlinker && this.blinkerFlashState;

    activeExterior.leftBlinker.forEach((bl) => {
      (bl.material as THREE.Material) = isBlinkingL ? Vehicles3D.blinkerOnMaterial : Vehicles3D.blinkerOffMaterial;
    });
    activeExterior.rightBlinker.forEach((br) => {
      (br.material as THREE.Material) = isBlinkingR ? Vehicles3D.blinkerOnMaterial : Vehicles3D.blinkerOffMaterial;
    });

    // Exhaust flames during boost
    activeExterior.exhaustFlames.forEach((flame) => {
      const flameMat = flame.material as THREE.MeshBasicMaterial;
      flameMat.opacity = this.physics.isBoosting ? 0.95 : 0.0;
      if (this.physics.isBoosting) {
        flame.scale.set(1 + Math.random() * 0.4, 1 + Math.random() * 0.5, 1 + Math.random() * 0.4);
      }
    });

    // --- 8. UPDATE IN-DASH 3D COCKPIT SCREENS (Behind Wheel & Center Console) ---
    this.cockpitScreens.renderGaugeCluster(this.physics, this.blinkerFlashState, this.vehicleType);
    this.cockpitScreens.renderInfotainment(delta, this.physics.speed);

    // Car Cockpit Controls: Steering wheel rotation & Wipers
    if (isCar) {
      this.carCockpit.steeringWheel.rotation.z = this.physics.steeringWheelAngle;

      if (this.weather === 'rain') {
        this.wiperAngle += delta * 4.2 * this.wiperDirection;
        if (this.wiperAngle > Math.PI / 2.2) this.wiperDirection = -1;
        if (this.wiperAngle < 0) this.wiperDirection = 1;

        this.carCockpit.wiperLeft.rotation.z = -Math.PI / 3 + this.wiperAngle;
        this.carCockpit.wiperRight.rotation.z = -Math.PI / 3 + this.wiperAngle;
      }
    } else {
      this.motoCockpit.handlebars.rotation.y = -this.physics.steerAngle * 0.35;
    }

    // 9. Camera Positioning & Sunlight Tracking
    if (this.sunLight && this.sunLight.target) {
      this.sunLight.position.set(playerPos.x + 60, playerPos.y + 110, playerPos.z + 70);
      this.sunLight.target.position.copy(playerPos);
      this.sunLight.target.updateMatrixWorld();
    }

    if (this.cameraView === 'cockpit') {
      // Driver's POV (Eyes seated directly behind steering wheel & dashboard)
      // For car: x = -0.42 (driver seat), y = 0.58 (eye height), z = 0.05
      // Directly ahead is the steering wheel, behind it the meters, to the right Spotify!
      const eyeOffset = isCar
        ? new THREE.Vector3(-0.42, 0.58, 0.04)
        : new THREE.Vector3(0, 0.82, -0.05);

      eyeOffset.applyQuaternion(vehicleQuat);
      this.camera.position.copy(playerPos).add(eyeOffset);

      // Look forward along road heading
      const lookTarget = playerPos.clone().add(tangent.clone().multiplyScalar(45));
      lookTarget.y += isCar ? 0.58 : 0.82;
      this.camera.lookAt(lookTarget);

      // Match vehicle roll/bank
      this.camera.rotation.z += this.physics.roll * (isCar ? 0.3 : 0.85);

      // Dynamic FOV effect during Nitro Boost
      const targetFov = this.physics.isBoosting ? 78 : 65;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 5);
      this.camera.updateProjectionMatrix();
    } else {
      // 3rd Person Chase Camera
      const chaseDist = isCar ? 8.5 : 6.0;
      const chaseHeight = isCar ? 3.0 : 2.5;

      const behindPos = playerPos
        .clone()
        .sub(tangent.clone().multiplyScalar(chaseDist))
        .add(new THREE.Vector3(0, chaseHeight, 0));

      this.camera.position.lerp(behindPos, delta * 12);

      const lookTarget = playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)).add(tangent.clone().multiplyScalar(10));
      this.camera.lookAt(lookTarget);

      const targetFov = this.physics.isBoosting ? 82 : 65;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 5);
      this.camera.updateProjectionMatrix();
    }

    // 10. Rain Particles Follow Camera
    if (this.rainParticles && this.rainGeometry && this.weather === 'rain') {
      this.rainParticles.position.copy(this.camera.position);
      const posAttr = this.rainGeometry.getAttribute('position') as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      const rainSpeed = 26 * delta;

      for (let i = 0; i < array.length / 3; i++) {
        array[i * 3 + 1] -= rainSpeed;
        if (array[i * 3 + 1] < -5) {
          array[i * 3 + 1] = 20;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 11. Notify React HUD (every 2nd frame)
    if (this.onPhysicsUpdate) {
      this.onPhysicsUpdate({ ...this.physics });
    }
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (time: number) => {
      if (!this.isRunning) return;
      const delta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      this.update(delta);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

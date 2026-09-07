/**
 * Chaotic Roads - Main 3D Game Engine
 * Powered by Three.js
 */

import * as THREE from 'three';
import { CameraView, TimeOfDay, TrafficDensity, VehiclePhysicsState, VehicleType, WeatherType } from '../types';
import { HighwaySpline } from './HighwaySpline';
import { TrafficManager } from './TrafficManager';
import { Vehicles3D } from './Vehicles3D';
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

  // Road chunks
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

  // Vehicle Meshes
  private carExterior: ReturnType<typeof Vehicles3D.createPlayerCarMesh>;
  private carCockpit: ReturnType<typeof Vehicles3D.createPlayerCarCockpit>;
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
    laneOffset: HighwaySpline.getLaneOffset(1), // start in middle lane
    highwayDistance: 100,
    worldX: 0,
    worldY: 0,
    worldZ: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
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
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0018);

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
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.8);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 220;
    const d = 50;
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
      // Impact penalty
      this.physics.speed = Math.max(10, this.physics.speed * 0.4);
      this.physics.steerAngle += (Math.random() - 0.5) * 0.5;
    };

    // 7. Initialize Player Vehicle 3D Meshes
    this.carExterior = Vehicles3D.createPlayerCarMesh();
    this.carCockpit = Vehicles3D.createPlayerCarCockpit();
    this.motoExterior = Vehicles3D.createPlayerMotorcycleMesh();
    this.motoCockpit = Vehicles3D.createPlayerMotorcycleCockpit();

    this.scene.add(this.carExterior.root);
    this.scene.add(this.carCockpit.root);
    this.scene.add(this.motoExterior.root);
    this.scene.add(this.motoCockpit.root);

    // 8. Rain Particles
    this.setupRain();

    // 9. Initial Road & Environment build
    this.updateEnvironmentLighting();
    this.rebuildRoadGeometry(this.physics.highwayDistance);
    this.spawnRoadsideScenery(this.physics.highwayDistance);

    // 10. Event Listeners
    this.setupInputListeners();
    window.addEventListener('resize', this.onWindowResize);

    this.updateVehicleVisibility();
  }

  private setupRain() {
    const rainCount = 2800;
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
      // Sound engine init on first user gesture
      soundEngine.init();

      this.keys[e.code] = true;

      // Toggle Blinker controls
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

  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    this.updateEnvironmentLighting();
  }

  public setAutoTimeCycle(enabled: boolean) {
    this.autoTimeCycle = enabled;
  }

  private updateVehicleVisibility() {
    const isCar = this.vehicleType === 'car';
    const isCockpit = this.cameraView === 'cockpit';

    this.carExterior.root.visible = isCar && !isCockpit;
    this.carCockpit.root.visible = isCar && isCockpit;

    this.motoExterior.root.visible = !isCar && !isCockpit;
    this.motoCockpit.root.visible = !isCar && isCockpit;
  }

  private updateEnvironmentLighting() {
    const times: Record<TimeOfDay, { sky: number; fog: number; sun: number; intensity: number; ambient: number; hemi: number; sunPos: [number, number, number] }> = {
      dawn: {
        sky: 0xfb7185, // Morning rose
        fog: 0xfecdd3, // Soft sunrise mist
        sun: 0xfde047, // Golden yellow
        intensity: 1.4,
        ambient: 0.55,
        hemi: 0.65,
        sunPos: [80, 25, 100],
      },
      day: {
        sky: 0x60a5fa, // Crisp blue sky
        fog: 0xbae6fd, // Gentle horizon haze
        sun: 0xffedd5, // Bright warm sun
        intensity: 1.7,
        ambient: 0.7,
        hemi: 0.85,
        sunPos: [60, 90, 80],
      },
      sunset: {
        sky: 0xf97316, // Rich golden orange
        fog: 0xfed7aa, // Soft golden haze
        sun: 0xfbbf24, // Warm amber sunset
        intensity: 1.4,
        ambient: 0.6,
        hemi: 0.7,
        sunPos: [-80, 25, 120],
      },
      night: {
        sky: 0x090d16, // Midnight blue with moon
        fog: 0x0f172a,
        sun: 0x93c5fd, // Cool moonlight
        intensity: 0.5,
        ambient: 0.35,
        hemi: 0.4,
        sunPos: [20, 60, -20],
      },
    };

    const cfg = times[this.timeOfDay];
    let skyColor = cfg.sky;
    let fogDensity = 0.0018;

    if (this.weather === 'foggy') {
      fogDensity = 0.012;
      skyColor = 0x64748b;
    } else if (this.weather === 'rain') {
      fogDensity = 0.005;
      skyColor = 0x334155;
    } else if (this.weather === 'overcast') {
      skyColor = 0x64748b;
    }

    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(cfg.fog, fogDensity);

    this.sunLight.color.setHex(cfg.sun);
    this.sunLight.intensity = cfg.intensity;
    this.sunLight.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);

    this.ambientLight.intensity = cfg.ambient;
    if (this.hemiLight) {
      this.hemiLight.intensity = cfg.hemi;
    }

    // Headlight spotlights toggle
    const isNightOrFog = this.timeOfDay === 'night' || this.weather === 'foggy' || this.weather === 'rain';
    const lightsOn = this.physics.headlights || isNightOrFog;

    this.carExterior.headlightSpots.forEach((s) => (s.intensity = lightsOn ? 3.0 : 0));
    this.motoExterior.headlightSpots.forEach((s) => (s.intensity = lightsOn ? 3.0 : 0));
  }

  /**
   * Procedural Infinite Road and Landscape Mesh Generation
   */
  private rebuildRoadGeometry(centerDistance: number) {
    const roadLength = 550; // meters ahead and behind
    const startS = centerDistance - 90;
    const endS = centerDistance + roadLength;
    const step = 4.0; // resolution
    const steps = Math.floor((endS - startS) / step);

    const roadWidth = HighwaySpline.TOTAL_ROAD_WIDTH;
    const halfRoad = roadWidth * 0.5;

    // Road surface vertex buffer
    const roadVerts: number[] = [];
    const roadNorms: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    // Terrain ribbons (left and right landscapes)
    const terrainVerts: number[] = [];
    const terrainNorms: number[] = [];
    const terrainIndices: number[] = [];

    // Road markings vertex buffer
    const markVerts: number[] = [];
    const markIndices: number[] = [];

    const p = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const tempP = new THREE.Vector3();

    for (let i = 0; i <= steps; i++) {
      const s = startS + i * step;
      HighwaySpline.getPointAtDistance(s, p);
      HighwaySpline.getNormalAtDistance(s, normal);

      // --- ROAD SURFACE ---
      // Left edge of road
      tempP.copy(p).addScaledVector(normal, -halfRoad);
      roadVerts.push(tempP.x, tempP.y, tempP.z);
      roadNorms.push(0, 1, 0);
      roadUvs.push(0, s * 0.1);

      // Right edge of road
      tempP.copy(p).addScaledVector(normal, halfRoad);
      roadVerts.push(tempP.x, tempP.y, tempP.z);
      roadNorms.push(0, 1, 0);
      roadUvs.push(1, s * 0.1);

      if (i < steps) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        roadIndices.push(row1, row1 + 1, row2);
        roadIndices.push(row1 + 1, row2 + 1, row2);
        // Double-sided winding backup
        roadIndices.push(row1, row2, row1 + 1);
        roadIndices.push(row1 + 1, row2, row2 + 1);
      }

      // --- SCENIC TERRAIN MESH (Left and Right outward strips) ---
      // Left outer terrain (-160m to -halfRoad)
      const tFarL = p.clone().addScaledVector(normal, -170);
      tFarL.y -= 8.0 + Math.sin(s * 0.02) * 5.0;
      const tNearL = p.clone().addScaledVector(normal, -halfRoad);
      tNearL.y -= 0.1;

      // Right outer terrain (halfRoad to +160m)
      const tNearR = p.clone().addScaledVector(normal, halfRoad);
      tNearR.y -= 0.1;
      const tFarR = p.clone().addScaledVector(normal, 170);
      tFarR.y -= 8.0 + Math.cos(s * 0.02) * 5.0;

      const tBase = i * 4;
      terrainVerts.push(tFarL.x, tFarL.y, tFarL.z);
      terrainVerts.push(tNearL.x, tNearL.y, tNearL.z);
      terrainVerts.push(tNearR.x, tNearR.y, tNearR.z);
      terrainVerts.push(tFarR.x, tFarR.y, tFarR.z);

      terrainNorms.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

      if (i < steps) {
        const nextBase = (i + 1) * 4;
        // Left strip quads (tFarL -> tNearL)
        terrainIndices.push(tBase, tBase + 1, nextBase);
        terrainIndices.push(tBase + 1, nextBase + 1, nextBase);
        // Right strip quads (tNearR -> tFarR)
        terrainIndices.push(tBase + 2, tBase + 3, nextBase + 2);
        terrainIndices.push(tBase + 3, nextBase + 3, nextBase + 2);
      }

      // --- ROAD MARKINGS (Dashed lane dividers & Solid shoulder lines) ---
      const isDashed = Math.floor(s / 6) % 2 === 0;

      const addMarkingQuad = (offset: number, width: number) => {
        const pL = p.clone().addScaledVector(normal, offset - width * 0.5);
        const pR = p.clone().addScaledVector(normal, offset + width * 0.5);
        const startIdx = markVerts.length / 3;

        markVerts.push(pL.x, pL.y + 0.04, pL.z);
        markVerts.push(pR.x, pR.y + 0.04, pR.z);
        return startIdx;
      };

      // 3 dashed lane dividers
      if (isDashed) {
        [-HighwaySpline.LANE_WIDTH, 0, HighwaySpline.LANE_WIDTH].forEach((dividerOffset) => {
          addMarkingQuad(dividerOffset, 0.22);
        });
      }

      // 2 continuous solid shoulder lines
      addMarkingQuad(-halfRoad + 0.6, 0.25);
      addMarkingQuad(halfRoad - 0.6, 0.25);
    }

    // Connect markings quads
    const totalMarkVerts = markVerts.length / 3;
    for (let m = 0; m < totalMarkVerts - 2; m += 2) {
      markIndices.push(m, m + 1, m + 2);
      markIndices.push(m + 1, m + 3, m + 2);
      markIndices.push(m, m + 2, m + 1);
      markIndices.push(m + 1, m + 2, m + 3);
    }

    // Clean old meshes
    if (this.roadMesh) this.roadGroup.remove(this.roadMesh);
    if (this.terrainMesh) this.roadGroup.remove(this.terrainMesh);
    if (this.roadMarkingsMesh) this.roadGroup.remove(this.roadMarkingsMesh);

    // Build Road Mesh
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);

    const isWet = this.weather === 'rain';
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Rich highway tarmac asphalt
      roughness: isWet ? 0.25 : 0.7,
      metalness: isWet ? 0.35 : 0.05,
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
      color: 0x166534, // Lush meadow grass green
      roughness: 0.9,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.roadGroup.add(this.terrainMesh);

    // Build Markings Mesh
    if (markVerts.length > 0) {
      const markGeo = new THREE.BufferGeometry();
      markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markVerts, 3));
      markGeo.setIndex(markIndices);
      const markMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a, // Crisp highway reflective yellow/white
        side: THREE.DoubleSide,
      });
      this.roadMarkingsMesh = new THREE.Mesh(markGeo, markMat);
      this.roadGroup.add(this.roadMarkingsMesh);
    }
  }

  /**
   * Spawn Roadside scenery (Streetlights, highway sign gantries, guardrails, trees, distant mountains)
   */
  private spawnRoadsideScenery(centerDist: number) {
    this.sceneryGroup.clear();
    this.streetLightsGroup.clear();
    this.sceneryEntities = [];

    const startS = centerDist - 60;
    const endS = centerDist + 450;
    const halfRoad = HighwaySpline.TOTAL_ROAD_WIDTH * 0.5;

    // 1. Street Lamp Posts every 45 meters
    const lampPostGeo = new THREE.CylinderGeometry(0.12, 0.15, 8.5, 8);
    const lampArmGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    lampArmGeo.rotateZ(Math.PI / 2);
    const lampHeadGeo = new THREE.BoxGeometry(0.6, 0.2, 0.4);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.4, metalness: 0.8 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });

    for (let s = Math.floor(startS / 45) * 45; s < endS; s += 45) {
      const p = HighwaySpline.getPointAtDistance(s);
      const normal = HighwaySpline.getNormalAtDistance(s);

      // Place lamps on both left and right sides
      [-1, 1].forEach((side) => {
        const lampGroup = new THREE.Group();
        const pos = p.clone().addScaledVector(normal, side * (halfRoad + 2.0));
        lampGroup.position.copy(pos);

        // Vertical pole
        const pole = new THREE.Mesh(lampPostGeo, metalMat);
        pole.position.y = 4.25;
        lampGroup.add(pole);

        // Arm reaching over highway
        const arm = new THREE.Mesh(lampArmGeo, metalMat);
        arm.position.set(-side * 1.4, 8.2, 0);
        lampGroup.add(arm);

        // Glowing bulb fixture
        const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
        head.position.set(-side * 2.8, 8.0, 0);
        lampGroup.add(head);

        // Street light cone at night
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
      const tangent = HighwaySpline.getTangentAtDistance(s);

      const gantryGroup = new THREE.Group();
      gantryGroup.position.copy(p);
      gantryGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Crossbar
      const bar = new THREE.Mesh(gantryGeo, metalMat);
      bar.position.y = 8.5;
      gantryGroup.add(bar);

      // Support pillars
      const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8.5), metalMat);
      pillarL.position.set(-halfRoad - 1.5, 4.25, 0);
      const pillarR = pillarL.clone();
      pillarR.position.x = halfRoad + 1.5;
      gantryGroup.add(pillarL, pillarR);

      // Green Overhead Signs
      const signL = new THREE.Mesh(signBoardGeo, signBoardMat);
      signL.position.set(-4.0, 8.5, 0.25);
      const signR = new THREE.Mesh(signBoardGeo, signBoardMat);
      signR.position.set(4.0, 8.5, 0.25);
      gantryGroup.add(signL, signR);

      this.sceneryGroup.add(gantryGroup);
      this.sceneryEntities.push({ mesh: gantryGroup, distance: s });
    }

    // 3. Mountains in background & Roadside Trees
    const mountainGeo = new THREE.ConeGeometry(85, 90, 6);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Blue-grey mountain slate
      roughness: 0.95,
      metalness: 0.0,
    });

    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 4.0, 6);
    const treeLeavesGeo = new THREE.ConeGeometry(3.0, 6.5, 6);
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Warm rich bark brown
      roughness: 0.85,
      metalness: 0.0,
    });
    const treeLeavesMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a, // Fresh vibrant forest green
      roughness: 0.65,
      metalness: 0.0,
    });
    const treeLeavesMatAlt = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Lighter green highlight
      roughness: 0.65,
      metalness: 0.0,
    });

    for (let s = startS; s < endS; s += 32) {
      const p = HighwaySpline.getPointAtDistance(s);
      const normal = HighwaySpline.getNormalAtDistance(s);

      // Trees along shoulder
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

      // Distant rolling mountain every ~140m
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
   * Main Simulation Step
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
    const maxSpeed = isCar ? 155 : 190; // mph top speed
    const boostSpeed = isCar ? 195 : 230; // boost top speed
    const accelRate = isCar ? 32 : 46; // mph/s acceleration

    // Throttle & Brake
    this.physics.throttle = isW ? 1 : 0;
    this.physics.brake = isSpace ? 1 : isS ? 0.6 : 0;

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
      const brakeForce = isSpace ? 80 : 38;
      this.physics.speed = Math.max(0, this.physics.speed - brakeForce * delta);
    } else {
      // Natural rolling drag
      this.physics.speed = Math.max(0, this.physics.speed - 12 * delta);
    }

    // Steering & Lane Offset
    const steerSpeed = 2.4;
    let targetSteer = 0;
    if (isA) targetSteer -= 1;
    if (isD) targetSteer += 1;

    this.physics.steerAngle = THREE.MathUtils.lerp(this.physics.steerAngle, targetSteer, delta * 8);

    // Lateral movement across highway
    const lateralSpeed = this.physics.steerAngle * (this.physics.speed / 50) * 8.5;
    this.physics.laneOffset -= lateralSpeed * delta;

    // Highway boundaries (shoulder limit)
    const maxOffset = HighwaySpline.TOTAL_ROAD_WIDTH * 0.5 - 1.2;
    this.physics.laneOffset = THREE.MathUtils.clamp(this.physics.laneOffset, -maxOffset, maxOffset);

    // RPM & Gear calculation
    const maxRpm = isCar ? 8000 : 13000;
    const idleRpm = isCar ? 900 : 1200;

    // 6-speed transmission simulation
    const gearRatios = isCar ? [30, 55, 85, 115, 145, 210] : [45, 75, 110, 145, 175, 240];
    let gear = 1;
    for (let g = 0; g < gearRatios.length; g++) {
      if (this.physics.speed <= gearRatios[g] || g === gearRatios.length - 1) {
        gear = g + 1;
        break;
      }
    }
    this.physics.gear = gear;

    // RPM calculation within current gear
    const prevRatio = gear === 1 ? 0 : gearRatios[gear - 2];
    const nextRatio = gearRatios[gear - 1];
    const gearProgress = Math.min(1, Math.max(0, (this.physics.speed - prevRatio) / (nextRatio - prevRatio)));
    this.physics.rpm = idleRpm + gearProgress * (maxRpm - idleRpm) * (this.physics.throttle > 0 ? 1 : 0.8);

    // Odometer & Forward travel
    const speedMps = this.physics.speed * 0.44704;
    this.physics.highwayDistance += speedMps * delta;
    this.physics.odometerMiles += (this.physics.speed * delta) / 3600;

    // 2. Day-Night Auto Cycle
    if (this.autoTimeCycle) {
      this.timeCycleProgress = (this.timeCycleProgress + delta * 0.006) % 1;
      if (this.timeCycleProgress < 0.25) this.timeOfDay = 'night';
      else if (this.timeCycleProgress < 0.5) this.timeOfDay = 'dawn';
      else if (this.timeCycleProgress < 0.75) this.timeOfDay = 'day';
      else this.timeOfDay = 'sunset';
      this.updateEnvironmentLighting();
    }

    // 3. Dynamic Road Regeneration
    // If player traveled 80 meters since last road build, rebuild chunks ahead
    if (!this.lastRebuildDist || this.physics.highwayDistance - this.lastRebuildDist > 70) {
      this.lastRebuildDist = this.physics.highwayDistance;
      this.rebuildRoadGeometry(this.physics.highwayDistance);
      this.spawnRoadsideScenery(this.physics.highwayDistance);
    }

    // 4. Update AI Traffic
    const playerWidth = isCar ? 2.0 : 0.9;
    const playerLength = isCar ? 4.4 : 2.2;
    this.trafficManager.update(
      delta,
      this.physics.highwayDistance,
      this.physics.laneOffset,
      this.physics.speed,
      playerWidth,
      playerLength
    );

    // 5. Update Player Vehicle 3D Transform
    const playerPos = HighwaySpline.getPointWithOffset(this.physics.highwayDistance, this.physics.laneOffset);
    const tangent = HighwaySpline.getTangentAtDistance(this.physics.highwayDistance);

    this.physics.worldX = playerPos.x;
    this.physics.worldY = playerPos.y;
    this.physics.worldZ = playerPos.z;

    // Roll angle (leaning into turns for motorcycle, subtle chassis roll for car)
    const targetRoll = isCar
      ? -this.physics.steerAngle * 0.06
      : -this.physics.steerAngle * 0.48 * Math.min(1, this.physics.speed / 30);
    this.physics.roll = THREE.MathUtils.lerp(this.physics.roll, targetRoll, delta * 10);

    const vehicleQuat = new THREE.Quaternion();
    vehicleQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.physics.roll);
    vehicleQuat.multiply(rollQuat);

    // Update Player Car / Moto transform
    const activeExterior = isCar ? this.carExterior : this.motoExterior;
    const activeCockpit = isCar ? this.carCockpit : this.motoCockpit;

    activeExterior.root.position.copy(playerPos);
    activeExterior.root.quaternion.copy(vehicleQuat);

    activeCockpit.root.position.copy(playerPos);
    activeCockpit.root.quaternion.copy(vehicleQuat);

    // Wheel rotation
    const wheelRotSpeed = speedMps * delta * 2.8;
    activeExterior.wheels.forEach((w) => {
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

    // Nitro flames
    activeExterior.exhaustFlames.forEach((flame) => {
      (flame.material as THREE.MeshBasicMaterial).opacity = this.physics.isBoosting ? 0.95 : 0.0;
      if (this.physics.isBoosting) {
        flame.scale.set(1 + Math.random() * 0.4, 1 + Math.random() * 0.6, 1);
      }
    });

    // Cockpit Steering Wheel / Handlebars movement
    if (isCar) {
      this.carCockpit.steeringWheel.rotation.z = -this.physics.steerAngle * 1.8;

      // Wipers animation in rain
      if (this.weather === 'rain') {
        this.wiperAngle += delta * 5.0 * this.wiperDirection;
        if (this.wiperAngle > 1.2) this.wiperDirection = -1;
        if (this.wiperAngle < -0.2) this.wiperDirection = 1;

        this.carCockpit.wiperLeft.rotation.z = -Math.PI / 3 + this.wiperAngle;
        this.carCockpit.wiperRight.rotation.z = -Math.PI / 3 + this.wiperAngle;
      }
    } else {
      this.motoCockpit.handlebars.rotation.y = -this.physics.steerAngle * 0.4;
    }

    // 6. Camera Positioning & Sunlight Tracking
    if (this.sunLight && this.sunLight.target) {
      this.sunLight.position.set(playerPos.x + 60, playerPos.y + 110, playerPos.z + 70);
      this.sunLight.target.position.copy(playerPos);
      this.sunLight.target.updateMatrixWorld();
    }

    if (this.cameraView === 'cockpit') {
      // Driver cockpit seat position
      const eyeOffset = isCar ? new THREE.Vector3(-0.42, 0.62, 0.05) : new THREE.Vector3(0, 0.85, -0.15);
      eyeOffset.applyQuaternion(vehicleQuat);
      this.camera.position.copy(playerPos).add(eyeOffset);

      // Look forward along road heading
      const lookTarget = playerPos.clone().add(tangent.clone().multiplyScalar(40));
      lookTarget.y += isCar ? 0.62 : 0.85;
      this.camera.lookAt(lookTarget);

      // Match vehicle roll/bank
      this.camera.rotation.z += this.physics.roll * (isCar ? 0.3 : 0.85);

      // FOV effect during Nitro Boost
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

    // 7. Rain Particles Follow Camera
    if (this.rainParticles && this.rainGeometry && this.weather === 'rain') {
      this.rainParticles.position.copy(this.camera.position);
      const posAttr = this.rainGeometry.getAttribute('position') as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      const rainSpeed = 25 * delta;

      for (let i = 0; i < array.length / 3; i++) {
        array[i * 3 + 1] -= rainSpeed;
        if (array[i * 3 + 1] < -5) {
          array[i * 3 + 1] = 20 + Math.random() * 5;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 8. Sound Engine Update
    soundEngine.update(
      this.physics.speed,
      this.physics.rpm,
      this.physics.throttle,
      this.physics.brake > 0.2,
      this.physics.isBoosting,
      this.physics.isDrifting,
      this.weather === 'rain'
    );

    // 9. Notify React HUD
    if (this.onPhysicsUpdate) {
      this.onPhysicsUpdate({ ...this.physics });
    }

    // 10. Render
    this.renderer.render(this.scene, this.camera);
  }

  private lastRebuildDist: number = 0;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;
      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.update(delta);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

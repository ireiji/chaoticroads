/**
 * Vehicles3D.ts - Highly Realistic 3D Vehicle Models & Interior Cockpits for Three.js
 */

import * as THREE from 'three';
import { VehicleType } from '../types';
import { CockpitScreens } from './CockpitScreens';

export class Vehicles3D {
  // Shared materials for optimized rendering and realistic lighting
  public static tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
    metalness: 0.05,
  });

  public static rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.3,
    metalness: 0.8,
  });

  public static brakeDiscMaterial = new THREE.MeshStandardMaterial({
    color: 0x71717a,
    roughness: 0.25,
    metalness: 0.9,
  });

  public static caliperMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Red Brembo sport brake calipers
    roughness: 0.3,
    metalness: 0.2,
  });

  public static glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.28,
    roughness: 0.05,
    metalness: 0.1,
    depthWrite: false,
  });

  public static chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.15,
    metalness: 0.95,
  });

  public static darkLeather = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.05,
  });

  public static dashPlastic = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.75,
    metalness: 0.1,
  });

  public static aluminumTrim = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.25,
    metalness: 0.85,
  });

  public static headlightOnMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  public static taillightOffMaterial = new THREE.MeshStandardMaterial({
    color: 0x450a0a,
    roughness: 0.4,
    metalness: 0.1,
  });

  public static taillightOnMaterial = new THREE.MeshBasicMaterial({
    color: 0xff002e,
  });

  public static blinkerOffMaterial = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.4,
    metalness: 0.1,
  });

  public static blinkerOnMaterial = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
  });

  /**
   * Helper to create a realistic wheel with rim, spoke, brake disc & caliper
   */
  private static createWheel(radius: number, width: number, isBike = false): THREE.Group {
    const wheelGroup = new THREE.Group();

    // Tire outer cylinder
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, this.tireMaterial);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimRadius = radius * (isBike ? 0.82 : 0.72);
    const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, width * 1.01, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, this.rimMaterial);
    wheelGroup.add(rim);

    // Spokes
    const spokeCount = isBike ? 6 : 5;
    const spokeGeo = new THREE.BoxGeometry(width * 0.95, rimRadius * 1.9, rimRadius * 0.12);
    for (let s = 0; s < spokeCount; s++) {
      const spoke = new THREE.Mesh(spokeGeo, this.rimMaterial);
      spoke.rotation.x = (Math.PI / spokeCount) * s;
      wheelGroup.add(spoke);
    }

    // Center hub
    const hubGeo = new THREE.CylinderGeometry(rimRadius * 0.28, rimRadius * 0.28, width * 1.05, 12);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, this.chromeMaterial);
    wheelGroup.add(hub);

    // Brake Disc
    const discGeo = new THREE.CylinderGeometry(rimRadius * 0.75, rimRadius * 0.75, width * 0.2, 16);
    discGeo.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, this.brakeDiscMaterial);
    wheelGroup.add(disc);

    // Red Brake Caliper
    const caliperGeo = new THREE.BoxGeometry(width * 0.35, rimRadius * 0.45, rimRadius * 0.35);
    const caliper = new THREE.Mesh(caliperGeo, this.caliperMaterial);
    caliper.position.set(0, rimRadius * 0.55, 0);
    wheelGroup.add(caliper);

    return wheelGroup;
  }

  /**
   * Create 3D Exterior Mesh for Player Car (Sports Coupe)
   */
  public static createPlayerCarMesh(): {
    root: THREE.Group;
    wheels: THREE.Group[];
    taillights: THREE.Mesh[];
    leftBlinker: THREE.Mesh[];
    rightBlinker: THREE.Mesh[];
    headlightSpots: THREE.SpotLight[];
    exhaustFlames: THREE.Mesh[];
  } {
    const root = new THREE.Group();
    const wheels: THREE.Group[] = [];
    const taillights: THREE.Mesh[] = [];
    const leftBlinker: THREE.Mesh[] = [];
    const rightBlinker: THREE.Mesh[] = [];
    const headlightSpots: THREE.SpotLight[] = [];
    const exhaustFlames: THREE.Mesh[] = [];

    // Metallic Electric Blue Paint
    const paintMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.25,
      metalness: 0.65,
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.3,
    });

    // 1. Lower Chassis
    const lowerBodyGeo = new THREE.BoxGeometry(2.0, 0.55, 4.6);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, paintMaterial);
    lowerBody.position.y = 0.55;
    lowerBody.castShadow = true;
    root.add(lowerBody);

    // Front Sloping Hood
    const hoodGeo = new THREE.BoxGeometry(1.85, 0.25, 1.5);
    const hood = new THREE.Mesh(hoodGeo, paintMaterial);
    hood.position.set(0, 0.75, 1.25);
    hood.rotation.x = -0.12;
    root.add(hood);

    // Front Lower Splitter
    const splitterGeo = new THREE.BoxGeometry(2.05, 0.08, 0.6);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(0, 0.25, 2.2);
    root.add(splitter);

    // Front Grille
    const grilleGeo = new THREE.BoxGeometry(1.4, 0.28, 0.05);
    const grille = new THREE.Mesh(grilleGeo, this.dashPlastic);
    grille.position.set(0, 0.42, 2.31);
    root.add(grille);

    // 2. Cabin & Roof (Greenhouse)
    const cabinGeo = new THREE.BoxGeometry(1.58, 0.58, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, paintMaterial);
    cabin.position.set(0, 1.05, -0.3);
    root.add(cabin);

    // Cabin Windows Glass
    const glassGeo = new THREE.BoxGeometry(1.56, 0.55, 2.15);
    const glassMesh = new THREE.Mesh(glassGeo, this.glassMaterial);
    glassMesh.position.set(0, 1.05, -0.3);
    root.add(glassMesh);

    // Rear Spoiler
    const wingGeo = new THREE.BoxGeometry(1.8, 0.06, 0.35);
    const wing = new THREE.Mesh(wingGeo, carbonMaterial);
    wing.position.set(0, 1.1, -2.15);
    root.add(wing);

    const wingPostL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.12), carbonMaterial);
    wingPostL.position.set(-0.6, 0.98, -2.15);
    const wingPostR = wingPostL.clone();
    wingPostR.position.x = 0.6;
    root.add(wingPostL, wingPostR);

    // Rear Aerodynamic Diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.85, 0.22, 0.4);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuser.position.set(0, 0.35, -2.25);
    root.add(diffuser);

    // Quad Stainless Steel Exhaust Tips
    [-0.65, -0.45, 0.45, 0.65].forEach((x) => {
      const tipGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.25, 12);
      tipGeo.rotateX(Math.PI / 2);
      const tip = new THREE.Mesh(tipGeo, this.chromeMaterial);
      tip.position.set(x, 0.32, -2.35);
      root.add(tip);
    });

    // Nitro boost blue flames
    [-0.55, 0.55].forEach((x) => {
      const flameGeo = new THREE.ConeGeometry(0.12, 0.8, 8);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 0.32, -2.75);
      root.add(flame);
      exhaustFlames.push(flame);
    });

    // 3. LED Projector Headlights
    [-0.72, 0.72].forEach((x) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.08), this.headlightOnMaterial);
      hl.position.set(x, 0.62, 2.29);
      root.add(hl);

      const spot = new THREE.SpotLight(0xffffff, 3.5, 90, Math.PI / 5, 0.4, 1.2);
      spot.position.set(x, 0.62, 2.3);
      spot.target.position.set(x, 0.2, 50);
      root.add(spot);
      root.add(spot.target);
      headlightSpots.push(spot);
    });

    // 4. Rear Full-Width LED Lightbar Taillights
    const tlBar = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 0.06), this.taillightOffMaterial);
    tlBar.position.set(0, 0.78, -2.31);
    root.add(tlBar);
    taillights.push(tlBar);

    [-0.75, 0.75].forEach((x) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.06), this.taillightOffMaterial);
      tl.position.set(x, 0.78, -2.31);
      root.add(tl);
      taillights.push(tl);
    });

    // Blinkers (front & rear)
    const blF = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.06), this.blinkerOffMaterial);
    blF.position.set(-0.95, 0.62, 2.24);
    const blR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.06), this.blinkerOffMaterial);
    blR.position.set(-0.95, 0.78, -2.31);
    root.add(blF, blR);
    leftBlinker.push(blF, blR);

    const brF = blF.clone();
    brF.position.x = 0.95;
    const brR = blR.clone();
    brR.position.x = 0.95;
    root.add(brF, brR);
    rightBlinker.push(brF, brR);

    // 5. 4 Wheels (Sport Rims with Brake Calipers)
    const wheelY = 0.38;
    const wheelRadius = 0.38;
    const wheelWidth = 0.28;

    [-1.02, 1.02].forEach((x) => {
      [1.4, -1.4].forEach((z) => {
        const wheel = this.createWheel(wheelRadius, wheelWidth);
        wheel.position.set(x, wheelY, z);
        root.add(wheel);
        wheels.push(wheel);
      });
    });

    return { root, wheels, taillights, leftBlinker, rightBlinker, headlightSpots, exhaustFlames };
  }

  /**
   * Create Highly Realistic Driver Cockpit Interior for Car
   * WITH Functional In-Dash Gauge Cluster & In-Dash Spotify Infotainment Screen
   */
  public static createCarCockpit(cockpitScreens: CockpitScreens): {
    root: THREE.Group;
    steeringWheel: THREE.Group;
    wiperLeft: THREE.Mesh;
    wiperRight: THREE.Mesh;
    rearMirror: THREE.Mesh;
  } {
    const root = new THREE.Group();

    // Slow Roads aesthetic materials (Matte dark slate, clean pearl white, dark pillar trims)
    const srDashMat = new THREE.MeshStandardMaterial({ color: 0x2e3335, roughness: 0.88, metalness: 0.12 });
    const srCowlMat = new THREE.MeshStandardMaterial({ color: 0x24282a, roughness: 0.85, metalness: 0.15 });
    const srHoodMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.45 });
    const srPillarMat = new THREE.MeshStandardMaterial({ color: 0x1f2324, roughness: 0.92 });
    const srTrimMat = new THREE.MeshStandardMaterial({ color: 0x1c1f20, roughness: 0.9 });
    const srWheelMat = new THREE.MeshStandardMaterial({ color: 0x25292a, roughness: 0.8, metalness: 0.18 });

    // 1. EXTERIOR CAR HOOD (Clearly visible through windshield in IMG_7411.png)
    // Slopes forward from windshield cowl (z = 0.78) to front bumper (z = 2.45)
    const hoodGroup = new THREE.Group();

    // Main center hood plane (pearl white sports car finish)
    const hoodCenterGeo = new THREE.BoxGeometry(1.64, 0.04, 1.72);
    const hoodCenter = new THREE.Mesh(hoodCenterGeo, srHoodMat);
    hoodCenter.position.set(0, 0.40, 1.62);
    hoodCenter.rotation.x = 0.052; // Gentle aerodynamic slope down into the road
    hoodGroup.add(hoodCenter);

    // Left and Right raised fender shoulders (sports car hood contours framing road)
    const fenderLGeo = new THREE.BoxGeometry(0.24, 0.08, 1.72);
    const fenderL = new THREE.Mesh(fenderLGeo, srHoodMat);
    fenderL.position.set(-0.84, 0.42, 1.62);
    fenderL.rotation.x = 0.052;
    fenderL.rotation.z = -0.06;
    hoodGroup.add(fenderL);

    const fenderR = fenderL.clone();
    fenderR.position.x = 0.84;
    fenderR.rotation.z = 0.06;
    hoodGroup.add(fenderR);

    // Windshield base cowl vent grille (black recessed strip)
    const cowlGrille = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.03, 0.14), srTrimMat);
    cowlGrille.position.set(0, 0.45, 0.80);
    hoodGroup.add(cowlGrille);

    root.add(hoodGroup);

    // 2. SCULPTED SLOW ROADS DASHBOARD (Matte dark slate, clean minimalist profile)
    // Main dashboard structure spanning across car
    const mainDashGeo = new THREE.BoxGeometry(1.98, 0.44, 0.74);
    const mainDash = new THREE.Mesh(mainDashGeo, srDashMat);
    mainDash.position.set(0, 0.22, 0.62);
    root.add(mainDash);

    // Sculpted soft-touch dashboard top pad
    const dashPadGeo = new THREE.BoxGeometry(1.96, 0.05, 0.72);
    const dashPad = new THREE.Mesh(dashPadGeo, srDashMat);
    dashPad.position.set(0, 0.44, 0.62);
    root.add(dashPad);

    // Subtle horizontal ambient seam line
    const seamLine = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.015, 0.02), srTrimMat);
    seamLine.position.set(0, 0.28, 0.28);
    root.add(seamLine);

    // 3. DRIVER'S INSTRUMENT BINNACLE COWL (Arching over gauge display at x = 0.38)
    // In IMG_7411.png, the cowl rises gracefully directly in front of the driver
    const driverCowlGeo = new THREE.BoxGeometry(0.56, 0.24, 0.36);
    const driverCowl = new THREE.Mesh(driverCowlGeo, srCowlMat);
    driverCowl.position.set(0.38, 0.46, 0.68);
    root.add(driverCowl);

    // Curved cowl visor brow framing top of display
    const cowlBrowGeo = new THREE.BoxGeometry(0.54, 0.035, 0.18);
    const cowlBrow = new THREE.Mesh(cowlBrowGeo, srCowlMat);
    cowlBrow.position.set(0.38, 0.55, 0.58);
    cowlBrow.rotation.x = -0.14;
    root.add(cowlBrow);

    // 4. DYNAMIC SLOW ROADS INSTRUMENT GAUGE SCREEN
    // Centered directly inside driver's cowl behind steering wheel
    const gaugeScreenGeo = new THREE.PlaneGeometry(0.46, 0.23);
    const gaugeScreen = new THREE.Mesh(gaugeScreenGeo, cockpitScreens.gaugeMaterial);
    gaugeScreen.position.set(0.38, 0.43, 0.68);
    gaugeScreen.rotation.x = -0.06; // tilted toward driver's eye
    root.add(gaugeScreen);

    // 5. SLOW ROADS 3-SPOKE STEERING WHEEL WITH "AUTODRIVE" HUB (IMG_7411.png)
    // Placed 54cm in front of driver eye (x = 0.38, y = 0.35, z = 0.42)
    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(0.38, 0.35, 0.42);
    steeringWheel.rotation.x = 0.16; // Natural steering column rake angle

    // Steering column shaft extending into dashboard
    const columnGeo = new THREE.CylinderGeometry(0.04, 0.046, 0.36, 16);
    columnGeo.rotateX(Math.PI / 2);
    const column = new THREE.Mesh(columnGeo, srTrimMat);
    column.position.set(0, 0, 0.18);
    steeringWheel.add(column);

    // Outer ergonomic steering wheel rim (Refined thin tube with open upper arch framing the cluster)
    const rimGeo = new THREE.TorusGeometry(0.185, 0.017, 16, 48);
    const rim = new THREE.Mesh(rimGeo, srWheelMat);
    steeringWheel.add(rim);

    // Center Hub Boss with "AUTODRIVE" Faceplate (matching IMG_7411.png)
    const hubGeo = new THREE.BoxGeometry(0.13, 0.075, 0.032);
    const hub = new THREE.Mesh(hubGeo, srCowlMat);
    steeringWheel.add(hub);

    // Dynamic "AUTODRIVE" text canvas faceplate
    const hubCanvas = document.createElement('canvas');
    hubCanvas.width = 256;
    hubCanvas.height = 128;
    const hubCtx = hubCanvas.getContext('2d')!;
    hubCtx.fillStyle = '#222527';
    hubCtx.fillRect(0, 0, 256, 128);
    hubCtx.strokeStyle = '#323739';
    hubCtx.lineWidth = 4;
    hubCtx.strokeRect(4, 4, 248, 120);
    hubCtx.font = 'bold 30px sans-serif';
    hubCtx.fillStyle = '#cbd5e1';
    hubCtx.textAlign = 'center';
    hubCtx.textBaseline = 'middle';
    hubCtx.letterSpacing = '3px';
    hubCtx.fillText('AUTODRIVE', 128, 64);

    const hubTexture = new THREE.CanvasTexture(hubCanvas);
    const hubFaceMat = new THREE.MeshBasicMaterial({ map: hubTexture });
    const hubFace = new THREE.Mesh(new THREE.PlaneGeometry(0.125, 0.068), hubFaceMat);
    hubFace.position.set(0, 0, 0.018);
    steeringWheel.add(hubFace);

    // Left and right horizontal spokes
    const spokeL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.028, 0.016), srWheelMat);
    spokeL.position.set(-0.10, 0, 0);
    const spokeR = spokeL.clone();
    spokeR.position.x = 0.10;
    steeringWheel.add(spokeL, spokeR);

    // Lower vertical spoke
    const spokeBottom = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.10, 0.016), srWheelMat);
    spokeBottom.position.set(0, -0.095, 0);
    steeringWheel.add(spokeBottom);

    root.add(steeringWheel);

    // 6. IN-DASH SPOTIFY INFOTAINMENT DISPLAY (Mounted in lower center dash)
    // Sits in lower center stack angled toward driver so it does NOT block the pristine windshield view
    const infoHousing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.27, 0.04), srTrimMat);
    infoHousing.position.set(-0.06, 0.18, 0.54);
    infoHousing.rotation.x = -0.42; // Tilted upward toward driver
    infoHousing.rotation.y = 0.12;  // Angled gently toward driver seat
    root.add(infoHousing);

    const infoScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.25), cockpitScreens.infotainmentMaterial);
    infoScreen.position.set(-0.06, 0.18, 0.52);
    infoScreen.rotation.x = -0.42;
    infoScreen.rotation.y = 0.12;
    root.add(infoScreen);

    // 7. WINDSHIELD, A-PILLARS & ROOF HEADER (Exact framing from IMG_7411.png)
    // Near Right A-Pillar (driver's side in Slow Roads layout)
    const pillarRGeo = new THREE.BoxGeometry(0.065, 1.18, 0.065);
    const pillarR = new THREE.Mesh(pillarRGeo, srPillarMat);
    pillarR.position.set(0.86, 0.66, 0.25);
    pillarR.rotation.z = 0.26;
    pillarR.rotation.x = -0.42;

    // Right side window frame & sill visible through right window
    const sillR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.95), srPillarMat);
    sillR.position.set(0.96, 0.44, 0.15);
    root.add(pillarR, sillR);

    // Right side triangular quarter-glass
    const sideGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      roughness: 0.02,
      transmission: 0.98,
      depthWrite: false,
    });
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.58), sideGlassMat);
    sideGlass.position.set(0.96, 0.62, 0.18);
    sideGlass.rotation.y = -Math.PI / 2;
    root.add(sideGlass);

    // Far Left A-Pillar
    const pillarL = new THREE.Mesh(pillarRGeo, srPillarMat);
    pillarL.position.set(-0.92, 0.66, 0.32);
    pillarL.rotation.z = -0.26;
    pillarL.rotation.x = -0.42;
    root.add(pillarL);

    // Top Roof Header / Headliner bar across top of windshield
    const roofHeaderGeo = new THREE.BoxGeometry(1.92, 0.08, 0.12);
    const roofHeader = new THREE.Mesh(roofHeaderGeo, srPillarMat);
    roofHeader.position.set(0, 0.98, 0.12);
    root.add(roofHeader);

    // Crystal clear windshield glass
    const windshieldMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.02,
      roughness: 0.02,
      transmission: 0.99,
      depthWrite: false,
    });
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 0.94), windshieldMat);
    windshield.position.set(0, 0.64, 0.48);
    windshield.rotation.x = -0.42;
    root.add(windshield);

    // Minimalist windshield wiper blades parked at cowl base
    const wiperMat = new THREE.MeshStandardMaterial({ color: 0x111314, roughness: 0.9 });
    const wiperGeo = new THREE.BoxGeometry(0.018, 0.48, 0.015);
    const wiperLeft = new THREE.Mesh(wiperGeo, wiperMat);
    wiperLeft.position.set(-0.25, 0.44, 0.70);
    wiperLeft.rotation.z = -Math.PI / 2.8;

    const wiperRight = wiperLeft.clone();
    wiperRight.position.set(0.38, 0.44, 0.70);
    root.add(wiperLeft, wiperRight);

    // Dummy rear mirror for return interface (hidden/minimal so view is unobstructed)
    const dummyMirror = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), srTrimMat);
    dummyMirror.visible = false;
    root.add(dummyMirror);

    return { root, steeringWheel, wiperLeft, wiperRight, rearMirror: dummyMirror };
  }

  /**
   * Create 3D Exterior Mesh for Player Motorcycle (Superbike)
   */
  public static createPlayerMotorcycleMesh(): {
    root: THREE.Group;
    wheels: THREE.Group[];
    taillights: THREE.Mesh[];
    leftBlinker: THREE.Mesh[];
    rightBlinker: THREE.Mesh[];
    headlightSpots: THREE.SpotLight[];
    exhaustFlames: THREE.Mesh[];
  } {
    const root = new THREE.Group();
    const wheels: THREE.Group[] = [];
    const taillights: THREE.Mesh[] = [];
    const leftBlinker: THREE.Mesh[] = [];
    const rightBlinker: THREE.Mesh[] = [];
    const headlightSpots: THREE.SpotLight[] = [];
    const exhaustFlames: THREE.Mesh[] = [];

    const racingRedPaint = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.25,
      metalness: 0.5,
    });

    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.4,
      metalness: 0.8,
    });

    const goldForks = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.2,
      metalness: 0.9,
    });

    // 1. Trellis Frame & Engine Block
    const frameGeo = new THREE.BoxGeometry(0.48, 0.55, 1.2);
    const frame = new THREE.Mesh(frameGeo, engineMat);
    frame.position.set(0, 0.62, 0);
    root.add(frame);

    // 2. Sculpted Fuel Tank
    const tankGeo = new THREE.BoxGeometry(0.52, 0.38, 0.75);
    const tank = new THREE.Mesh(tankGeo, racingRedPaint);
    tank.position.set(0, 0.92, 0.15);
    root.add(tank);

    // 3. Aerodynamic Front Nose Cowl & Fairing
    const fairingGeo = new THREE.ConeGeometry(0.38, 0.85, 8);
    fairingGeo.rotateX(Math.PI / 2);
    const fairing = new THREE.Mesh(fairingGeo, racingRedPaint);
    fairing.position.set(0, 0.82, 0.95);
    root.add(fairing);

    // Aerodynamic Windscreen
    const screenGeo = new THREE.ConeGeometry(0.28, 0.48, 8, 1, true, 0, Math.PI);
    screenGeo.rotateX(Math.PI / 2.3);
    const windscreen = new THREE.Mesh(screenGeo, this.glassMaterial);
    windscreen.position.set(0, 1.05, 0.85);
    root.add(windscreen);

    // Dual Projector LED Headlights
    [-0.14, 0.14].forEach((x) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.06), this.headlightOnMaterial);
      hl.position.set(x, 0.78, 1.32);
      root.add(hl);

      const spot = new THREE.SpotLight(0xffffff, 3.8, 90, Math.PI / 5, 0.4, 1.2);
      spot.position.set(x, 0.78, 1.33);
      spot.target.position.set(x, 0.2, 50);
      root.add(spot);
      root.add(spot.target);
      headlightSpots.push(spot);
    });

    // 4. Gold Inverted Front Forks & Clip-on Bars
    [-0.16, 0.16].forEach((x) => {
      const forkGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.85, 12);
      forkGeo.rotateX(-0.35);
      const fork = new THREE.Mesh(forkGeo, goldForks);
      fork.position.set(x, 0.65, 0.98);
      root.add(fork);
    });

    // Handlebars
    const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.65, 12);
    barGeo.rotateZ(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, engineMat);
    bar.position.set(0, 1.02, 0.75);
    root.add(bar);

    // 5. Rider Seat & Tail Cowl
    const seatGeo = new THREE.BoxGeometry(0.38, 0.14, 0.45);
    const seat = new THREE.Mesh(seatGeo, this.darkLeather);
    seat.position.set(0, 0.78, -0.38);
    root.add(seat);

    const tailGeo = new THREE.ConeGeometry(0.28, 0.65, 6);
    tailGeo.rotateX(-Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, racingRedPaint);
    tail.position.set(0, 0.82, -0.85);
    root.add(tail);

    // LED Taillight Strip
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.05), this.taillightOffMaterial);
    tl.position.set(0, 0.84, -1.18);
    root.add(tl);
    taillights.push(tl);

    // Blinkers
    const blF = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), this.blinkerOffMaterial);
    blF.position.set(-0.28, 0.82, 0.9);
    const blR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), this.blinkerOffMaterial);
    blR.position.set(-0.22, 0.82, -1.15);
    root.add(blF, blR);
    leftBlinker.push(blF, blR);

    const brF = blF.clone();
    brF.position.x = 0.28;
    const brR = blR.clone();
    brR.position.x = 0.22;
    root.add(brF, brR);
    rightBlinker.push(brF, brR);

    // 6. Under-tail Sport Exhaust
    const exhaustGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 12);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaust = new THREE.Mesh(exhaustGeo, this.chromeMaterial);
    exhaust.position.set(0.24, 0.52, -0.85);
    root.add(exhaust);

    // Nitro exhaust flame
    const flameGeo = new THREE.ConeGeometry(0.12, 0.75, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0.24, 0.52, -1.35);
    root.add(flame);
    exhaustFlames.push(flame);

    // 7. Motorcycle Wheels (Front & Rear)
    const frontWheel = this.createWheel(0.36, 0.16, true);
    frontWheel.position.set(0, 0.36, 1.15);
    root.add(frontWheel);
    wheels.push(frontWheel);

    const rearWheel = this.createWheel(0.36, 0.22, true);
    rearWheel.position.set(0, 0.36, -0.95);
    root.add(rearWheel);
    wheels.push(rearWheel);

    return { root, wheels, taillights, leftBlinker, rightBlinker, headlightSpots, exhaustFlames };
  }

  /**
   * Create Driver Cockpit (Handlebar view) for Motorcycle
   * WITH Functional In-Dash Digital Race Dash Screen
   */
  public static createPlayerMotorcycleCockpit(cockpitScreens: CockpitScreens): {
    root: THREE.Group;
    handlebars: THREE.Group;
  } {
    const root = new THREE.Group();
    const handlebars = new THREE.Group();

    // Clip-on handlebar clamp & tubes
    const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.78, 12);
    barGeo.rotateZ(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, this.dashPlastic);
    handlebars.add(bar);

    // Textured rubber grips
    const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 12), this.tireMaterial);
    gripL.rotateZ(Math.PI / 2);
    gripL.position.set(-0.35, 0, 0);
    const gripR = gripL.clone();
    gripR.position.x = 0.35;
    handlebars.add(gripL, gripR);

    // Levers (Clutch & Front Brake)
    const leverL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.012), this.aluminumTrim);
    leverL.position.set(-0.3, -0.01, 0.04);
    const leverR = leverL.clone();
    leverR.position.x = 0.3;
    handlebars.add(leverL, leverR);

    // Brake fluid reservoir (Golden fluid cup)
    const resCup = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.2 }));
    resCup.position.set(0.24, 0.05, 0.02);
    handlebars.add(resCup);

    // --- FUNCTIONAL DIGITAL TFT RACE SCREEN ---
    const tftHousing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.04), this.dashPlastic);
    tftHousing.position.set(0, 0.08, 0.06);
    tftHousing.rotation.x = -0.3;
    handlebars.add(tftHousing);

    const tftScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.16), cockpitScreens.gaugeMaterial);
    tftScreen.position.set(0, 0.08, 0.08);
    tftScreen.rotation.x = -0.3;
    handlebars.add(tftScreen);

    handlebars.position.set(0, 0.22, 0.45);
    root.add(handlebars);

    // Windshield bubble
    const screenGeo = new THREE.ConeGeometry(0.36, 0.65, 12, 1, true, 0, Math.PI);
    screenGeo.rotateX(Math.PI / 2.3);
    const screen = new THREE.Mesh(screenGeo, this.glassMaterial);
    screen.position.set(0, 0.32, 0.68);
    root.add(screen);

    // Fairing-mounted mirrors
    [-0.32, 0.32].forEach((x, idx) => {
      const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.08), this.chromeMaterial);
      mirror.position.set(x, 0.36, 0.62);
      mirror.rotation.y = idx === 0 ? 0.25 : -0.25;
      root.add(mirror);
    });

    return { root, handlebars };
  }

  /**
   * Create Highly Realistic AI Traffic Vehicle Meshes
   * Semi-Trucks with 53ft trailers, Fuel Tankers, SUVs, Sedans, and Sportscars
   */
  public static createAITrafficMesh(
    type: 'sedan' | 'suv' | 'truck' | 'sportscar' | 'tanker',
    colorHex: number
  ): {
    root: THREE.Group;
    taillights: THREE.Mesh[];
    leftBlinkers: THREE.Mesh[];
    rightBlinkers: THREE.Mesh[];
  } {
    const root = new THREE.Group();
    const taillights: THREE.Mesh[] = [];
    const leftBlinkers: THREE.Mesh[] = [];
    const rightBlinkers: THREE.Mesh[] = [];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.4,
    });

    if (type === 'truck') {
      // --- 18-WHEELER SEMI-TRUCK WITH 53FT TRAILER ---
      // 1. Semi Cab with High-Roof Sleeper & Wind Deflector
      const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.2, 3.2), bodyMat);
      cabBody.position.set(0, 2.0, 4.6);
      cabBody.castShadow = true;
      root.add(cabBody);

      // Sloping Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 1.6), bodyMat);
      hood.position.set(0, 1.1, 6.6);
      root.add(hood);

      // Huge Chrome Grille
      const grille = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.1), this.chromeMaterial);
      grille.position.set(0, 1.1, 7.42);
      root.add(grille);

      // Chrome Heavy-Duty Bumper
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.3), this.chromeMaterial);
      bumper.position.set(0, 0.45, 7.4);
      root.add(bumper);

      // Cab Windshield
      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.0), this.glassMaterial);
      windshield.position.set(0, 2.2, 6.22);
      root.add(windshield);

      // Twin Chrome Vertical Exhaust Stacks
      [-1.28, 1.28].forEach((x) => {
        const stackGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.2, 12);
        const stack = new THREE.Mesh(stackGeo, this.chromeMaterial);
        stack.position.set(x, 2.6, 3.1);
        root.add(stack);
      });

      // Cab Roof Amber Clearance Lights (5 lights)
      [-0.8, -0.4, 0, 0.4, 0.8].forEach((x) => {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), this.blinkerOnMaterial);
        marker.position.set(x, 3.65, 4.5);
        root.add(marker);
      });

      // Aluminum Fuel Tanks with straps
      [-1.25, 1.25].forEach((x) => {
        const tankGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.2, 16);
        tankGeo.rotateX(Math.PI / 2);
        const tank = new THREE.Mesh(tankGeo, this.chromeMaterial);
        tank.position.set(x, 0.65, 4.4);
        root.add(tank);
      });

      // 2. 53ft Box Trailer (Ribbed Texture & Aero Skirts)
      const trailerMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.3,
        metalness: 0.2,
      });
      const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 11.2), trailerMat);
      trailer.position.set(0, 2.45, -2.8);
      trailer.castShadow = true;
      root.add(trailer);

      // Underside Aero Side Skirts
      [-1.28, 1.28].forEach((x) => {
        const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 5.5), this.dashPlastic);
        skirt.position.set(x, 0.75, -2.5);
        root.add(skirt);
      });

      // Rear Swing Doors & Locking Bars
      const doorBarL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8), this.chromeMaterial);
      doorBarL.position.set(-0.55, 2.45, -8.42);
      const doorBarR = doorBarL.clone();
      doorBarR.position.x = 0.55;
      root.add(doorBarL, doorBarR);

      // Rear ICC Crash Bumper & Mudflaps
      const iccBumper = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 0.15), this.aluminumTrim);
      iccBumper.position.set(0, 0.5, -8.45);
      root.add(iccBumper);

      [-1.1, 1.1].forEach((x) => {
        const flap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.03), this.tireMaterial);
        flap.position.set(x, 0.55, -8.42);
        root.add(flap);
      });

      // Headlights on front bumper
      [-0.95, 0.95].forEach((x) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.05), this.headlightOnMaterial);
        hl.position.set(x, 0.45, 7.56);
        root.add(hl);
      });

      // Rear Trailer Taillights
      [-1.05, 1.05].forEach((x) => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.05), this.taillightOffMaterial);
        tl.position.set(x, 0.52, -8.46);
        root.add(tl);
        taillights.push(tl);
      });

      // Blinkers
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), this.blinkerOffMaterial);
      bl.position.set(-1.26, 0.52, -8.46);
      root.add(bl);
      leftBlinkers.push(bl);

      const br = bl.clone();
      br.position.x = 1.26;
      root.add(br);
      rightBlinkers.push(br);

      // Wheels: Cab Steer Axle + Cab Tandem Drive Axles + Trailer Tandem Axles
      // Cab front axle
      [-1.25, 1.25].forEach((x) => {
        const w = this.createWheel(0.52, 0.35);
        w.position.set(x, 0.52, 6.2);
        root.add(w);
      });

      // Cab dual drive axles
      [-1.25, 1.25].forEach((x) => {
        [3.8, 2.4].forEach((z) => {
          const w = this.createWheel(0.52, 0.35);
          w.position.set(x, 0.52, z);
          root.add(w);
        });
      });

      // Trailer dual tandem axles (8 wheels total)
      [-1.28, 1.28].forEach((x) => {
        [-5.8, -7.2].forEach((z) => {
          const w = this.createWheel(0.52, 0.35);
          w.position.set(x, 0.52, z);
          root.add(w);
        });
      });
    } else if (type === 'tanker') {
      // --- POLISHED STAINLESS STEEL FUEL TANKER TRUCK ---
      const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.9, 2.8), bodyMat);
      cabBody.position.set(0, 1.85, 4.2);
      root.add(cabBody);

      // Polished Chrome Tanker Cylinder
      const tankerGeo = new THREE.CylinderGeometry(1.35, 1.35, 10.4, 24);
      tankerGeo.rotateX(Math.PI / 2);
      const tanker = new THREE.Mesh(tankerGeo, this.chromeMaterial);
      tanker.position.set(0, 2.1, -2.8);
      tanker.castShadow = true;
      root.add(tanker);

      // Tanker Dished Domed End Caps
      const domeFront = new THREE.Mesh(new THREE.SphereGeometry(1.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.chromeMaterial);
      domeFront.rotateX(Math.PI / 2);
      domeFront.position.set(0, 2.1, 2.4);
      const domeRear = domeFront.clone();
      domeRear.rotateX(Math.PI);
      domeRear.position.set(0, 2.1, -8.0);
      root.add(domeFront, domeRear);

      // Top Catwalk & Rear Access Ladder
      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 9.5), this.aluminumTrim);
      catwalk.position.set(0, 3.5, -2.8);
      root.add(catwalk);

      const ladderL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8), this.chromeMaterial);
      ladderL.position.set(-0.25, 2.1, -8.05);
      const ladderR = ladderL.clone();
      ladderR.position.x = 0.25;
      root.add(ladderL, ladderR);

      // HAZMAT Flammable Placard Diamond (Red & White)
      const placard = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      placard.rotateZ(Math.PI / 4);
      placard.position.set(0, 2.1, -8.08);
      root.add(placard);

      // Rear Lights
      [-1.0, 1.0].forEach((x) => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.05), this.taillightOffMaterial);
        tl.position.set(x, 0.65, -8.08);
        root.add(tl);
        taillights.push(tl);
      });

      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), this.blinkerOffMaterial);
      bl.position.set(-1.22, 0.65, -8.08);
      root.add(bl);
      leftBlinkers.push(bl);

      const br = bl.clone();
      br.position.x = 1.22;
      root.add(br);
      rightBlinkers.push(br);

      // Tandem Axles
      [-1.25, 1.25].forEach((x) => {
        [5.2, 3.2, -5.6, -7.0].forEach((z) => {
          const w = this.createWheel(0.5, 0.35);
          w.position.set(x, 0.5, z);
          root.add(w);
        });
      });
    } else if (type === 'suv') {
      // --- LUXURY SPORT SUV ---
      const lower = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.88, 4.8), bodyMat);
      lower.position.set(0, 0.78, 0);
      lower.castShadow = true;
      root.add(lower);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.82, 3.0), bodyMat);
      upper.position.set(0, 1.58, -0.2);
      root.add(upper);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.78, 2.95), this.glassMaterial);
      win.position.set(0, 1.58, -0.2);
      root.add(win);

      // Roof Rails
      [-0.85, 0.85].forEach((x) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 2.4), this.aluminumTrim);
        rail.position.set(x, 2.02, -0.2);
        root.add(rail);
      });

      // Front Headlights
      [-0.82, 0.82].forEach((x) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.06), this.headlightOnMaterial);
        hl.position.set(x, 0.9, 2.41);
        root.add(hl);
      });

      // Rear Lightbar
      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.12, 0.06), this.taillightOffMaterial);
      tl.position.set(0, 1.05, -2.41);
      root.add(tl);
      taillights.push(tl);

      // Blinkers
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), this.blinkerOffMaterial);
      bl.position.set(-1.0, 1.05, -2.41);
      root.add(bl);
      leftBlinkers.push(bl);

      const br = bl.clone();
      br.position.x = 1.0;
      root.add(br);
      rightBlinkers.push(br);

      // SUV Wheels
      [-1.1, 1.1].forEach((x) => {
        [-1.45, 1.45].forEach((z) => {
          const w = this.createWheel(0.44, 0.3);
          w.position.set(x, 0.44, z);
          root.add(w);
        });
      });
    } else {
      // --- SEDAN OR SPORTSCAR ---
      const isSport = type === 'sportscar';
      const height = isSport ? 0.52 : 0.65;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.98, height, 4.4), bodyMat);
      lower.position.set(0, height * 0.85, 0);
      lower.castShadow = true;
      root.add(lower);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.62, isSport ? 0.48 : 0.64, 2.3), bodyMat);
      upper.position.set(0, height * 1.55, -0.2);
      root.add(upper);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, isSport ? 0.46 : 0.62, 2.25), this.glassMaterial);
      win.position.set(0, height * 1.55, -0.2);
      root.add(win);

      // Headlights
      [-0.72, 0.72].forEach((x) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.06), this.headlightOnMaterial);
        hl.position.set(x, height * 0.95, 2.21);
        root.add(hl);
      });

      // Taillights
      [-0.72, 0.72].forEach((x) => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.06), this.taillightOffMaterial);
        tl.position.set(x, height * 1.02, -2.21);
        root.add(tl);
        taillights.push(tl);
      });

      // Blinkers
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), this.blinkerOffMaterial);
      bl.position.set(-0.95, height * 1.02, -2.21);
      root.add(bl);
      leftBlinkers.push(bl);

      const br = bl.clone();
      br.position.x = 0.95;
      root.add(br);
      rightBlinkers.push(br);

      // Wheels
      [-1.02, 1.02].forEach((x) => {
        [-1.38, 1.38].forEach((z) => {
          const w = this.createWheel(0.38, 0.26);
          w.position.set(x, 0.38, z);
          root.add(w);
        });
      });
    }

    return { root, taillights, leftBlinkers, rightBlinkers };
  }
}

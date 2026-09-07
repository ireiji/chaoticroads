/**
 * Procedural 3D Vehicle Models & Cockpits for Three.js
 */

import * as THREE from 'three';
import { VehicleType } from '../types';

export class Vehicles3D {
  // Shared materials for performance
  public static tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
    metalness: 0.1,
  });

  public static rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.3,
    metalness: 0.85,
  });

  public static glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.9,
    transmission: 0.8,
  });

  public static chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f4f5,
    roughness: 0.15,
    metalness: 0.95,
  });

  public static headlightOnMaterial = new THREE.MeshBasicMaterial({
    color: 0xfef9c3,
  });

  public static taillightOffMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    roughness: 0.4,
  });

  public static taillightOnMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0022,
  });

  public static blinkerOffMaterial = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.4,
  });

  public static blinkerOnMaterial = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
  });

  /**
   * Create 3D Exterior Mesh for Player Car
   */
  public static createPlayerCarMesh(): {
    root: THREE.Group;
    wheels: THREE.Mesh[];
    taillights: THREE.Mesh[];
    leftBlinker: THREE.Mesh[];
    rightBlinker: THREE.Mesh[];
    headlightSpots: THREE.SpotLight[];
    exhaustFlames: THREE.Mesh[];
  } {
    const root = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    const taillights: THREE.Mesh[] = [];
    const leftBlinker: THREE.Mesh[] = [];
    const rightBlinker: THREE.Mesh[] = [];
    const headlightSpots: THREE.SpotLight[] = [];
    const exhaustFlames: THREE.Mesh[] = [];

    const carPaintMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Radiant cobalt blue
      roughness: 0.25,
      metalness: 0.75,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.7,
      metalness: 0.3,
    });

    // Main lower chassis
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.7, 4.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, carPaintMaterial);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);

    // Aerodynamic cabin / roof
    const cabinGeo = new THREE.BoxGeometry(1.65, 0.65, 2.2);
    const cabinMesh = new THREE.Mesh(cabinGeo, carPaintMaterial);
    cabinMesh.position.set(0, 1.15, -0.2);
    cabinMesh.castShadow = true;
    root.add(cabinMesh);

    // Windshield & windows
    const windshieldGeo = new THREE.BoxGeometry(1.6, 0.62, 2.15);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, this.glassMaterial);
    windshieldMesh.position.set(0, 1.15, -0.2);
    root.add(windshieldMesh);

    // Front bumper / splitter
    const bumperGeo = new THREE.BoxGeometry(2.05, 0.25, 0.4);
    const bumperMesh = new THREE.Mesh(bumperGeo, trimMaterial);
    bumperMesh.position.set(0, 0.32, 2.2);
    root.add(bumperMesh);

    // Rear diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.9, 0.3, 0.3);
    const diffuserMesh = new THREE.Mesh(diffuserGeo, trimMaterial);
    diffuserMesh.position.set(0, 0.35, -2.2);
    root.add(diffuserMesh);

    // Rear spoiler
    const spoilerWingGeo = new THREE.BoxGeometry(1.8, 0.08, 0.35);
    const spoilerWing = new THREE.Mesh(spoilerWingGeo, trimMaterial);
    spoilerWing.position.set(0, 1.25, -2.1);
    root.add(spoilerWing);

    const spoilerStand1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.15), trimMaterial);
    spoilerStand1.position.set(-0.6, 1.05, -2.1);
    const spoilerStand2 = spoilerStand1.clone();
    spoilerStand2.position.x = 0.6;
    root.add(spoilerStand1, spoilerStand2);

    // Headlights (Front is +Z)
    const headlightGeo = new THREE.BoxGeometry(0.4, 0.15, 0.1);
    const hlLeft = new THREE.Mesh(headlightGeo, this.headlightOnMaterial);
    hlLeft.position.set(-0.72, 0.68, 2.21);
    const hlRight = new THREE.Mesh(headlightGeo, this.headlightOnMaterial);
    hlRight.position.set(0.72, 0.68, 2.21);
    root.add(hlLeft, hlRight);

    // Headlight spotlights
    const spotLeft = new THREE.SpotLight(0xfffaed, 2.5, 90, Math.PI / 6, 0.4, 1.2);
    spotLeft.position.set(-0.72, 0.7, 2.2);
    spotLeft.target.position.set(-0.72, 0.0, 25.0);
    root.add(spotLeft);
    root.add(spotLeft.target);
    headlightSpots.push(spotLeft);

    const spotRight = new THREE.SpotLight(0xfffaed, 2.5, 90, Math.PI / 6, 0.4, 1.2);
    spotRight.position.set(0.72, 0.7, 2.2);
    spotRight.target.position.set(0.72, 0.0, 25.0);
    root.add(spotRight);
    root.add(spotRight.target);
    headlightSpots.push(spotRight);

    // Taillights (Rear is -Z)
    const taillightGeo = new THREE.BoxGeometry(0.45, 0.14, 0.1);
    const tlLeft = new THREE.Mesh(taillightGeo, this.taillightOffMaterial);
    tlLeft.position.set(-0.72, 0.72, -2.21);
    const tlRight = new THREE.Mesh(taillightGeo, this.taillightOffMaterial);
    tlRight.position.set(0.72, 0.72, -2.21);
    root.add(tlLeft, tlRight);
    taillights.push(tlLeft, tlRight);

    // Blinkers
    const blinkerGeo = new THREE.BoxGeometry(0.18, 0.12, 0.08);
    // Front Left & Rear Left
    const blFL = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blFL.position.set(-0.95, 0.68, 2.18);
    const blRL = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blRL.position.set(-0.95, 0.72, -2.18);
    root.add(blFL, blRL);
    leftBlinker.push(blFL, blRL);

    // Front Right & Rear Right
    const blFR = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blFR.position.set(0.95, 0.68, 2.18);
    const blRR = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blRR.position.set(0.95, 0.72, -2.18);
    root.add(blFR, blRR);
    rightBlinker.push(blFR, blRR);

    // Wheels (4 wheels)
    const wheelPositions = [
      [-1.02, 0.35, 1.3], // Front Left
      [1.02, 0.35, 1.3], // Front Right
      [-1.02, 0.35, -1.3], // Rear Left
      [1.02, 0.35, -1.3], // Rear Right
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 18);
    wheelGeo.rotateZ(Math.PI / 2);

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheelMesh = new THREE.Mesh(wheelGeo, this.tireMaterial);
      wheelMesh.position.set(wx, wy, wz);
      wheelMesh.castShadow = true;

      // Rim
      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.rimMaterial);
      wheelMesh.add(rimMesh);

      root.add(wheelMesh);
      wheels.push(wheelMesh);
    });

    // Exhaust pipes & Nitro flame meshes
    const flameGeo = new THREE.ConeGeometry(0.14, 0.8, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0 });

    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.45, 0.35, -2.6);
    const flameR = new THREE.Mesh(flameGeo, flameMat);
    flameR.position.set(0.45, 0.35, -2.6);
    root.add(flameL, flameR);
    exhaustFlames.push(flameL, flameR);

    return { root, wheels, taillights, leftBlinker, rightBlinker, headlightSpots, exhaustFlames };
  }

  /**
   * Create Driver Cockpit Interior for Player Car
   */
  public static createPlayerCarCockpit(): {
    root: THREE.Group;
    steeringWheel: THREE.Group;
    wiperLeft: THREE.Mesh;
    wiperRight: THREE.Mesh;
    rearMirror: THREE.Mesh;
  } {
    const root = new THREE.Group();

    const darkLeather = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.1,
    });

    const dashSurface = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.2,
    });

    // Main Dashboard body
    const dashGeo = new THREE.BoxGeometry(1.8, 0.45, 0.7);
    const dashMesh = new THREE.Mesh(dashGeo, dashSurface);
    dashMesh.position.set(0, -0.05, 0.6);
    root.add(dashMesh);

    // Instrument cluster cowl (above steering wheel, on left driver side: x = -0.45)
    const cowlGeo = new THREE.BoxGeometry(0.65, 0.25, 0.45);
    const cowlMesh = new THREE.Mesh(cowlGeo, darkLeather);
    cowlMesh.position.set(-0.42, 0.2, 0.55);
    root.add(cowlMesh);

    // Center Console & Infotainment mount
    const consoleGeo = new THREE.BoxGeometry(0.45, 0.65, 0.6);
    const consoleMesh = new THREE.Mesh(consoleGeo, dashSurface);
    consoleMesh.position.set(0, -0.3, 0.5);
    root.add(consoleMesh);

    // A-pillars and windshield frame
    const aPillarMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), aPillarMat);
    pillarL.position.set(-0.85, 0.35, 0.35);
    pillarL.rotation.z = -0.25;
    pillarL.rotation.x = -0.4;
    const pillarR = pillarL.clone();
    pillarR.position.x = 0.85;
    pillarR.rotation.z = 0.25;
    root.add(pillarL, pillarR);

    // Windshield glass
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), this.glassMaterial);
    glass.position.set(0, 0.35, 0.6);
    glass.rotation.x = -0.4;
    root.add(glass);

    // Steering column & Steering wheel
    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(-0.42, 0.08, 0.32);
    steeringWheel.rotation.x = 0.25;

    // Torus steering rim
    const rimGeo = new THREE.TorusGeometry(0.22, 0.024, 12, 32);
    const rim = new THREE.Mesh(rimGeo, darkLeather);
    steeringWheel.add(rim);

    // Center hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), darkLeather);
    hub.rotation.x = Math.PI / 2;
    steeringWheel.add(hub);

    // Spokes
    const spokeGeo = new THREE.BoxGeometry(0.38, 0.03, 0.02);
    const spokeH = new THREE.Mesh(spokeGeo, darkLeather);
    steeringWheel.add(spokeH);
    const spokeV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.02), darkLeather);
    spokeV.position.y = -0.09;
    steeringWheel.add(spokeV);

    root.add(steeringWheel);

    // Rearview mirror
    const mirrorGeo = new THREE.BoxGeometry(0.35, 0.1, 0.04);
    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.1, metalness: 0.9 });
    const rearMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    rearMirror.position.set(0, 0.62, 0.45);
    root.add(rearMirror);

    // Wipers
    const wiperGeo = new THREE.BoxGeometry(0.02, 0.45, 0.02);
    const wiperMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
    const wiperLeft = new THREE.Mesh(wiperGeo, wiperMat);
    wiperLeft.position.set(-0.35, 0.2, 0.65);
    wiperLeft.rotation.z = -Math.PI / 3;
    const wiperRight = wiperLeft.clone();
    wiperRight.position.x = 0.35;
    root.add(wiperLeft, wiperRight);

    return { root, steeringWheel, wiperLeft, wiperRight, rearMirror };
  }

  /**
   * Create 3D Exterior Mesh for Player Motorcycle
   */
  public static createPlayerMotorcycleMesh(): {
    root: THREE.Group;
    wheels: THREE.Mesh[];
    taillights: THREE.Mesh[];
    leftBlinker: THREE.Mesh[];
    rightBlinker: THREE.Mesh[];
    headlightSpots: THREE.SpotLight[];
    exhaustFlames: THREE.Mesh[];
  } {
    const root = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    const taillights: THREE.Mesh[] = [];
    const leftBlinker: THREE.Mesh[] = [];
    const rightBlinker: THREE.Mesh[] = [];
    const headlightSpots: THREE.SpotLight[] = [];
    const exhaustFlames: THREE.Mesh[] = [];

    const motoPaintMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Vibrant racing red
      roughness: 0.2,
      metalness: 0.8,
    });

    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.5,
      metalness: 0.7,
    });

    // Frame / Fuel tank
    const tankGeo = new THREE.BoxGeometry(0.55, 0.4, 0.9);
    const tank = new THREE.Mesh(tankGeo, motoPaintMat);
    tank.position.set(0, 0.85, 0.1);
    root.add(tank);

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.4, 0.15, 0.7);
    const seat = new THREE.Mesh(seatGeo, new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 }));
    seat.position.set(0, 0.78, -0.6);
    root.add(seat);

    // Aerodynamic front fairing & windshield
    const fairingGeo = new THREE.ConeGeometry(0.38, 0.8, 6);
    fairingGeo.rotateX(Math.PI / 2.2);
    const fairing = new THREE.Mesh(fairingGeo, motoPaintMat);
    fairing.position.set(0, 0.9, 0.9);
    root.add(fairing);

    // Engine block
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.6), engineMat);
    engine.position.set(0, 0.48, -0.05);
    root.add(engine);

    // Exhaust pipe
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8), this.chromeMaterial);
    exhaust.position.set(0.28, 0.35, -0.85);
    exhaust.rotation.x = Math.PI / 2.2;
    root.add(exhaust);

    // Front Headlight (Front is +Z)
    const hlMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.08), this.headlightOnMaterial);
    hlMesh.position.set(0, 0.85, 1.25);
    root.add(hlMesh);

    const spotLight = new THREE.SpotLight(0xfffaed, 2.8, 95, Math.PI / 7, 0.35, 1.2);
    spotLight.position.set(0, 0.85, 1.25);
    spotLight.target.position.set(0, 0, 30);
    root.add(spotLight);
    root.add(spotLight.target);
    headlightSpots.push(spotLight);

    // Rear Taillight
    const tlMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), this.taillightOffMaterial);
    tlMesh.position.set(0, 0.85, -1.1);
    root.add(tlMesh);
    taillights.push(tlMesh);

    // Blinkers
    const blinkerGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const blFL = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blFL.position.set(-0.32, 0.85, 0.9);
    const blRL = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blRL.position.set(-0.25, 0.85, -1.05);
    root.add(blFL, blRL);
    leftBlinker.push(blFL, blRL);

    const blFR = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blFR.position.set(0.32, 0.85, 0.9);
    const blRR = new THREE.Mesh(blinkerGeo, this.blinkerOffMaterial);
    blRR.position.set(0.25, 0.85, -1.05);
    root.add(blFR, blRR);
    rightBlinker.push(blFR, blRR);

    // 2 Wheels (Front & Rear)
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.15, 16), this.tireMaterial);
    frontWheel.rotateZ(Math.PI / 2);
    frontWheel.position.set(0, 0.32, 1.15);
    root.add(frontWheel);
    wheels.push(frontWheel);

    const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16), this.tireMaterial);
    rearWheel.rotateZ(Math.PI / 2);
    rearWheel.position.set(0, 0.34, -1.05);
    root.add(rearWheel);
    wheels.push(rearWheel);

    // Nitro exhaust flame
    const flameGeo = new THREE.ConeGeometry(0.1, 0.7, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0.28, 0.42, -1.5);
    root.add(flame);
    exhaustFlames.push(flame);

    return { root, wheels, taillights, leftBlinker, rightBlinker, headlightSpots, exhaustFlames };
  }

  /**
   * Create Driver Cockpit (Handlebar view) for Motorcycle
   */
  public static createPlayerMotorcycleCockpit(): {
    root: THREE.Group;
    handlebars: THREE.Group;
  } {
    const root = new THREE.Group();
    const handlebars = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.3, metalness: 0.8 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });

    // Handlebar triple clamp & bars
    const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.78, 12);
    barGeo.rotateZ(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, metalMat);
    handlebars.add(bar);

    // Rubber grips
    const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 12), gripMat);
    gripL.rotateZ(Math.PI / 2);
    gripL.position.set(-0.35, 0, 0);
    const gripR = gripL.clone();
    gripR.position.x = 0.35;
    handlebars.add(gripL, gripR);

    // Brake and clutch levers
    const leverL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.012), this.chromeMaterial);
    leverL.position.set(-0.3, -0.01, 0.04);
    const leverR = leverL.clone();
    leverR.position.x = 0.3;
    handlebars.add(leverL, leverR);

    handlebars.position.set(0, 0.02, 0.35);
    handlebars.rotation.x = -0.15;
    root.add(handlebars);

    // Windshield dome
    const screenGeo = new THREE.ConeGeometry(0.4, 0.6, 12, 1, true, 0, Math.PI);
    screenGeo.rotateX(Math.PI / 2.3);
    const screen = new THREE.Mesh(screenGeo, this.glassMaterial);
    screen.position.set(0, 0.18, 0.55);
    root.add(screen);

    return { root, handlebars };
  }

  /**
   * Create AI Traffic Vehicle Meshes (Sedan, SUV, Truck, Sportscar, Tanker)
   */
  public static createAITrafficMesh(type: 'sedan' | 'suv' | 'truck' | 'sportscar' | 'tanker', colorHex: number): {
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
      metalness: 0.6,
    });

    if (type === 'truck') {
      // 18-Wheeler Semi Cab + 53ft Trailer
      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.2, 3.0), bodyMat);
      cab.position.set(0, 2.0, 4.5);
      cab.castShadow = true;
      root.add(cab);

      // Cab windshield
      const cabWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.1, 0.1), this.glassMaterial);
      cabWindshield.position.set(0, 2.4, 6.01);
      root.add(cabWindshield);

      // Trailer
      const trailerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.5 });
      const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 9.5), trailerMat);
      trailer.position.set(0, 2.3, -2.0);
      trailer.castShadow = true;
      root.add(trailer);

      // Headlights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.1), this.headlightOnMaterial);
      hl1.position.set(-0.9, 1.1, 6.01);
      const hl2 = hl1.clone();
      hl2.position.x = 0.9;
      root.add(hl1, hl2);

      // Taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), this.taillightOffMaterial);
      tl1.position.set(-1.0, 0.9, -6.8);
      const tl2 = tl1.clone();
      tl2.position.x = 1.0;
      root.add(tl1, tl2);
      taillights.push(tl1, tl2);

      // Blinkers
      const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), this.blinkerOffMaterial);
      bl1.position.set(-1.25, 0.9, -6.8);
      root.add(bl1);
      leftBlinkers.push(bl1);

      const br1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), this.blinkerOffMaterial);
      br1.position.set(1.25, 0.9, -6.8);
      root.add(br1);
      rightBlinkers.push(br1);

      // Truck Wheels
      [-1.3, 1.3].forEach((x) => {
        [5.0, 3.5, -4.5, -6.0].forEach((z) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12), this.tireMaterial);
          w.rotateZ(Math.PI / 2);
          w.position.set(x, 0.5, z);
          root.add(w);
        });
      });
    } else if (type === 'tanker') {
      // Fuel Tanker Truck
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.9, 2.8), bodyMat);
      cab.position.set(0, 1.8, 4.2);
      root.add(cab);

      // Cylindrical Tanker
      const tankerGeo = new THREE.CylinderGeometry(1.3, 1.3, 9.0, 16);
      tankerGeo.rotateX(Math.PI / 2);
      const tanker = new THREE.Mesh(tankerGeo, this.chromeMaterial);
      tanker.position.set(0, 2.0, -2.0);
      root.add(tanker);

      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), this.taillightOffMaterial);
      tl1.position.set(-0.9, 0.8, -6.6);
      const tl2 = tl1.clone();
      tl2.position.x = 0.9;
      root.add(tl1, tl2);
      taillights.push(tl1, tl2);

      const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.1), this.blinkerOffMaterial);
      bl1.position.set(-1.15, 0.8, -6.6);
      root.add(bl1);
      leftBlinkers.push(bl1);

      const br1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.1), this.blinkerOffMaterial);
      br1.position.set(1.15, 0.8, -6.6);
      root.add(br1);
      rightBlinkers.push(br1);
    } else if (type === 'suv') {
      // SUV
      const lower = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 4.6), bodyMat);
      lower.position.set(0, 0.75, 0);
      root.add(lower);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.85, 2.9), bodyMat);
      upper.position.set(0, 1.55, -0.2);
      root.add(upper);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.8, 2.85), this.glassMaterial);
      win.position.set(0, 1.55, -0.2);
      root.add(win);

      // Headlights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), this.headlightOnMaterial);
      hl1.position.set(-0.75, 0.85, 2.31);
      const hl2 = hl1.clone();
      hl2.position.x = 0.75;
      root.add(hl1, hl2);

      // Taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), this.taillightOffMaterial);
      tl1.position.set(-0.75, 0.95, -2.31);
      const tl2 = tl1.clone();
      tl2.position.x = 0.75;
      root.add(tl1, tl2);
      taillights.push(tl1, tl2);

      const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), this.blinkerOffMaterial);
      bl1.position.set(-0.95, 0.95, -2.31);
      root.add(bl1);
      leftBlinkers.push(bl1);

      const br1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), this.blinkerOffMaterial);
      br1.position.set(0.95, 0.95, -2.31);
      root.add(br1);
      rightBlinkers.push(br1);

      // Wheels
      [-1.08, 1.08].forEach((x) => {
        [-1.4, 1.4].forEach((z) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), this.tireMaterial);
          w.rotateZ(Math.PI / 2);
          w.position.set(x, 0.42, z);
          root.add(w);
        });
      });
    } else {
      // Sedan or Sportscar
      const isSport = type === 'sportscar';
      const height = isSport ? 0.55 : 0.68;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.95, height, 4.3), bodyMat);
      lower.position.set(0, height * 0.8, 0);
      root.add(lower);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.6, isSport ? 0.5 : 0.65, 2.2), bodyMat);
      upper.position.set(0, height * 1.5, -0.2);
      root.add(upper);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.58, isSport ? 0.48 : 0.62, 2.15), this.glassMaterial);
      win.position.set(0, height * 1.5, -0.2);
      root.add(win);

      // Headlights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), this.headlightOnMaterial);
      hl1.position.set(-0.7, height * 0.9, 2.16);
      const hl2 = hl1.clone();
      hl2.position.x = 0.7;
      root.add(hl1, hl2);

      // Taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.1), this.taillightOffMaterial);
      tl1.position.set(-0.68, height * 0.95, -2.16);
      const tl2 = tl1.clone();
      tl2.position.x = 0.68;
      root.add(tl1, tl2);
      taillights.push(tl1, tl2);

      // Blinkers
      const bl1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), this.blinkerOffMaterial);
      bl1.position.set(-0.9, height * 0.95, -2.16);
      root.add(bl1);
      leftBlinkers.push(bl1);

      const br1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), this.blinkerOffMaterial);
      br1.position.set(0.9, height * 0.95, -2.16);
      root.add(br1);
      rightBlinkers.push(br1);

      // Wheels
      [-1.0, 1.0].forEach((x) => {
        [-1.3, 1.3].forEach((z) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12), this.tireMaterial);
          w.rotateZ(Math.PI / 2);
          w.position.set(x, 0.34, z);
          root.add(w);
        });
      });
    }

    return { root, taillights, leftBlinkers, rightBlinkers };
  }
}

// Procedural 3D Voxel Meshes Builder: Clean River Water & High-Visibility TNT
import * as THREE from 'three';
import { CUBE_TYPES } from '../config.js';

export class VoxelMeshes {
  constructor() {
    this.textures = this.initTextures();
    this.materials = this.initMaterials();
    this.geometries = this.initGeometries();
  }

  initTextures() {
    // 1. Grass Diagonal Stripes Texture
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 128;
    grassCanvas.height = 128;
    const gCtx = grassCanvas.getContext('2d');
    gCtx.fillStyle = '#68db00';
    gCtx.fillRect(0, 0, 128, 128);
    gCtx.fillStyle = '#52b800';
    for (let i = -128; i < 256; i += 36) {
      gCtx.beginPath();
      gCtx.moveTo(i, 0);
      gCtx.lineTo(i + 16, 0);
      gCtx.lineTo(i + 16 + 128, 128);
      gCtx.lineTo(i + 128, 128);
      gCtx.closePath();
      gCtx.fill();
    }
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.magFilter = THREE.NearestFilter;
    grassTex.minFilter = THREE.NearestFilter;

    // 2. TNT Texture ("TNT" bold lettering)
    const tntCanvas = document.createElement('canvas');
    tntCanvas.width = 128;
    tntCanvas.height = 128;
    const tCtx = tntCanvas.getContext('2d');
    tCtx.fillStyle = '#ff3700';
    tCtx.fillRect(0, 0, 128, 128);
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 36, 128, 56);
    tCtx.fillStyle = '#111111';
    tCtx.font = '900 42px "Fredoka", Arial, sans-serif';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText('TNT', 64, 64);
    const tntTex = new THREE.CanvasTexture(tntCanvas);
    tntTex.magFilter = THREE.NearestFilter;

    // 2b. TNT Flashing Texture (Yellow & Red for active fuse)
    const tntFlashCanvas = document.createElement('canvas');
    tntFlashCanvas.width = 128;
    tntFlashCanvas.height = 128;
    const tfCtx = tntFlashCanvas.getContext('2d');
    tfCtx.fillStyle = '#ffffff';
    tfCtx.fillRect(0, 0, 128, 128);
    tfCtx.fillStyle = '#ff1744';
    tfCtx.fillRect(0, 36, 128, 56);
    tfCtx.fillStyle = '#ffffff';
    tfCtx.font = '900 42px "Fredoka", Arial, sans-serif';
    tfCtx.textAlign = 'center';
    tfCtx.textBaseline = 'middle';
    tfCtx.fillText('TNT', 64, 64);
    const tntFlashTex = new THREE.CanvasTexture(tntFlashCanvas);
    tntFlashTex.magFilter = THREE.NearestFilter;

    // 3. Arrow / Direction Tile Texture
    const arrowCanvas = document.createElement('canvas');
    arrowCanvas.width = 128;
    arrowCanvas.height = 128;
    const aCtx = arrowCanvas.getContext('2d');
    aCtx.fillStyle = '#ffcc00';
    aCtx.fillRect(0, 0, 128, 128);
    aCtx.strokeStyle = '#111111';
    aCtx.lineWidth = 10;
    aCtx.lineCap = 'round';
    aCtx.beginPath();
    aCtx.arc(64, 64, 8, 0, Math.PI * 2);
    aCtx.fillStyle = '#111111';
    aCtx.fill();
    aCtx.moveTo(64, 64); aCtx.lineTo(24, 24);
    aCtx.moveTo(64, 64); aCtx.lineTo(104, 24);
    aCtx.moveTo(64, 64); aCtx.lineTo(64, 104);
    aCtx.stroke();
    const arrowTex = new THREE.CanvasTexture(arrowCanvas);

    // 4. Trap Hole Frame Texture
    const trapHoleCanvas = document.createElement('canvas');
    trapHoleCanvas.width = 128;
    trapHoleCanvas.height = 128;
    const trCtx = trapHoleCanvas.getContext('2d');
    trCtx.fillStyle = '#68db00';
    trCtx.fillRect(0, 0, 128, 128);
    trCtx.fillStyle = '#141e14';
    trCtx.fillRect(28, 28, 72, 72);
    const trapHoleTex = new THREE.CanvasTexture(trapHoleCanvas);

    // 5. Clean River Water Texture (NO white direction lines)
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = 128;
    waterCanvas.height = 128;
    const wCtx = waterCanvas.getContext('2d');
    wCtx.fillStyle = '#00d4ff';
    wCtx.fillRect(0, 0, 128, 128);
    const waterTex = new THREE.CanvasTexture(waterCanvas);

    // 6. Cracked Earth Fault Stone Texture
    const crackCanvas = document.createElement('canvas');
    crackCanvas.width = 128;
    crackCanvas.height = 128;
    const cCtx = crackCanvas.getContext('2d');
    // Earth rock base
    cCtx.fillStyle = '#8d6e63';
    cCtx.fillRect(0, 0, 128, 128);
    // Rocky texture noise
    cCtx.fillStyle = '#6d4c41';
    for (let i = 0; i < 40; i++) {
      const rx = (i * 29 + 17) % 128;
      const ry = (i * 47 + 11) % 128;
      const rw = 4 + (i % 6);
      const rh = 4 + (i % 5);
      cCtx.fillRect(rx, ry, rw, rh);
    }
    // Main deep fault rift line (dark black/brown)
    cCtx.strokeStyle = '#1a0c02';
    cCtx.lineWidth = 9;
    cCtx.lineCap = 'round';
    cCtx.lineJoin = 'round';
    cCtx.beginPath();
    cCtx.moveTo(10, 20);
    cCtx.lineTo(38, 48);
    cCtx.lineTo(60, 40);
    cCtx.lineTo(82, 85);
    cCtx.lineTo(118, 110);
    cCtx.stroke();

    // Branching fault cracks
    cCtx.lineWidth = 5;
    cCtx.beginPath();
    cCtx.moveTo(38, 48);
    cCtx.lineTo(20, 95);
    cCtx.moveTo(60, 40);
    cCtx.lineTo(95, 25);
    cCtx.moveTo(82, 85);
    cCtx.lineTo(60, 118);
    cCtx.stroke();

    // Crack inner glow/depth
    cCtx.strokeStyle = '#050201';
    cCtx.lineWidth = 3;
    cCtx.beginPath();
    cCtx.moveTo(10, 20);
    cCtx.lineTo(38, 48);
    cCtx.lineTo(60, 40);
    cCtx.lineTo(82, 85);
    cCtx.lineTo(118, 110);
    cCtx.stroke();

    const crackTex = new THREE.CanvasTexture(crackCanvas);

    // 6b. Cracked Side Texture (vertical fault lines down the sides)
    const crackSideCanvas = document.createElement('canvas');
    crackSideCanvas.width = 128;
    crackSideCanvas.height = 128;
    const csCtx = crackSideCanvas.getContext('2d');
    csCtx.fillStyle = '#5d4037';
    csCtx.fillRect(0, 0, 128, 128);
    csCtx.strokeStyle = '#1a0c02';
    csCtx.lineWidth = 6;
    csCtx.beginPath();
    csCtx.moveTo(64, 0);
    csCtx.lineTo(55, 45);
    csCtx.lineTo(70, 85);
    csCtx.lineTo(60, 128);
    csCtx.stroke();
    const crackSideTex = new THREE.CanvasTexture(crackSideCanvas);

    // 7. Magma Volcanic Lava Texture (Black Obsidian + Glowing Molten Red/Orange Cracks)
    const magmaCanvas = document.createElement('canvas');
    magmaCanvas.width = 128;
    magmaCanvas.height = 128;
    const mCtx = magmaCanvas.getContext('2d');
    // Dark volcanic basalt base
    mCtx.fillStyle = '#141416';
    mCtx.fillRect(0, 0, 128, 128);
    // Dark rocky noise
    mCtx.fillStyle = '#222226';
    for (let i = 0; i < 35; i++) {
      const rx = (i * 37 + 13) % 128;
      const ry = (i * 53 + 7) % 128;
      mCtx.fillRect(rx, ry, 6, 6);
    }
    // Wide glowing red lava veins
    mCtx.strokeStyle = '#d50000';
    mCtx.lineWidth = 12;
    mCtx.lineCap = 'round';
    mCtx.lineJoin = 'round';
    mCtx.beginPath();
    mCtx.moveTo(10, 64);
    mCtx.lineTo(45, 30);
    mCtx.lineTo(80, 55);
    mCtx.lineTo(120, 20);
    mCtx.moveTo(45, 30);
    mCtx.lineTo(35, 95);
    mCtx.lineTo(75, 115);
    mCtx.moveTo(80, 55);
    mCtx.lineTo(110, 90);
    mCtx.stroke();

    // Hot bright orange molten core
    mCtx.strokeStyle = '#ff6d00';
    mCtx.lineWidth = 6;
    mCtx.beginPath();
    mCtx.moveTo(10, 64);
    mCtx.lineTo(45, 30);
    mCtx.lineTo(80, 55);
    mCtx.lineTo(120, 20);
    mCtx.moveTo(45, 30);
    mCtx.lineTo(35, 95);
    mCtx.lineTo(75, 115);
    mCtx.moveTo(80, 55);
    mCtx.lineTo(110, 90);
    mCtx.stroke();

    // Sizzling yellow hot center lines
    mCtx.strokeStyle = '#ffeb3b';
    mCtx.lineWidth = 2.5;
    mCtx.beginPath();
    mCtx.moveTo(10, 64);
    mCtx.lineTo(45, 30);
    mCtx.lineTo(80, 55);
    mCtx.lineTo(120, 20);
    mCtx.moveTo(45, 30);
    mCtx.lineTo(35, 95);
    mCtx.lineTo(75, 115);
    mCtx.moveTo(80, 55);
    mCtx.lineTo(110, 90);
    mCtx.stroke();

    const magmaTopTex = new THREE.CanvasTexture(magmaCanvas);

    // 7b. Obsidian Rock Side Texture
    const obsCanvas = document.createElement('canvas');
    obsCanvas.width = 128;
    obsCanvas.height = 128;
    const oCtx = obsCanvas.getContext('2d');
    oCtx.fillStyle = '#1c1c1f';
    oCtx.fillRect(0, 0, 128, 128);
    oCtx.fillStyle = '#101012';
    oCtx.fillRect(0, 40, 128, 48);
    oCtx.strokeStyle = '#ff1744';
    oCtx.lineWidth = 4;
    oCtx.beginPath();
    oCtx.moveTo(30, 0); oCtx.lineTo(40, 45); oCtx.lineTo(25, 90); oCtx.lineTo(35, 128);
    oCtx.moveTo(90, 0); oCtx.lineTo(80, 55); oCtx.lineTo(95, 128);
    oCtx.stroke();
    const obsidianSideTex = new THREE.CanvasTexture(obsCanvas);

    return {
      grassTex,
      tntTex,
      tntFlashTex,
      arrowTex,
      trapHoleTex,
      waterTex,
      crackTex,
      crackSideTex,
      magmaTopTex,
      obsidianSideTex
    };
  }

  initMaterials() {
    return {
      grassFaceTop: new THREE.MeshLambertMaterial({ map: this.textures.grassTex, flatShading: true }),
      dirtLeft: new THREE.MeshLambertMaterial({ color: 0xc68b59, flatShading: true }),
      dirtRight: new THREE.MeshLambertMaterial({ color: 0x7a4820, flatShading: true }),
      dirtTop: new THREE.MeshLambertMaterial({ color: 0xc68b59, flatShading: true }),

      tntSide: new THREE.MeshLambertMaterial({ map: this.textures.tntTex, flatShading: true }),
      tntTop: new THREE.MeshLambertMaterial({ color: 0xff3b00, flatShading: true }),
      tntFlashingSide: new THREE.MeshLambertMaterial({ map: this.textures.tntFlashTex, emissive: 0xffeb3b, emissiveIntensity: 0.8, flatShading: true }),
      tntFlashingTop: new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xff1744, emissiveIntensity: 0.9, flatShading: true }),

      trapTop: new THREE.MeshLambertMaterial({ map: this.textures.trapHoleTex, flatShading: true }),
      spikeMetal: new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        metalness: 0.95,
        roughness: 0.1,
        flatShading: true
      }),

      arrowTop: new THREE.MeshLambertMaterial({ map: this.textures.arrowTex, flatShading: true }),
      crackTop: new THREE.MeshLambertMaterial({ map: this.textures.crackTex, flatShading: true }),
      crackSide: new THREE.MeshLambertMaterial({ map: this.textures.crackSideTex, flatShading: true }),

      // Clean vibrant cyan water
      waterTop: new THREE.MeshLambertMaterial({ color: 0x00d4ff, flatShading: true }),
      waterSide: new THREE.MeshLambertMaterial({ color: 0x0096c7, flatShading: true }),

      goldStar: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa000,
        emissiveIntensity: 0.35,
        metalness: 0.7,
        roughness: 0.2,
        flatShading: true
      }),

      starShadow: new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.35 }),
      magmaTop: new THREE.MeshStandardMaterial({
        map: this.textures.magmaTopTex,
        emissive: 0xff3700,
        emissiveIntensity: 0.85,
        roughness: 0.5,
        metalness: 0.1,
        flatShading: true
      }),
      obsidianSide: new THREE.MeshLambertMaterial({
        map: this.textures.obsidianSideTex,
        flatShading: true
      }),

      shieldJelly: new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00b0ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.65
      }),

      shieldRim: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0xff9100,
        emissiveIntensity: 0.25,
        flatShading: true
      }),

      shieldFace: new THREE.MeshStandardMaterial({
        color: 0x00b0ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.65,
        metalness: 0.3,
        roughness: 0.3,
        flatShading: true
      }),

      shieldEmblem: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.2,
        flatShading: true
      })
    };
  }

  initGeometries() {
    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      spikeCone: new THREE.ConeGeometry(0.24, 0.7, 4),
      shadowDisc: new THREE.PlaneGeometry(0.35, 0.35),
      sphere: new THREE.SphereGeometry(0.35, 12, 12)
    };
  }

  createCube(type, customData = {}) {
    const group = new THREE.Group();
    group.userData = { type, ...customData };

    switch (type) {
      case CUBE_TYPES.SAFE:
        this.buildGrassCube(group);
        break;
      case CUBE_TYPES.DIRT:
        this.buildDirtCube(group);
        break;
      case CUBE_TYPES.TREE:
        this.buildTreeCube(group);
        break;
      case CUBE_TYPES.RIVER:
        this.buildRiverCube(group, customData);
        break;
      case CUBE_TYPES.STAR:
        this.buildStarCube(group);
        break;
      case CUBE_TYPES.MAGMA:
        this.buildMagmaCube(group);
        break;
      case CUBE_TYPES.CRACKED:
        this.buildCrackedCube(group);
        break;
      case CUBE_TYPES.TRAP:
        this.buildTrapCube(group);
        break;
      case CUBE_TYPES.ARROW:
        this.buildArrowCube(group);
        break;
      case CUBE_TYPES.TNT:
        this.buildTNTCube(group);
        break;
      case CUBE_TYPES.SHIELD:
        this.buildShieldCube(group);
        break;
      default:
        this.buildGrassCube(group);
    }

    return group;
  }

  createBaseMesh(materials) {
    const mesh = new THREE.Mesh(this.geometries.box, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. Grass Cube
  buildGrassCube(group) {
    const materials = [
      this.materials.dirtRight,  // +X: Right visible face
      this.materials.dirtRight,  // -X: back
      this.materials.grassFaceTop,// +Y: Top visible face
      this.materials.dirtRight,  // -Y: bottom
      this.materials.dirtLeft,   // +Z: Left visible face
      this.materials.dirtLeft    // -Z: back
    ];
    group.add(this.createBaseMesh(materials));
  }

  // 2. Pure Dirt Cube
  buildDirtCube(group) {
    const materials = [
      this.materials.dirtRight,
      this.materials.dirtRight,
      this.materials.dirtTop,
      this.materials.dirtRight,
      this.materials.dirtLeft,
      this.materials.dirtLeft
    ];
    group.add(this.createBaseMesh(materials));
  }

  // 3. Tree Obstacle Cube
  buildTreeCube(group) {
    this.buildGrassCube(group);

    const tree = new THREE.Group();
    tree.position.y = 0.5;

    const greenMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32, flatShading: true });
    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), greenMat);
    tier1.position.y = 0.4;
    tier1.castShadow = true;
    tree.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.5), greenMat);
    tier2.position.y = 0.7;
    tier2.castShadow = true;
    tree.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), greenMat);
    tier3.position.y = 0.98;
    tier3.castShadow = true;
    tree.add(tier3);

    group.add(tree);
  }

  // 4. TNT Cube with Animated Flashing Support
  buildTNTCube(group) {
    const normalMaterials = [
      this.materials.tntSide,
      this.materials.tntSide,
      this.materials.tntTop,
      this.materials.tntTop,
      this.materials.tntSide,
      this.materials.tntSide
    ];
    const mesh = this.createBaseMesh(normalMaterials);
    group.add(mesh);

    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    spark.position.set(0, 0.65, 0);
    spark.visible = false;
    group.add(spark);

    group.userData.mesh = mesh;
    group.userData.sparkMesh = spark;
    group.userData.normalMaterials = normalMaterials;
  }

  // 5. Spike Trap Cube
  buildTrapCube(group) {
    const materials = [
      this.materials.dirtRight,
      this.materials.dirtRight,
      this.materials.trapTop,
      this.materials.dirtRight,
      this.materials.dirtLeft,
      this.materials.dirtLeft
    ];
    group.add(this.createBaseMesh(materials));

    const spike = new THREE.Mesh(this.geometries.spikeCone, this.materials.spikeMetal);
    spike.position.y = 0.15;
    spike.castShadow = true;
    group.add(spike);

    group.userData.spikeMesh = spike;
    group.userData.spikesActive = false;
  }

  // 6. Arrow / Direction Cube
  buildArrowCube(group) {
    const materials = [
      this.materials.dirtRight,
      this.materials.dirtRight,
      this.materials.arrowTop,
      this.materials.dirtRight,
      this.materials.dirtLeft,
      this.materials.dirtLeft
    ];
    group.add(this.createBaseMesh(materials));
  }

  // 7. Cracked Earth Fault Cube
  buildCrackedCube(group) {
    const materials = [
      this.materials.crackSide, // +X: Right visible face
      this.materials.dirtRight, // -X: back
      this.materials.crackTop,  // +Y: Top visible face (earth fault rift)
      this.materials.dirtRight, // -Y: bottom
      this.materials.crackSide, // +Z: Left visible face
      this.materials.dirtLeft   // -Z: back
    ];
    const mesh = this.createBaseMesh(materials);
    group.add(mesh);
    group.userData.mesh = mesh;
  }

  // 8. Clean River Waterfall Cube (Top + either Left (+Z) or Right (+X) face, NO white lines)
  buildRiverCube(group, customData = {}) {
    const dir = customData.riverDir || 'left';

    // +X (index 0) = Right visible face
    // +Z (index 4) = Left visible face
    // +Y (index 2) = Top visible face
    const rightSideMat = (dir === 'right') ? this.materials.waterSide : this.materials.dirtRight;
    const leftSideMat  = (dir === 'left')  ? this.materials.waterSide : this.materials.dirtLeft;

    const materials = [
      rightSideMat, // +X face
      rightSideMat, // -X face
      this.materials.waterTop, // +Y face
      this.materials.dirtRight, // -Y face
      leftSideMat,  // +Z face
      leftSideMat   // -Z face
    ];

    group.add(this.createBaseMesh(materials));
    group.userData.isRiver = true;
    group.userData.riverDir = dir;
  }

  // 9. Star Cube
  buildStarCube(group) {
    this.buildGrassCube(group);

    const shadow = new THREE.Mesh(this.geometries.shadowDisc, this.materials.starShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.51;
    group.add(shadow);

    const starShape = new THREE.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? 0.32 : 0.16;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.1, bevelEnabled: false });
    starGeo.center();

    const starMesh = new THREE.Mesh(starGeo, this.materials.goldStar);
    starMesh.position.y = 1.05;
    starMesh.castShadow = true;
    group.add(starMesh);

    group.userData.starMesh = starMesh;
  }

  // 10. Magma Volcanic Lava Cube (Black Obsidian + Glowing Molten Red Lava)
  buildMagmaCube(group) {
    const materials = [
      this.materials.obsidianSide, // +X face
      this.materials.obsidianSide, // -X face
      this.materials.magmaTop,     // +Y face (Black basalt + glowing fiery red/orange cracks)
      this.materials.obsidianSide, // -Y face
      this.materials.obsidianSide, // +Z face
      this.materials.obsidianSide  // -Z face
    ];
    const mesh = this.createBaseMesh(materials);
    group.add(mesh);
    group.userData.mesh = mesh;
    group.userData.isMagma = true;
  }

  // 11. Shield Power-up Cube (3D Heraldic Shield Icon with Golden Rim & Glowing Emblem)
  buildShieldCube(group) {
    this.buildGrassCube(group);

    // Drop shadow disc on top of the grass cube
    const shadow = new THREE.Mesh(this.geometries.shadowDisc, this.materials.starShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.51;
    group.add(shadow);

    const shieldGroup = new THREE.Group();
    shieldGroup.position.y = 1.05;

    // 1. Outer Heraldic Shield Frame (Golden Metallic Rim)
    const outerShape = new THREE.Shape();
    outerShape.moveTo(-0.24, 0.28);
    outerShape.lineTo(0.24, 0.28);
    outerShape.quadraticCurveTo(0.26, 0.0, 0.0, -0.32);
    outerShape.quadraticCurveTo(-0.26, 0.0, -0.24, 0.28);
    outerShape.closePath();

    const outerGeo = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015
    });
    outerGeo.center();
    const outerMesh = new THREE.Mesh(outerGeo, this.materials.shieldRim);
    outerMesh.castShadow = true;
    shieldGroup.add(outerMesh);

    // 2. Inset Shield Face (Glowing Cyan Core Plate)
    const innerShape = new THREE.Shape();
    innerShape.moveTo(-0.19, 0.23);
    innerShape.lineTo(0.19, 0.23);
    innerShape.quadraticCurveTo(0.20, 0.0, 0.0, -0.26);
    innerShape.quadraticCurveTo(-0.20, 0.0, -0.19, 0.23);
    innerShape.closePath();

    const innerGeo = new THREE.ExtrudeGeometry(innerShape, {
      depth: 0.07,
      bevelEnabled: false
    });
    innerGeo.center();
    const innerMesh = new THREE.Mesh(innerGeo, this.materials.shieldFace);
    shieldGroup.add(innerMesh);

    // 3. Central Heraldic Emblem (Glowing White / Platinum Cross)
    // Front Emblem
    const crossVF = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.20, 0.02), this.materials.shieldEmblem);
    crossVF.position.set(0, 0.03, 0.04);
    shieldGroup.add(crossVF);

    const crossHF = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.02), this.materials.shieldEmblem);
    crossHF.position.set(0, 0.06, 0.04);
    shieldGroup.add(crossHF);

    // Back Emblem (for 360-degree visibility while spinning)
    const crossVB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.20, 0.02), this.materials.shieldEmblem);
    crossVB.position.set(0, 0.03, -0.04);
    shieldGroup.add(crossVB);

    const crossHB = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.02), this.materials.shieldEmblem);
    crossHB.position.set(0, 0.06, -0.04);
    shieldGroup.add(crossHB);

    group.add(shieldGroup);
    group.userData.pickupMesh = shieldGroup;
  }
}

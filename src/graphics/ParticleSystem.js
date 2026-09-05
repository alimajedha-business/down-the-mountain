// 3D Particle Pools: Explosions, Shattered Voxel Debris, Splashes, and Star Dust (Zero GC Allocations)
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Shared geometries & materials for high-performance pooling
    this.cubeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    this.sparkGeo = new THREE.PlaneGeometry(0.12, 0.12);

    this.whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.dustMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8, transparent: true, opacity: 0.8 });
    this.orangeMat = new THREE.MeshBasicMaterial({ color: 0xff7043 });
    this.yellowMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    this.cyanMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.redMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.mudMat = new THREE.MeshBasicMaterial({ color: 0x6d4c2a });
    this.mudDarkMat = new THREE.MeshBasicMaterial({ color: 0x4a3218 });

    // Pre-created shatter material palettes (avoids per-particle shader compilation)
    this.shatterPalettes = new Map();

    // Particle Object Pool to eliminate GC churn and WebGL scene-graph modifications
    this.pool = [];
    this.activeParticles = [];
    this.initialPoolSize = 140;
    this.maxPoolSize = 250;

    for (let i = 0; i < this.initialPoolSize; i++) {
      this.createPoolEntry();
    }
  }

  createPoolEntry() {
    const mesh = new THREE.Mesh(this.cubeGeo, this.dustMat);
    mesh.visible = false;
    this.scene.add(mesh);

    const entry = {
      mesh,
      active: false,
      vx: 0,
      vy: 0,
      vz: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      gravity: 0,
      life: 0,
      maxLife: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      scaleZ: 1.0
    };
    this.pool.push(entry);
    return entry;
  }

  acquire(mat, x, y, z, scaleX = 1.0, scaleY = 1.0, scaleZ = 1.0) {
    let entry = null;

    // Search for an inactive entry in pool
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        entry = this.pool[i];
        break;
      }
    }

    // Expand pool dynamically if needed up to maxPoolSize
    if (!entry) {
      if (this.pool.length < this.maxPoolSize) {
        entry = this.createPoolEntry();
      } else {
        // Recycle the oldest active particle
        entry = this.activeParticles.shift();
        if (!entry) return null;
      }
    }

    entry.active = true;
    entry.mesh.material = mat;
    entry.mesh.position.set(x, y, z);
    entry.mesh.rotation.set(0, 0, 0);
    entry.scaleX = scaleX;
    entry.scaleY = scaleY;
    entry.scaleZ = scaleZ;
    entry.mesh.scale.set(scaleX, scaleY, scaleZ);
    entry.mesh.visible = true;

    this.activeParticles.push(entry);
    return entry;
  }

  // Get or create a shared material palette for shatter effects
  getShatterPalette(mainColor) {
    if (this.shatterPalettes.has(mainColor)) {
      return this.shatterPalettes.get(mainColor);
    }
    const palette = [
      new THREE.MeshLambertMaterial({ color: mainColor, flatShading: true }),
      new THREE.MeshLambertMaterial({ color: 0x00b4d8, flatShading: true }),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true }),
      new THREE.MeshLambertMaterial({ color: 0xffeb3b, flatShading: true }),
      new THREE.MeshLambertMaterial({ color: 0xff1744, flatShading: true })
    ];
    this.shatterPalettes.set(mainColor, palette);
    return palette;
  }

  // Dramatic Voxel Character Explosion when failing
  spawnCharacterShatter(position, mainColor = 0x64dd17) {
    const palette = this.getShatterPalette(mainColor);
    const count = 24;

    for (let i = 0; i < count; i++) {
      const mat = palette[i % palette.length];
      const px = position.x + (Math.random() - 0.5) * 0.4;
      const py = position.y + Math.random() * 0.6;
      const pz = position.z + (Math.random() - 0.5) * 0.4;

      const p = this.acquire(mat, px, py, pz, 1.0, 1.0, 1.0);
      if (!p) continue;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      const vy = 4.0 + Math.random() * 5.5;

      p.vx = Math.cos(angle) * speed;
      p.vy = vy;
      p.vz = Math.sin(angle) * speed;
      p.rotX = (Math.random() - 0.5) * 15;
      p.rotY = (Math.random() - 0.5) * 15;
      p.rotZ = (Math.random() - 0.5) * 15;
      p.gravity = 18.0;
      p.life = 1.2;
      p.maxLife = 1.2;
    }
  }

  // Landing Dust Puff
  spawnLandingDust(position) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const px = position.x + (Math.random() - 0.5) * 0.4;
      const py = position.y;
      const pz = position.z + (Math.random() - 0.5) * 0.4;

      const p = this.acquire(this.dustMat, px, py, pz, 0.6, 0.6, 0.6);
      if (!p) continue;

      const angle = (i / count) * Math.PI * 2;
      const speed = 1.0 + Math.random() * 0.8;

      p.vx = Math.cos(angle) * speed;
      p.vy = 0.8 + Math.random() * 0.8;
      p.vz = Math.sin(angle) * speed;
      p.rotX = Math.random() * 5;
      p.rotY = Math.random() * 5;
      p.rotZ = Math.random() * 5;
      p.gravity = 4.0;
      p.life = 0.35;
      p.maxLife = 0.35;
    }
  }

  // Star Collection Sparkle Burst
  spawnStarSparkles(position) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const p = this.acquire(this.yellowMat, position.x, position.y, position.z, 0.8, 0.8, 0.8);
      if (!p) continue;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 2.2;

      p.vx = Math.cos(angle) * speed;
      p.vy = 2.5 + Math.random() * 3.0;
      p.vz = Math.sin(angle) * speed;
      p.rotX = Math.random() * 10;
      p.rotY = Math.random() * 10;
      p.rotZ = Math.random() * 10;
      p.gravity = 8.0;
      p.life = 0.6;
      p.maxLife = 0.6;
    }
  }

  // TNT & Hazard Explosions
  spawnExplosion(position) {
    const count = 28;
    const colors = [this.orangeMat, this.yellowMat, this.redMat, this.whiteMat];

    for (let i = 0; i < count; i++) {
      const mat = colors[i % colors.length];
      const p = this.acquire(mat, position.x, position.y, position.z, 1.2, 1.2, 1.2);
      if (!p) continue;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 4.0 + Math.random() * 5.0;

      p.vx = Math.sin(phi) * Math.cos(theta) * speed;
      p.vy = Math.cos(phi) * speed + 3.0;
      p.vz = Math.sin(phi) * Math.sin(theta) * speed;
      p.rotX = Math.random() * 15;
      p.rotY = Math.random() * 15;
      p.rotZ = Math.random() * 15;
      p.gravity = 12.0;
      p.life = 0.8;
      p.maxLife = 0.8;
    }
  }

  // River Splash Drops
  spawnRiverSplash(position) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const p = this.acquire(this.cyanMat, position.x, position.y, position.z, 0.6, 0.6, 0.6);
      if (!p) continue;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;

      p.vx = Math.cos(angle) * speed;
      p.vy = 2.0 + Math.random() * 2.0;
      p.vz = Math.sin(angle) * speed;
      p.rotX = Math.random() * 8;
      p.rotY = Math.random() * 8;
      p.rotZ = Math.random() * 8;
      p.gravity = 10.0;
      p.life = 0.45;
      p.maxLife = 0.45;
    }
  }

  // Crumbly Debris from Collapsed / Broken Blocks
  spawnCrumblyDebris(position) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const px = position.x + (Math.random() - 0.5) * 0.6;
      const py = position.y + 0.2;
      const pz = position.z + (Math.random() - 0.5) * 0.6;

      const p = this.acquire(this.dustMat, px, py, pz, 0.7, 0.7, 0.7);
      if (!p) continue;

      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = Math.random() * 2.0;
      p.vz = (Math.random() - 0.5) * 1.5;
      p.rotX = Math.random() * 5;
      p.rotY = Math.random() * 5;
      p.rotZ = Math.random() * 5;
      p.gravity = 15.0;
      p.life = 0.5;
      p.maxLife = 0.5;
    }
  }

  // Magma Embers
  spawnLavaEmbers(position) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const p = this.acquire(this.redMat, position.x, position.y, position.z, 0.7, 0.7, 0.7);
      if (!p) continue;

      p.vx = (Math.random() - 0.5) * 2.0;
      p.vy = 3.0 + Math.random() * 3.0;
      p.vz = (Math.random() - 0.5) * 2.0;
      p.rotX = Math.random() * 8;
      p.rotY = Math.random() * 8;
      p.rotZ = Math.random() * 8;
      p.gravity = 8.0;
      p.life = 0.7;
      p.maxLife = 0.7;
    }
  }

  // Bear Disappear Poof (Fluffy white/smoke puff)
  spawnBearPoof(position) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const px = position.x + (Math.random() - 0.5) * 0.35;
      const py = position.y + Math.random() * 0.4;
      const pz = position.z + (Math.random() - 0.5) * 0.35;

      const p = this.acquire(this.whiteMat, px, py, pz, 0.85, 0.85, 0.85);
      if (!p) continue;

      const angle = (i / count) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.0;

      p.vx = Math.cos(angle) * speed;
      p.vy = 2.0 + Math.random() * 2.5;
      p.vz = Math.sin(angle) * speed;
      p.rotX = Math.random() * 6;
      p.rotY = Math.random() * 6;
      p.rotZ = Math.random() * 6;
      p.gravity = 4.0;
      p.life = 0.8;
      p.maxLife = 0.8;
    }
  }

  // Bear Shatter on Defeat (Brown voxel burst)
  spawnBearShatter(position) {
    this.spawnCharacterShatter(position, 0x5d4037);
  }

  // Mud / Clay Splatter (brown globs when stepping on dirt)
  spawnMudSplatter(position) {
    const count = 8;
    const mats = [this.mudMat, this.mudDarkMat];
    for (let i = 0; i < count; i++) {
      const mat = mats[i % mats.length];
      const px = position.x + (Math.random() - 0.5) * 0.3;
      const py = position.y;
      const pz = position.z + (Math.random() - 0.5) * 0.3;

      const p = this.acquire(mat, px, py, pz, 0.5, 0.3, 0.5);
      if (!p) continue;

      const angle = (i / count) * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.2;

      p.vx = Math.cos(angle) * speed;
      p.vy = 1.2 + Math.random() * 1.0;
      p.vz = Math.sin(angle) * speed;
      p.rotX = Math.random() * 4;
      p.rotY = Math.random() * 4;
      p.rotZ = Math.random() * 4;
      p.gravity = 6.0;
      p.life = 0.5;
      p.maxLife = 0.5;
    }
  }

  update(delta) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= delta;

      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        this.activeParticles.splice(i, 1);
        continue;
      }

      // Physics Integration
      p.vy -= p.gravity * delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      p.mesh.rotation.x += p.rotX * delta;
      p.mesh.rotation.y += p.rotY * delta;
      p.mesh.rotation.z += p.rotZ * delta;

      // Scale fade
      const progress = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.set(
        p.scaleX * progress,
        p.scaleY * progress,
        p.scaleZ * progress
      );
    }
  }
}

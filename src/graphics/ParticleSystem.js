// 3D Particle Pools: Explosions, Shattered Voxel Debris, Splashes, and Star Dust
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Shared geometries & materials for high-performance pooling
    this.cubeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    this.sparkGeo = new THREE.PlaneGeometry(0.12, 0.12);

    this.whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.dustMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8, transparent: true, opacity: 0.8 });
    this.orangeMat = new THREE.MeshBasicMaterial({ color: 0xff7043 });
    this.yellowMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    this.cyanMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.redMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
  }

  // Dramatic Voxel Character Explosion when failing
  spawnCharacterShatter(position, mainColor = 0x64dd17) {
    const colors = [mainColor, 0x00b4d8, 0x1a1a1a, 0xffeb3b, 0xff1744];
    const count = 24;

    for (let i = 0; i < count; i++) {
      const col = colors[i % colors.length];
      const mat = new THREE.MeshLambertMaterial({ color: col, flatShading: true });
      const mesh = new THREE.Mesh(this.cubeGeo, mat);

      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.4;
      mesh.position.y += Math.random() * 0.6;
      mesh.position.z += (Math.random() - 0.5) * 0.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      const vy = 4.0 + Math.random() * 5.5;

      const p = {
        mesh,
        vx: Math.cos(angle) * speed,
        vy: vy,
        vz: Math.sin(angle) * speed,
        rotX: (Math.random() - 0.5) * 15,
        rotY: (Math.random() - 0.5) * 15,
        rotZ: (Math.random() - 0.5) * 15,
        gravity: 18.0,
        life: 1.2,
        maxLife: 1.2
      };

      this.scene.add(mesh);
      this.particles.push(p);
    }
  }

  // Landing Dust Puff
  spawnLandingDust(position) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, this.dustMat);
      mesh.scale.set(0.6, 0.6, 0.6);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.4,
        position.y,
        position.z + (Math.random() - 0.5) * 0.4
      );

      const angle = (i / count) * Math.PI * 2;
      const speed = 1.0 + Math.random() * 0.8;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 0.8 + Math.random() * 0.8,
        vz: Math.sin(angle) * speed,
        rotX: Math.random() * 5,
        rotY: Math.random() * 5,
        rotZ: Math.random() * 5,
        gravity: 4.0,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  // Star Collection Sparkle Burst
  spawnStarSparkles(position) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, this.yellowMat);
      mesh.scale.set(0.8, 0.8, 0.8);
      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 2.2;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2.5 + Math.random() * 3.0,
        vz: Math.sin(angle) * speed,
        rotX: Math.random() * 10,
        rotY: Math.random() * 10,
        rotZ: Math.random() * 10,
        gravity: 8.0,
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  // TNT & Hazard Explosions
  spawnExplosion(position) {
    const count = 28;
    const colors = [this.orangeMat, this.yellowMat, this.redMat, this.whiteMat];

    for (let i = 0; i < count; i++) {
      const mat = colors[i % colors.length];
      const mesh = new THREE.Mesh(this.cubeGeo, mat);
      mesh.scale.set(1.2, 1.2, 1.2);
      mesh.position.copy(position);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 4.0 + Math.random() * 5.0;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed + 3.0,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        rotX: Math.random() * 15,
        rotY: Math.random() * 15,
        rotZ: Math.random() * 15,
        gravity: 12.0,
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  // River Splash Drops
  spawnRiverSplash(position) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, this.cyanMat);
      mesh.scale.set(0.6, 0.6, 0.6);
      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2.0 + Math.random() * 2.0,
        vz: Math.sin(angle) * speed,
        rotX: Math.random() * 8,
        rotY: Math.random() * 8,
        rotZ: Math.random() * 8,
        gravity: 10.0,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  // Crumbly Debris from Collapsed / Broken Blocks
  spawnCrumblyDebris(position) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, this.dustMat);
      mesh.position.set(
        position.x + (Math.random() - 0.5) * 0.6,
        position.y + 0.2,
        position.z + (Math.random() - 0.5) * 0.6
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2.0,
        vz: (Math.random() - 0.5) * 1.5,
        rotX: Math.random() * 5,
        rotY: Math.random() * 5,
        rotZ: Math.random() * 5,
        gravity: 15.0,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  // Magma Embers
  spawnLavaEmbers(position) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, this.redMat);
      mesh.scale.set(0.7, 0.7, 0.7);
      mesh.position.copy(position);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 2.0,
        vy: 3.0 + Math.random() * 3.0,
        vz: (Math.random() - 0.5) * 2.0,
        rotX: Math.random() * 8,
        rotY: Math.random() * 8,
        rotZ: Math.random() * 8,
        gravity: 8.0,
        life: 0.7,
        maxLife: 0.7
      });
    }
  }

  // Bear Disappear Poof (Fluffy white/smoke puff)
  spawnBearPoof(position) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, this.whiteMat);
      mesh.scale.set(0.85, 0.85, 0.85);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.35;
      mesh.position.y += Math.random() * 0.4;
      mesh.position.z += (Math.random() - 0.5) * 0.35;

      const angle = (i / count) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.0;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2.0 + Math.random() * 2.5,
        vz: Math.sin(angle) * speed,
        rotX: Math.random() * 6,
        rotY: Math.random() * 6,
        rotZ: Math.random() * 6,
        gravity: 4.0,
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  // Bear Shatter on Defeat (Brown voxel burst)
  spawnBearShatter(position) {
    this.spawnCharacterShatter(position, 0x5d4037);
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
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
      const progress = p.life / p.maxLife;
      const s = progress;
      p.mesh.scale.set(s, s, s);
    }
  }
}

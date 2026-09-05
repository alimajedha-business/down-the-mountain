// Three.js True Isometric 45-degree Scene, Camera with Screen Shake, Lighting, Purple Sky, and Cartoon Clouds
import * as THREE from 'three';
import { BIOMES } from '../config.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth || 800;
    this.height = container.clientHeight || window.innerHeight || 600;

    // Camera follow & transform state: Isometric (D, H, D) offset rotated 45 deg to right
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    const d = 20;
    this.cameraOffset = new THREE.Vector3(d, d * 1.35, d);

    // Screen Shake state
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    this.currentBiomeIndex = 0;

    this.scene = new THREE.Scene();
    this.initCamera();
    this.initRenderer();
    this.initLighting();
    this.initBackground();
    this.initClouds();

    window.addEventListener('resize', () => this.handleResize());
  }

  initCamera() {
    const aspect = this.width / this.height;
    const frustumSize = aspect < 0.7 ? 12.0 : 10.5;

    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -60,
      120
    );

    this.updateCameraPosition();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  initLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.95);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(30, 45, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    const d = 14;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;

    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.fillLight = new THREE.DirectionalLight(0xd1c4e9, 0.45);
    this.fillLight.position.set(-10, 15, 30);
    this.scene.add(this.fillLight);

    this.updateCameraPosition();
  }

  initBackground() {
    const initialBiome = BIOMES[0];
    this.scene.fog = new THREE.FogExp2(initialBiome.fogColor, 0.012);
    this.updateSkyColors(initialBiome.skyTop, initialBiome.skyBottom);
  }

  updateSkyColors(colorTop, colorBottom) {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2;
    bgCanvas.height = 512;
    const ctx = bgCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, colorTop);
    grad.addColorStop(1, colorBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(bgCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    if (this.scene.background && this.scene.background.dispose) {
      this.scene.background.dispose();
    }
    this.scene.background = texture;
  }

  initClouds() {
    this.cloudGroup = new THREE.Group();
    this.scene.add(this.cloudGroup);

    this.clouds = [];
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0x9366a8,
      transparent: true,
      opacity: 0.85,
      flatShading: true
    });

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < 18; i++) {
      const cloud = new THREE.Group();
      const parts = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < parts; p++) {
        const mesh = new THREE.Mesh(boxGeo, cloudMat);
        mesh.scale.set(
          1.6 + Math.random() * 1.8,
          0.7 + Math.random() * 0.4,
          1.0 + Math.random() * 1.2
        );
        mesh.position.set(
          (p - parts / 2) * 1.2,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.8
        );
        cloud.add(mesh);
      }

      const side = (i % 2 === 0) ? -1 : 1;
      cloud.position.set(
        side * (6.0 + Math.random() * 6.0),
        5 - i * 4.5,
        side * (4.0 + Math.random() * 5.0)
      );

      cloud.userData = {
        speed: 0.25 + Math.random() * 0.3,
        baseX: cloud.position.x
      };

      this.clouds.push(cloud);
      this.cloudGroup.add(cloud);
    }
  }

  // Trigger high-impact camera screen shake
  shake(intensity = 0.45, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  setBiome(biomeIndex) {
    if (this.currentBiomeIndex !== biomeIndex) {
      this.currentBiomeIndex = biomeIndex;
      const b = BIOMES[biomeIndex % BIOMES.length];
      this.updateSkyColors(b.skyTop, b.skyBottom);
      if (this.scene.fog) {
        this.scene.fog.color.set(b.fogColor);
      }
      if (this.dirLight) {
        this.dirLight.color.set(b.lightColor);
        this.dirLight.intensity = b.lightIntensity;
      }
    }
  }

  setCameraTarget(targetPos, immediate = false, delta = null) {
    if (!targetPos) return;
    if (immediate) {
      this.cameraTarget.copy(targetPos);
    } else {
      const dt = delta !== null ? delta : (this.lastDelta || 0.016);
      // Exponential decay smoothing: framerate-independent, zero micro-judder
      const factor = 1 - Math.exp(-14 * dt);
      this.cameraTarget.lerp(targetPos, factor);
    }
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    if (!this.camera || !this.cameraTarget || !this.cameraOffset) return;

    let shakeX = 0;
    let shakeY = 0;
    let shakeZ = 0;

    if (this.shakeTimer > 0) {
      const decay = this.shakeTimer / this.shakeDuration;
      const mag = this.shakeIntensity * decay;
      shakeX = (Math.random() - 0.5) * 2 * mag;
      shakeY = (Math.random() - 0.5) * 2 * mag;
      shakeZ = (Math.random() - 0.5) * 2 * mag;
    }

    this.camera.position.x = this.cameraTarget.x + this.cameraOffset.x + shakeX;
    this.camera.position.y = this.cameraTarget.y + this.cameraOffset.y + shakeY;
    this.camera.position.z = this.cameraTarget.z + this.cameraOffset.z + shakeZ;
    this.camera.lookAt(this.cameraTarget);

    if (this.dirLight && this.dirLight.target) {
      this.dirLight.position.set(
        this.cameraTarget.x + 30,
        this.cameraTarget.y + 45,
        this.cameraTarget.z + 10
      );
      this.dirLight.target.position.copy(this.cameraTarget);
    }
  }

  handleResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    const aspect = this.width / this.height;
    const frustumSize = aspect < 0.7 ? 12.0 : 10.5;

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  update(delta) {
    this.lastDelta = delta;
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
      }
      this.updateCameraPosition();
    }

    if (this.clouds) {
      this.clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed * delta;
        if (cloud.position.y > this.cameraTarget.y + 12) {
          cloud.position.y -= 50;
          cloud.position.x = cloud.userData.baseX;
        } else if (cloud.position.y < this.cameraTarget.y - 38) {
          cloud.position.y += 50;
          cloud.position.x = cloud.userData.baseX;
        }
      });
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

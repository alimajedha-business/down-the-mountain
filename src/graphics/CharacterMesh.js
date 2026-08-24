// 3D GLB Character Model (character-v3.glb) with Meshopt Compression Support, Hop Physics, & Shield FX
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export class CharacterMesh {
  constructor() {
    this.root = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    this.modelWrapper = new THREE.Group();
    this.bodyGroup.add(this.modelWrapper);

    this.gltfModel = null;
    this.shieldMesh = null;
    this.isLoaded = false;

    // Build Shield Bubble
    this.buildShieldBubble();

    // Load the custom GLB character model
    this.loadGLBCharacter();
  }

  loadGLBCharacter() {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
    const modelUrl = baseUrl.endsWith('/') ? baseUrl + 'character-v3.glb' : baseUrl + '/character-v3.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Enhance materials and enable shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = 0.45;
              child.material.metalness = 0.1;
              child.material.needsUpdate = true;
            }
          }
        });

        // Compute Bounding Box to normalize scale and ground feet
        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Scale character to fit the isometric mountain cubes (ideal height ~0.92)
        const targetHeight = 0.92;
        const currentHeight = size.y > 0 ? size.y : 1.0;
        const scaleFactor = targetHeight / currentHeight;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center on X and Z, align base of feet to Y = 0
        model.position.x = -center.x * scaleFactor;
        model.position.y = -bbox.min.y * scaleFactor;
        model.position.z = -center.z * scaleFactor;

        this.gltfModel = model;
        this.modelWrapper.add(model);
        this.isLoaded = true;
      },
      undefined,
      (error) => {
        console.error('Error loading character-v3.glb:', error);
      }
    );
  }

  // --- Jelly Shield Bubble Mesh ---
  buildShieldBubble() {
    const shieldGeo = new THREE.SphereGeometry(0.85, 20, 20);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00b0ff,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.3
    });

    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 0.48;
    this.shieldMesh.visible = false;
    this.root.add(this.shieldMesh);
  }

  setShieldActive(active) {
    if (this.shieldMesh) {
      this.shieldMesh.visible = active;
    }
  }

  // --- Dynamic Jump & Idle Animations ---
  update(delta, isMoving = false, hopProgress = 0) {
    // Shield Bubble Pulse
    if (this.shieldMesh && this.shieldMesh.visible) {
      const time = performance.now() * 0.005;
      const pulseScale = 1.0 + Math.sin(time) * 0.06;
      this.shieldMesh.scale.set(pulseScale, pulseScale, pulseScale);
    }

    // Parabolic Hop Squash & Stretch Animation
    if (isMoving) {
      const squashFactor = Math.sin(hopProgress * Math.PI);
      this.bodyGroup.scale.set(
        1.0 - squashFactor * 0.10,
        1.0 + squashFactor * 0.18,
        1.0 - squashFactor * 0.10
      );
      this.bodyGroup.rotation.x = Math.sin(hopProgress * Math.PI) * 0.15;
    } else {
      const time = performance.now() * 0.003;
      const idleSquash = 1.0 + Math.sin(time) * 0.025;
      this.bodyGroup.scale.set(1.0 / idleSquash, idleSquash, 1.0 / idleSquash);
      this.bodyGroup.rotation.x = 0;
    }
  }
}

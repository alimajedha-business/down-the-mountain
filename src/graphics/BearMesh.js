// 3D GLB Bear Model (bear-v1.glb) with Meshopt Compression Support & Hop Physics
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export class BearMesh {
  constructor() {
    this.root = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    this.modelWrapper = new THREE.Group();
    this.bodyGroup.add(this.modelWrapper);

    this.gltfModel = null;
    this.isLoaded = false;

    // Load the custom GLB bear character model
    this.loadGLBBear();
  }

  loadGLBBear() {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
    const modelUrl = baseUrl.endsWith('/') ? baseUrl + 'bear-v1.glb' : baseUrl + '/bear-v1.glb';

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

        // Scale bear to fit the isometric mountain cubes (formidable height ~0.96)
        const targetHeight = 0.96;
        const currentHeight = size.y > 0 ? size.y : 1.0;
        const scaleFactor = targetHeight / currentHeight;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center on X and Z, align base of feet to Y = 0
        model.position.x = -center.x * scaleFactor;
        model.position.y = -bbox.min.y * scaleFactor;
        model.position.z = -center.z * scaleFactor;

        // Orient model so face points forward along +Z (matching game directional physics)
        this.modelWrapper.rotation.y = -Math.PI / 2;

        this.gltfModel = model;
        this.modelWrapper.add(model);
        this.isLoaded = true;
      },
      undefined,
      (error) => {
        console.error('Error loading bear-v1.glb:', error);
      }
    );
  }

  // --- Dynamic Jump & Idle Animations ---
  update(delta, isMoving = false, hopProgress = 0, isSliding = false) {
    if (isSliding) {
      // Leaning back down the waterfall
      this.bodyGroup.rotation.x = -0.35;
      this.bodyGroup.rotation.z = Math.sin(performance.now() * 0.015) * 0.12;
      this.bodyGroup.scale.set(1.0, 1.0, 1.0);
      return;
    }

    if (isMoving) {
      // Parabolic Hop Squash & Stretch Animation
      const jumpArc = Math.sin(hopProgress * Math.PI);
      const scaleY = 1.0 + jumpArc * 0.22 - Math.sin(hopProgress * Math.PI * 2) * 0.08;
      const scaleXZ = 1.0 - jumpArc * 0.10;

      this.bodyGroup.scale.set(scaleXZ, scaleY, scaleXZ);
      this.bodyGroup.rotation.x = Math.sin(hopProgress * Math.PI) * 0.18;
      this.bodyGroup.rotation.z = 0;
    } else {
      // Idle Breathing & Subtle Cubic Sway
      const idleTime = performance.now() * 0.003;
      const breath = Math.sin(idleTime) * 0.025;

      this.bodyGroup.scale.set(1.0 + breath * 0.5, 1.0 + breath, 1.0 + breath * 0.5);
      this.bodyGroup.rotation.x = 0;
      this.bodyGroup.rotation.z = Math.sin(idleTime * 0.8) * 0.03;
    }
  }
}

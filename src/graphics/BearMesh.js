// 3D Voxel Cubic Bear Mesh with Expressive Anatomy & Animations
import * as THREE from 'three';

export class BearMesh {
  constructor() {
    this.root = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    this.frontLeftLeg = null;
    this.frontRightLeg = null;
    this.backLeftLeg = null;
    this.backRightLeg = null;
    this.head = null;
    this.snout = null;

    this.buildBear();
  }

  createBox(w, h, d, colorOrMat, x = 0, y = 0, z = 0, parent = this.bodyGroup, castShadow = true) {
    const mat = (colorOrMat instanceof THREE.Material)
      ? colorOrMat
      : new THREE.MeshLambertMaterial({ color: colorOrMat, flatShading: true });

    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  buildBear() {
    const furMain = 0x5d4037;   // Warm deep brown
    const furLight = 0x8d6e63;  // Muzzle & belly light brown
    const innerEar = 0xd7ccc8;  // Tan inner ear
    const noseBlack = 0x1a1a1a; // Glossy black nose/eyes
    const whiteHl = 0xffffff;   // Eye highlight
    const clawCol = 0x271c19;   // Dark claw accents

    // 1. Torso / Main Body
    const torsoY = 0.28;
    this.createBox(0.52, 0.42, 0.50, furMain, 0, torsoY, 0);

    // Light Tan Belly Patch
    this.createBox(0.36, 0.30, 0.04, furLight, 0, torsoY - 0.02, 0.25);

    // Cute Little Tail at Back
    this.createBox(0.12, 0.12, 0.10, furMain, 0, torsoY + 0.04, -0.28);

    // 2. Head Group
    this.head = new THREE.Group();
    this.head.position.set(0, torsoY + 0.28, 0.12);

    // Main Cubic Head
    this.createBox(0.44, 0.38, 0.38, furMain, 0, 0, 0, this.head);

    // Protruding Muzzle / Snout
    this.snout = this.createBox(0.24, 0.18, 0.16, furLight, 0, -0.05, 0.22, this.head);

    // Black Nose
    this.createBox(0.09, 0.07, 0.06, noseBlack, 0, -0.01, 0.30, this.head);

    // Open Mouth Detail under Snout
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x880e4f });
    this.createBox(0.10, 0.04, 0.02, mouthMat, 0, -0.11, 0.21, this.head);

    // Eyes with White Glints
    const eyeMat = new THREE.MeshBasicMaterial({ color: noseBlack });
    const hlMat = new THREE.MeshBasicMaterial({ color: whiteHl });

    // Left Eye
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.02), eyeMat);
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.022), hlMat);
    hlL.position.set(0.018, 0.02, 0.005);
    eyeL.add(hlL);
    eyeL.position.set(-0.12, 0.05, 0.19);
    this.head.add(eyeL);

    // Right Eye
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.02), eyeMat);
    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.022), hlMat);
    hlR.position.set(0.018, 0.02, 0.005);
    eyeR.add(hlR);
    eyeR.position.set(0.12, 0.05, 0.19);
    this.head.add(eyeR);

    // Bear Ears (Outer Brown + Inner Tan)
    // Left Ear
    const earL = new THREE.Group();
    earL.position.set(-0.18, 0.22, -0.02);
    this.createBox(0.12, 0.12, 0.08, furMain, 0, 0, 0, earL);
    this.createBox(0.07, 0.07, 0.02, innerEar, 0, 0, 0.045, earL);
    this.head.add(earL);

    // Right Ear
    const earR = new THREE.Group();
    earR.position.set(0.18, 0.22, -0.02);
    this.createBox(0.12, 0.12, 0.08, furMain, 0, 0, 0, earR);
    this.createBox(0.07, 0.07, 0.02, innerEar, 0, 0, 0.045, earR);
    this.head.add(earR);

    this.bodyGroup.add(this.head);

    // 3. Four Animated Cubic Paws / Limbs
    // Front Left Leg
    this.frontLeftLeg = new THREE.Group();
    this.frontLeftLeg.position.set(-0.20, 0.22, 0.16);
    this.createBox(0.14, 0.24, 0.14, furMain, 0, -0.10, 0, this.frontLeftLeg);
    this.createBox(0.12, 0.04, 0.04, clawCol, 0, -0.20, 0.07, this.frontLeftLeg);
    this.bodyGroup.add(this.frontLeftLeg);

    // Front Right Leg
    this.frontRightLeg = new THREE.Group();
    this.frontRightLeg.position.set(0.20, 0.22, 0.16);
    this.createBox(0.14, 0.24, 0.14, furMain, 0, -0.10, 0, this.frontRightLeg);
    this.createBox(0.12, 0.04, 0.04, clawCol, 0, -0.20, 0.07, this.frontRightLeg);
    this.bodyGroup.add(this.frontRightLeg);

    // Back Left Leg
    this.backLeftLeg = new THREE.Group();
    this.backLeftLeg.position.set(-0.20, 0.20, -0.16);
    this.createBox(0.15, 0.22, 0.16, furMain, 0, -0.09, 0, this.backLeftLeg);
    this.createBox(0.13, 0.04, 0.04, clawCol, 0, -0.18, 0.08, this.backLeftLeg);
    this.bodyGroup.add(this.backLeftLeg);

    // Back Right Leg
    this.backRightLeg = new THREE.Group();
    this.backRightLeg.position.set(0.20, 0.20, -0.16);
    this.createBox(0.15, 0.22, 0.16, furMain, 0, -0.09, 0, this.backRightLeg);
    this.createBox(0.13, 0.04, 0.04, clawCol, 0, -0.18, 0.08, this.backRightLeg);
    this.bodyGroup.add(this.backRightLeg);
  }

  update(delta, isMoving, hopProgress = 0, isSliding = false) {
    if (isSliding) {
      // Leaning back and waving paws down the waterfall
      this.bodyGroup.rotation.x = -0.35;
      this.bodyGroup.rotation.z = Math.sin(performance.now() * 0.015) * 0.12;
      this.frontLeftLeg.rotation.x = -0.8;
      this.frontRightLeg.rotation.x = -0.8;
      this.backLeftLeg.rotation.x = 0.4;
      this.backRightLeg.rotation.x = 0.4;
      return;
    }

    if (isMoving) {
      // Parabolic Hop Cycle Animations (Squash, Stretch, Limb Swings)
      const t = hopProgress;
      const jumpArc = Math.sin(t * Math.PI);

      // Vertical stretch in air, squash on landing
      const scaleY = 1.0 + jumpArc * 0.22 - Math.sin(t * Math.PI * 2) * 0.08;
      const scaleXZ = 1.0 - jumpArc * 0.10;
      this.bodyGroup.scale.set(scaleXZ, scaleY, scaleXZ);

      // Pitch forward slightly during hop
      this.bodyGroup.rotation.x = Math.sin(t * Math.PI) * 0.25;
      this.bodyGroup.rotation.z = 0;

      // Dynamic Leg Swings
      const legSwing = Math.sin(t * Math.PI) * 0.75;
      this.frontLeftLeg.rotation.x = -legSwing;
      this.frontRightLeg.rotation.x = -legSwing;
      this.backLeftLeg.rotation.x = legSwing * 0.6;
      this.backRightLeg.rotation.x = legSwing * 0.6;

      // Head Bob
      if (this.head) {
        this.head.rotation.x = -Math.sin(t * Math.PI) * 0.15;
      }
    } else {
      // Idle Breathing & Subtle Head Wobble
      const idleTime = performance.now() * 0.003;
      const breath = Math.sin(idleTime) * 0.03;

      this.bodyGroup.scale.set(1.0 + breath * 0.5, 1.0 + breath, 1.0 + breath * 0.5);
      this.bodyGroup.rotation.x = 0;
      this.bodyGroup.rotation.z = 0;

      this.frontLeftLeg.rotation.x = 0;
      this.frontRightLeg.rotation.x = 0;
      this.backLeftLeg.rotation.x = 0;
      this.backRightLeg.rotation.x = 0;

      if (this.head) {
        this.head.rotation.x = Math.sin(idleTime * 0.8) * 0.05;
        this.head.rotation.y = Math.sin(idleTime * 0.5) * 0.08;
      }
    }
  }
}

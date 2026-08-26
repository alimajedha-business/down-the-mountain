# Down the Mountain 3D ⛰️

An isometric arcade descent game built with **Three.js**, procedural voxel graphics, dynamic hazard physics, particle effects, and adaptive sound design.

![Down the Mountain Banner](public/og-image.png)

## 📖 Complete Documentation & Guide

For the full detailed manual with in-depth explanations of every cube behavior, hazard timers, biomes, scoring, and pro survival tips, check out the:

👉 **[Complete User Guide (USER_GUIDE.md)](./USER_GUIDE.md)**

---

## 🎮 Quick Start & Controls

| Action | Controls |
| :--- | :--- |
| **Hop Down-Left** | `Left Arrow` / `A` / Tap Left side of screen |
| **Hop Down-Right** | `Right Arrow` / `D` / Tap Right side of screen |
| **Pause / Resume** | `P` / `Escape` / `Space` / Top-left Pause button |
| **In-Game Guide** | Tap **RULES / CUBE GUIDE** in the Main Menu, Pause Menu, or Game Over screen |

---

## 🧊 Cube Behaviors At A Glance

- 🟩 **Grass Cube**: Safe standard footing.
- 🟤 **Clay / Mud Cube**: Sticks to feet, slowing the next 3 jumps by 2.5×.
- 🌲 **Tree Cube**: Solid barrier that blocks passage and bounces you back.
- 🌊 **Waterfall / River Cube**: Slides you rapidly downhill along the current.
- ⭐ **Star Cube**: Collect for +5 score and +1 star coin.
- 🌋 **Magma Cube**: Instant fatal burn unless shielded.
- 💥 **Cracked Earth Cube**: 2.0s tremor countdown before crumbling into the void.
- ⚙️ **Spike Trap Cube**: Cycles 2.0s hidden (safe) / 1.0s raised (fatal).
- 🧨 **TNT Cube**: 2.0s flashing fuse; detonates adjacent TNT in 1.0s domino chains.
- 🛡️ **Shield Power-Up**: Grants 4.0s total invulnerability & destroys the bear.
- 🐻 **Roaming Cubic Bear**: Patrols diamond loops ahead; fatal on contact unless shielded.
- 🏔️ **Mountain Avalanche**: Top-down collapse (1 row every 0.4s) chasing you from behind.

---

## 🛠️ Development & Running Locally

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build
```

---

## 🚀 Technologies

- **Three.js**: 3D Isometric scene rendering, custom procedural voxel textures, dynamic lighting, and camera tracking.
- **Web Audio API**: Real-time synthesized and layered audio effects.
- **Vanilla CSS & Modern HTML5**: Responsive glassmorphic UI, HUD overlays, and mobile touch zones.

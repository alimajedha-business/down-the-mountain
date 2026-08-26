# Down the Mountain — Player's Manual & Cube Guide

Welcome to **Down the Mountain 3D**, a fast-paced arcade descent game! Your goal is to guide your character down an endless, procedurally generated isometric mountain while dodging deadly hazards, navigating tricky terrain, collecting stars, and staying ahead of the collapsing avalanche.

---

## 🎮 Game Controls

| Action | Keyboard | Touch / Mobile / Mouse |
| :--- | :--- | :--- |
| **Hop Down-Left** | `Left Arrow` / `A` / `Keypad 1` | Tap Left half of screen |
| **Hop Down-Right** | `Right Arrow` / `D` / `Keypad 3` | Tap Right half of screen |
| **Pause / Resume** | `P` / `Escape` / `Space` | Tap Pause button (`❚❚`) in top-left |
| **Close Modals / Back** | `Escape` | Tap Close button (`✕`) |

> **Tip:** Each jump moves you diagonally forward down the mountain (left or right). Plan 2 to 3 steps ahead to avoid getting trapped on edges or dead ends!

---

## 📐 Mountain Grid System

The mountain is built using a symmetrical **5-4-5-4 staggered diamond isometric grid**:
- **Even Rows (0, 2, 4, ...)** contain **5 cubes** (columns 0 to 4).
- **Odd Rows (1, 3, 5, ...)** contain **4 cubes** (columns 0 to 3).
- Moving **Left** from row $r$, col $c$ moves you to:
  - Row $r+1$, column $c$ (if row $r$ is odd)
  - Row $r+1$, column $c-1$ (if row $r$ is even)
- Moving **Right** from row $r$, col $c$ moves you to:
  - Row $r+1$, column $c+1$ (if row $r$ is odd)
  - Row $r+1$, column $c$ (if row $r$ is even)
- **Mountain Edges**: Hopping off the boundary causes you to plummet down the mountain slope into the abyss!

---

## 🧊 Cube Encyclopedia: Behavior & Mechanics

Here is the complete breakdown of every cube type in the game, categorized by role.

### 1. 🟩 Terrain & Safe Cubes

#### 🟩 Grass Cube (`safe`)
- **Appearance**: Vibrant green block with clean diagonal stripes.
- **Type**: Standard Safe Platform
- **Danger Level**: `SAFE` (0/5)
- **Behavior**: Provides solid, stable footing for standard descent. Completely safe to land and pause on.
- **Strategy**: Use Grass Cubes as rest points to assess your next moves.

#### 🟤 Clay / Mud Cube (`dirt`)
- **Appearance**: Dark brown wet clay block with dripping mud sides and puddle sheen.
- **Type**: Movement Slowdown Hazard
- **Danger Level**: `LOW` (1/5)
- **Behavior**: Sticky mud clings to your feet. Slows down your movement for your **next 3 jumps** (increasing hop duration by **2.5×**). The remaining sticky jumps are tracked in the top HUD indicator.
- **Strategy**: Avoid stepping on mud when you are closely pursued by the Avalanche or Cubic Bear, as the sluggish hops can be fatal!

#### 🌲 Tree Cube (`tree`)
- **Appearance**: Solid voxel wood trunk with dense cubic leaf foliage.
- **Type**: Impassable Obstacle
- **Danger Level**: `OBSTACLE` (2/5)
- **Behavior**: You **cannot land** on a Tree Cube. Attempting to hop into a tree causes your character to bounce in place with a squash animation, without advancing.
- **Strategy**: Trees block routes. If both downward paths from your position lead to a tree or hazard, maneuver around them before dropping down.

#### 🌊 Waterfall / River Cube (`river`)
- **Appearance**: Flowing turquoise water channel with water splash particles.
- **Type**: Fast-Travel Water Stream
- **Danger Level**: `NEUTRAL / SLIDE` (2/5)
- **Behavior**: Stepping onto a Waterfall Cube automatically sweeps you downward along the continuous river current (sliding rapidly from 2 to 4 consecutive cubes) until the end of the stream.
- **Strategy**: Rivers are the fastest way to gain score and outrun the avalanche, but watch out: ensure the river exit does not throw you near magma or active traps!

---

### 2. ⚡ Hazards & Traps

#### 🌋 Magma / Lava Cube (`magma`)
- **Appearance**: Dark volcanic basalt rock with glowing molten red/orange magma fissures and smoke embers.
- **Type**: Instant-Death Hazard
- **Danger Level**: `FATAL` (5/5)
- **Behavior**: Stepping onto a Magma Cube instantly incinerates your character and ends the game—**unless you have an active Shield**.
- **Strategy**: Never step on magma without a shield. Look for alternate paths or slide past using nearby rivers.

#### 💥 Cracked Earth Cube (`cracked`)
- **Appearance**: Fractured rock with deep fissure fault lines and crumbling dust particles.
- **Type**: Delayed Crumbling Collapse
- **Danger Level**: `HIGH` (4/5)
- **Behavior**: Stepping on it starts a **2.0-second seismic tremor**. The block shakes aggressively with dust debris before crumbling away into the void. If you are still standing on it when it collapses, you plummet down the mountain.
- **Strategy**: You can safely land on a Cracked Cube as long as you **hop off within 2 seconds**. Do not hesitate!

#### ⚙️ Spike Trap Cube (`trap`)
- **Appearance**: Metal-reinforced stone grate containing retractable steel spikes.
- **Type**: Periodic Cyclic Hazard
- **Danger Level**: `VARIABLE` (3/5 to 5/5)
- **Behavior**: Operates on a strict **3.0-second cycle**:
  - **2.0 seconds RETRACTED (Hidden)**: Spikes are down; 100% safe to land and walk on.
  - **1.0 second EXTENDED (Raised)**: Sharp steel spikes emerge; instantly fatal on contact unless shielded.
- **Strategy**: Time your hops! If you see the spikes retracting, you have a 2-second safe window to cross.

#### 🧨 TNT Explosive Cube (`tnt`)
- **Appearance**: Red explosive wooden crate with bold "TNT" lettering and a spark wick on top.
- **Type**: Domino Chain Reaction Explosive
- **Danger Level**: `VERY HIGH` (4.5/5)
- **Behavior**:
  - Stepping on a TNT cube ignites its fuse, causing it to flash red/white and vibrate with sparks for **2.0 seconds** before exploding.
  - **Domino Chain Reaction**: Detonation instantly triggers all adjacent TNT cubes with a fast **1.0-second chain fuse**!
- **Strategy**: Stepping on a single TNT is survivable if you hop away immediately. Beware of TNT clusters, as chain reactions can destroy large sections of the mountain!

---

### 3. ⭐ Collectibles & Power-Ups

#### ⭐ Star Cube (`star`)
- **Appearance**: Safe mountain block with a rotating, glowing golden 3D star hovering above it.
- **Type**: Score & Currency Collectible
- **Danger Level**: `BENEFICIAL` (0/5)
- **Behavior**: Hopping onto the cube collects the star, awarding **+5 bonus score** and **+1 Star Coin** to your bank.
- **Strategy**: Stars are placed in slightly riskier pathways. Assess if taking the detour is safe before grabbing them.

#### 🛡️ Shield Power-Up Cube (`shield`)
- **Appearance**: Rare mountain block with a floating, spinning cyan holographic energy shield emblem.
- **Type**: Total Invulnerability Power-Up
- **Danger Level**: `POWER-UP` (0/5)
- **Behavior**:
  - Grants **4.0 seconds of complete invulnerability**.
  - Renders a glowing energy forcefield bubble around your character.
  - Protects you from **Magma**, **Active Spikes**, and **Explosions**.
  - **Defeats the Bear**: If the Cubic Bear touches you while shielded, the bear is instantly destroyed and despawns!
  - Displays a remaining timer bar and countdown in the top HUD.
- **Strategy**: Grab shields whenever possible—they allow you to speed-run through magma fields and spike traps with zero risk.

---

## 🐻 Threats & Environmental Events

### 🐻 Roaming Cubic Bear
- **Appearance**: Blocky voxel brown grizzly bear with animated ears and paws.
- **Behavior**:
  - Spawns ahead of you on the mountain starting from Row 3+.
  - Patrols a dedicated 4-cube diamond circular loop for 12 to 16 hops.
  - **Fatal on Collision**: If the bear steps onto your cube (or you step onto its cube), you are defeated.
  - **Weakness**: Running into the bear while your **Shield is active** defeats the bear with a whimper and poof particle effect!
- **Strategy**: Watch the bear's circular patrol route. Wait for it to hop away, or rush it if you have an active shield.

### 🏔️ Top-Down Avalanche Collapse
- **Behavior**:
  - 3 seconds after the game starts, the top of the mountain begins crumbling row by row.
  - Collapses steadily at **1 row every 0.4 seconds** in a linear trend.
  - If the collapse catches up to your current row, you fall with the mountain.
- **Strategy**: Never stay idle on any single block for more than 1–2 seconds. Maintain a steady, rhythmic descent down the mountain.

---

## 🎨 Biomes & Scenery Progression

As you descend deeper down the mountain, the environment seamlessly transitions every **45 steps**:

| Biome | Row Range | Sky & Fog Palette | Grass & Dirt Colors | Atmosphere |
| :--- | :--- | :--- | :--- | :--- |
| **🌌 Midnight Mountain** | Rows 0 – 44 | Deep Purple & Indigo (`#4a156e`) | Lime Stripe (`#65d600`) / Rich Earth | Mystical starry twilight |
| **🌲 Emerald Valley** | Rows 45 – 89 | Sky Blue & Azure (`#00b4d8`) | Forest Green (`#4CAF50`) / Brown Rock | Vibrant alpine valley |
| **🌅 Amber Sunset** | Rows 90 – 134 | Fiery Orange & Gold (`#ff7b00`) | Golden Orange (`#ffa200`) / Sienna Stone | Warm cinematic sunset |
| **🧪 Toxic Swamp** | Rows 135+ | Dark Teal & Cyan (`#006466`) | Turquoise (`#2ec4b6`) / Slate Stone | Mysterious luminescent swamp |

---

## 🏆 Scoring & Economy

- **Step Score**: **+1 Point** per downward row reached.
- **Star Score**: **+5 Points** per collected star.
- **Star Coins**: **+1 Coin** per collected star (saved permanently to browser `localStorage`).
- **High Scores**: Automatically tracked and displayed on the Main Menu and Game Over screen with celebratory badges when beaten!

---

## 💡 Pro Survival Tips

1. **Rhythm Over Haste**: Avoid frantic tapping. Find a steady rhythm to evaluate hazards 2 steps ahead.
2. **Watch the Spikes' Timing**: Spike traps stay hidden for 2.0s and active for 1.0s. If you land right as they retract, you have plenty of time.
3. **Use Waterfalls for Quick Escapes**: Rivers can immediately put 3–4 rows of distance between you and the incoming Avalanche.
4. **Use TNT to Break Deadlocks**: If you need to cross a TNT block, jump on it and immediately jump off. You have 2.0s before it detonates.
5. **Save Shields for Danger Zones**: When you get a Shield, use the 4 seconds of invulnerability to sprint straight through magma and spike fields without pausing.
6. **Mind the Sticky Mud**: Mud adds a 2.5x hop delay for 3 hops. Do not jump onto mud if the avalanche is right behind you!

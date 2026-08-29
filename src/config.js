// Game Constants & Configuration for Down the Mountain 3D

export const GAME_CONFIG = {
  // Grid Dimensions & 45-deg Diamond Spacing
  GRID_WIDTH: 5,
  VISIBLE_ROWS_AHEAD: 26,
  VISIBLE_ROWS_BEHIND: 10,
  BLOCK_SIZE: 1.0,

  BLOCK_SPACING_X: 1.41421356, // Math.SQRT2 - exact diamond diagonal width
  BLOCK_SPACING_Y: 0.65,       // Height drop per row
  BLOCK_SPACING_Z: 0.8165,     // Forward depth step per row

  // Player Physics & Movement
  HOP_DURATION: 0.14,
  HOP_HEIGHT: 0.55,
  RIVER_SLIDE_SPEED: 0.15,
  DIRT_STICKY_JUMPS: 3,        // Mud/clay glue slowdown lasts for 3 jumps
  MUD_HOP_MULTIPLIER: 2.5,     // Hop takes 2.5x longer when glue/mud is stuck to feet

  // Hazard Timers (Exact specifications)
  SHIELD_DURATION: 4.0,
  CRACKED_COLLAPSE_DELAY: 2.0,

  // TNT: First TNT 2.0s fuse, adjacent chained TNTs 1.0s domino fuse
  TNT_INITIAL_FUSE: 2.0,
  TNT_CHAIN_FUSE: 1.0,

  // Trap: 2.0s hidden (safe) <-> 1.0s visible (fatal)
  SPIKE_CYCLE_PERIOD: 3.0,
  SPIKE_ACTIVE_TIME: 1.0,

  // Top-Down Mountain Collapse (Dynamic Difficulty Progression)
  AVALANCHE_INITIAL_DELAY: 4.0, // Grace period before avalanche begins
  AVALANCHE_ROW_INTERVAL: 0.65, // Base interval at score 0 (speeds up progressively)

  // Score & Currency
  STEP_SCORE: 1,
  STAR_SCORE: 5,
  STAR_COINS: 1,

  // Combo Streak Settings
  COMBO_WINDOW: 0.55,           // Seconds between hops to maintain combo streak
  MIN_COMBO_FOR_DISPLAY: 4,     // Show combo banner starting at 4 consecutive quick hops

  BIOME_STEP_INTERVAL: 45,
};

export const DIFFICULTY_TIERS = [
  {
    id: 1,
    minScore: 0,
    maxScore: 20,
    name: 'Peaceful Peaks',
    tagline: 'GENTLE START',
    allowedCubes: ['safe', 'dirt', 'tree'],
    hasBear: false,
    avalancheInterval: 0.65,
    spikeCycleSafe: 2.4,
    spikeCycleActive: 0.6,
  },
  {
    id: 2,
    minScore: 21,
    maxScore: 40,
    name: 'Rapid Rivers & TNT',
    tagline: 'STAGE 2 UNLOCKED: WATERFALLS & TNT!',
    allowedCubes: ['safe', 'dirt', 'tree', 'river', 'tnt'],
    hasBear: false,
    avalancheInterval: 0.50,
    spikeCycleSafe: 2.2,
    spikeCycleActive: 0.8,
  },
  {
    id: 3,
    minScore: 41,
    maxScore: 70,
    name: 'Wild Territory',
    tagline: 'STAGE 3 UNLOCKED: BEAR & SPIKE TRAPS!',
    allowedCubes: ['safe', 'dirt', 'tree', 'river', 'tnt', 'trap', 'cracked'],
    hasBear: true,
    bearCooldownMin: 16.0,
    bearCooldownMax: 22.0,
    avalancheInterval: 0.40,
    spikeCycleSafe: 2.0,
    spikeCycleActive: 1.0,
  },
  {
    id: 4,
    minScore: 71,
    maxScore: Infinity,
    name: 'Volcanic Inferno',
    tagline: 'STAGE 4 UNLOCKED: BURNING MAGMA!',
    allowedCubes: ['safe', 'dirt', 'tree', 'river', 'tnt', 'trap', 'cracked', 'magma'],
    hasBear: true,
    bearCooldownMin: 11.0,
    bearCooldownMax: 16.0,
    avalancheInterval: 0.32,
    spikeCycleSafe: 1.8,
    spikeCycleActive: 1.0,
  }
];

export function getTierForScore(score) {
  for (let i = DIFFICULTY_TIERS.length - 1; i >= 0; i--) {
    if (score >= DIFFICULTY_TIERS[i].minScore) {
      return DIFFICULTY_TIERS[i];
    }
  }
  return DIFFICULTY_TIERS[0];
}


export const CUBE_TYPES = {
  SAFE: 'safe',
  DIRT: 'dirt',
  TREE: 'tree',
  RIVER: 'river',
  STAR: 'star',
  MAGMA: 'magma',
  CRACKED: 'cracked',
  TRAP: 'trap',
  TNT: 'tnt',
  SHIELD: 'shield',
};

export const BIOMES = [
  {
    id: 'midnight',
    name: 'Midnight Mountain',
    skyTop: '#4a156e',
    skyBottom: '#360952',
    fogColor: '#4a156e',
    grassColor: '#65d600',
    grassStripe: '#4cb800',
    dirtColor: 0xc68b59,
    dirtDark: 0x7a4820,
    cloudColor: '#8b5c9e',
    lightColor: 0xffffff,
    lightIntensity: 1.4,
  },
  {
    id: 'forest',
    name: 'Emerald Valley',
    skyTop: '#00b4d8',
    skyBottom: '#0077b6',
    fogColor: '#0096c7',
    grassColor: '#4CAF50',
    grassStripe: '#388E3C',
    dirtColor: 0x8D6E63,
    dirtDark: 0x5D4037,
    cloudColor: '#caf0f8',
    lightColor: 0xffffff,
    lightIntensity: 1.4,
  },
  {
    id: 'sunset',
    name: 'Amber Sunset',
    skyTop: '#ff7b00',
    skyBottom: '#e85d04',
    fogColor: '#ff7b00',
    grassColor: '#ffa200',
    grassStripe: '#ff7b00',
    dirtColor: 0xA1887F,
    dirtDark: 0x6D4C41,
    cloudColor: '#ffd166',
    lightColor: 0xfff3e0,
    lightIntensity: 1.4,
  },
  {
    id: 'swamp',
    name: 'Toxic Swamp',
    skyTop: '#006466',
    skyBottom: '#065a60',
    fogColor: '#0b525b',
    grassColor: '#2ec4b6',
    grassStripe: '#1b9aaa',
    dirtColor: 0x546E7A,
    dirtDark: 0x37474F,
    cloudColor: '#9bf6ff',
    lightColor: 0xe0f2f1,
    lightIntensity: 1.3,
  }
];


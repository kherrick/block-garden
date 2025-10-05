import { Signal } from "../deps/signal.mjs";

import { getBiome } from "./getBiome.mjs";
import { getRandomSeed } from "./getRandomSeed.mjs";

const getT = (v) => ({
  crop: false,
  farmable: false,
  solid: false,
  ...v,
});

const biomeFields = {
  crops: [],
  surfaceTile: null,
  subTile: null,
};

let INITIAL_WORLD_SEED;
const params = new URLSearchParams(globalThis.location.search);
if (params.has("seed")) {
  INITIAL_WORLD_SEED = params.get("seed");
} else {
  INITIAL_WORLD_SEED = getRandomSeed();
}

// Add to gameConfig - configuration for runtime water physics
export const waterPhysicsConfig = {
  // How often to update water physics (every N frames)
  updateInterval: 10, // Update every 10 frames (~6 times per second at 60fps)
  frameCounter: 0,
  // Maximum iterations per update to prevent CPU overload
  maxIterationsPerUpdate: 5,
  // How many tiles around changed areas to check
  checkRadius: 15,
  // Track areas that need water physics updates
  dirtyRegions: new Set(),
};

// Create reactive signals for all configuration and state
export const gameConfig = {
  version: new Signal.State(""),
  worldSeed: new Signal.State(INITIAL_WORLD_SEED),
  currentResolution: new Signal.State("400"),
  canvasScale: new Signal.State(1),
  TILE_SIZE: new Signal.State(8),
  WORLD_WIDTH: new Signal.State(400),
  WORLD_HEIGHT: new Signal.State(200),
  SURFACE_LEVEL: new Signal.State(60),
  // Physics constants
  GRAVITY: new Signal.State(0.7),
  FRICTION: new Signal.State(0.8),
  MAX_FALL_SPEED: new Signal.State(15),
  // Fog mode setting - "fog" || "clear"
  fogMode: new Signal.State("fog"),
  fogScale: new Signal.State(8),
  isFogScaled: new Signal.State(true),
  // Break mode setting
  breakMode: new Signal.State("regular"),
  // Tile types - keeping as static object since they don't change
  TILES: {
    AIR: getT({ id: 0, color: "#87CEEB" }),
    WATER: getT({ id: 4, color: "#4169E1" }),
    MOSS: getT({ id: 32, color: "#556B2F", solid: false, farmable: false }),
    CLAY: getT({ id: 6, color: "#CD853F", solid: true, farmable: true }),
    DIRT: getT({ id: 2, color: "#8B4513", solid: true, farmable: true }),
    GRASS: getT({ id: 1, color: "#90EE90", solid: true, farmable: true }),
    SAND: getT({ id: 5, color: "#F4A460", solid: true, farmable: true }),
    COAL: getT({ id: 7, color: "#2F4F4F", solid: true }),
    GOLD: getT({ id: 9, color: "#FFD700", solid: true }),
    IRON: getT({ id: 8, color: "#B87333", solid: true }),
    STONE: getT({ id: 3, color: "#696969", solid: true }),
    TREE_LEAVES: getT({ id: 11, color: "#228B22", solid: true, crop: true }),
    TREE_TRUNK: getT({ id: 10, color: "#59392B", solid: true, crop: true }),
    WHEAT: getT({ id: 12, color: "#DAA520", crop: true, growthTime: 480 }),
    CARROT: getT({ id: 13, color: "#FF8C00", crop: true, growthTime: 240 }),
    MUSHROOM: getT({ id: 14, color: "#8B0000", crop: true, growthTime: 120 }),
    CACTUS: getT({
      id: 15,
      color: "#32CD32",
      solid: true,
      crop: true,
      growthTime: 1920,
    }),
    WALNUT: getT({ id: 33, color: "#654321", crop: true, growthTime: 960 }),
    BERRY_BUSH: getT({ id: 35, color: "#DC143C", crop: true, growthTime: 360 }),
    BAMBOO: getT({
      id: 36,
      color: "#90EE90",
      solid: true,
      crop: true,
      growthTime: 180,
    }),
    SUNFLOWER: getT({ id: 37, color: "#FFD700", crop: true, growthTime: 600 }),
    CORN: getT({ id: 38, color: "#F0E68C", crop: true, growthTime: 420 }),
    PINE_TREE: getT({
      id: 39,
      color: "#2E5930",
      solid: true,
      crop: true,
      growthTime: 1440,
    }),
    WILLOW_TREE: getT({
      id: 40,
      color: "#8FBC8F",
      solid: true,
      crop: true,
      growthTime: 1800,
    }),
    FERN: getT({ id: 41, color: "#3CB371", crop: true, growthTime: 90 }),
    SNOW: getT({ id: 16, color: "#FFFAFA", solid: true, farmable: true }),
    ICE: getT({ id: 17, color: "#B0E0E6", solid: true }),
    LAVA: getT({ id: 18, color: "#FF4500", solid: false }),
    BEDROCK: getT({ id: 19, color: "#1C1C1C", solid: true }),
    WHEAT_GROWING: getT({ id: 20, color: "#9ACD32", crop: true }),
    CARROT_GROWING: getT({ id: 21, color: "#FF7F50", crop: true }),
    TREE_GROWING: getT({ id: 34, color: "#9ACD32", crop: true }),
    MUSHROOM_GROWING: getT({ id: 22, color: "#CD5C5C", crop: true }),
    CACTUS_GROWING: getT({
      id: 23,
      color: "#228B22",
      solid: true,
      crop: true,
    }),
    BERRY_BUSH_GROWING: getT({ id: 42, color: "#CD5C5C", crop: true }),
    BAMBOO_GROWING: getT({ id: 43, color: "#98FB98", solid: true, crop: true }),
    SUNFLOWER_GROWING: getT({ id: 44, color: "#FFEC8B", crop: true }),
    CORN_GROWING: getT({ id: 45, color: "#EEE8AA", crop: true }),
    PINE_TREE_GROWING: getT({
      id: 46,
      color: "#556B2F",
      solid: true,
      crop: true,
    }),
    WILLOW_TREE_GROWING: getT({
      id: 47,
      color: "#9BCD9B",
      solid: true,
      crop: true,
    }),
    FERN_GROWING: getT({ id: 48, color: "#90EE90", crop: true }),
    // Plant parts for grown crops
    WHEAT_STALK: getT({ id: 24, color: "#8B7355" }),
    WHEAT_GRAIN: getT({ id: 25, color: "#FFD700" }),
    CARROT_LEAVES: getT({ id: 26, color: "#228B22" }),
    CARROT_ROOT: getT({ id: 27, color: "#FF6347" }),
    MUSHROOM_STEM: getT({ id: 28, color: "#D2691E" }),
    MUSHROOM_CAP: getT({ id: 29, color: "#8B0000" }),
    CACTUS_BODY: getT({ id: 30, color: "#2E8B57", solid: true }),
    CACTUS_FLOWER: getT({ id: 31, color: "#FF69B4" }),
    // Berry bush parts
    BERRY_BUSH_BRANCH: getT({ id: 49, color: "#8B4513", solid: true }),
    BERRY_BUSH_LEAVES: getT({ id: 50, color: "#228B22", solid: true }),
    BERRY_BUSH_BERRIES: getT({ id: 51, color: "#DC143C" }),
    // Bamboo parts
    BAMBOO_STALK: getT({ id: 52, color: "#90EE90", solid: true }),
    BAMBOO_JOINT: getT({ id: 53, color: "#6B8E23", solid: true }),
    BAMBOO_LEAVES: getT({ id: 54, color: "#32CD32" }),
    // Sunflower parts
    SUNFLOWER_STEM: getT({ id: 55, color: "#8B7355" }),
    SUNFLOWER_LEAVES: getT({ id: 56, color: "#228B22" }),
    SUNFLOWER_CENTER: getT({ id: 57, color: "#8B4513" }),
    SUNFLOWER_PETALS: getT({ id: 58, color: "#FFD700" }),
    // Corn parts
    CORN_STALK: getT({ id: 59, color: "#9ACD32" }),
    CORN_LEAVES: getT({ id: 60, color: "#6B8E23" }),
    CORN_EAR: getT({ id: 61, color: "#F0E68C" }),
    CORN_SILK: getT({ id: 62, color: "#DEB887" }),
    // Pine tree parts
    PINE_TRUNK: getT({ id: 63, color: "#8B4513", solid: true }),
    PINE_NEEDLES: getT({ id: 64, color: "#2E5930", solid: true }),
    PINE_CONE: getT({ id: 65, color: "#8B7355" }),
    // Willow tree parts
    WILLOW_TRUNK: getT({ id: 66, color: "#8B7355", solid: true }),
    WILLOW_BRANCHES: getT({ id: 67, color: "#8FBC8F", solid: true }),
    WILLOW_LEAVES: getT({ id: 68, color: "#9ACD32" }),
    // Fern parts
    FERN_STEM: getT({ id: 69, color: "#556B2F" }),
    FERN_FROND: getT({ id: 70, color: "#3CB371" }),
  },

  // Biome definitions - keeping as static since they don't change frequently
  // Will be set after TILES is defined
  BIOMES: {
    FOREST: {
      trees: true,
      name: "Forest",
      ...biomeFields,
    },
    DESERT: {
      trees: false,
      name: "Desert",
      ...biomeFields,
    },
    TUNDRA: {
      trees: false,
      name: "Tundra",
      ...biomeFields,
    },
    SWAMP: {
      trees: true,
      name: "Swamp",
      ...biomeFields,
    },
  },
};

export const gameState = {
  waterPhysicsQueue: new Signal.State(new Set()),
  // Tracks which tiles have been explored for map fog
  exploredMap: {},
  seedInventory: new Signal.State({
    WHEAT: 0,
    CARROT: 0,
    MUSHROOM: 0,
    CACTUS: 0,
    WALNUT: 0,
    BERRY_BUSH: 0,
    BAMBOO: 0,
    SUNFLOWER: 0,
    CORN: 0,
    PINE_TREE: 0,
    WILLOW_TREE: 0,
    FERN: 0,
  }),
  // New materials inventory
  materialsInventory: new Signal.State({
    DIRT: 0,
    STONE: 0,
    WOOD: 0, // Represents TREE_TRUNK
    SAND: 0,
    CLAY: 0,
    COAL: 0,
    IRON: 0,
    GOLD: 0,
  }),
  selectedSeedType: new Signal.State(null),
  selectedMaterialType: new Signal.State(null),
  gameTime: new Signal.State(0),
  growthTimers: new Signal.State({}),
  // Store plant growth data
  plantStructures: new Signal.State({}),
  seeds: new Signal.State(0),
  viewMode: new Signal.State("normal"),
  // Player character
  player: new Signal.State({
    x: 200,
    y: 50,
    width: 6,
    height: 8,
    velocityX: 0,
    velocityY: 0,
    speed: 2.75,
    jumpPower: 12,
    onGround: false,
    color: "#FF69B4",
    // Track last movement direction
    lastDirection: 0,
  }),
  // World data
  world: new Signal.State([]),
  // Camera system
  camera: new Signal.State({
    x: 0,
    y: 0,
    speed: 5,
  }),
};

// Create computed signals for derived values
export const computedSignals = {
  totalSeeds: new Signal.Computed(() => {
    const inventory = gameState.seedInventory.get();

    return Object.values(inventory).reduce((sum, count) => sum + count, 0);
  }),
};

export function updateState(key, updater) {
  const current = gameState[key]?.get();

  if (current !== undefined) {
    gameState[key].set(updater(current));
  }
}

export function updateConfig(key, updater) {
  const current = gameConfig[key]?.get();

  if (current !== undefined) {
    gameConfig[key].set(updater(current));
  }
}

export function setConfig(key, value) {
  return gameConfig[key]?.set(value);
}

export function getConfig(key) {
  return gameConfig[key]?.get();
}

export function setState(key, value) {
  return gameState[key]?.set(value);
}

export function getState(key) {
  return gameState[key]?.get();
}

export function initState(gThis, version) {
  gameConfig.version.set(version);

  // Expose reactive state through globalThis
  gThis.spriteGarden = {
    ...gThis?.spriteGarden,
    config: gameConfig,
    state: gameState,
    computed: computedSignals,
    // Helper methods to get/set values
    setConfig,
    getConfig,
    updateConfig,
    setState,
    getState,
    updateState,
  };

  // Initialize biomes after TILES is defined
  const { TILES, BIOMES } = gameConfig;
  BIOMES.FOREST.surfaceTile = TILES.GRASS;
  BIOMES.FOREST.subTile = TILES.DIRT;
  BIOMES.FOREST.crops = [
    TILES.WHEAT,
    TILES.CARROT,
    TILES.BERRY_BUSH,
    TILES.FERN,
    TILES.PINE_TREE,
  ];

  BIOMES.DESERT.surfaceTile = TILES.SAND;
  BIOMES.DESERT.subTile = TILES.SAND;
  BIOMES.DESERT.crops = [TILES.CACTUS, TILES.SUNFLOWER];

  BIOMES.TUNDRA.surfaceTile = TILES.SNOW;
  BIOMES.TUNDRA.subTile = TILES.DIRT;
  BIOMES.TUNDRA.crops = [TILES.PINE_TREE, TILES.FERN];

  BIOMES.SWAMP.surfaceTile = TILES.CLAY;
  BIOMES.SWAMP.subTile = TILES.CLAY;
  BIOMES.SWAMP.crops = [
    TILES.MUSHROOM,
    TILES.WILLOW_TREE,
    TILES.BAMBOO,
    TILES.CORN,
  ];

  return {
    gameConfig,
    gameState,
  };
}

import { Signal } from "../../deps/signal.mjs";

import { getRandomSeed } from "../misc/getRandomSeed.mjs";

let initialWorldSeed;
const params = new URLSearchParams(globalThis.location.search);
if (params.has("seed")) {
  initialWorldSeed = params.get("seed");
} else {
  initialWorldSeed = getRandomSeed();
}

const getT = (v) => ({
  crop: false,
  farmable: false,
  solid: false,
  isSeed: false,
  drops: null,
  ...v,
});

const TILES = {
  AIR: getT({ id: 0, color: "#87CEEB" }),
  WHEAT: getT({
    id: 12,
    color: "#DAA520",
    crop: true,
    growthTime: 480,
    drops: "WHEAT",
    isSeed: true,
  }),
  CARROT: getT({
    id: 13,
    color: "#FF8C00",
    crop: true,
    growthTime: 240,
    drops: "CARROT",
    isSeed: true,
  }),
  MUSHROOM: getT({
    id: 14,
    color: "#8B0000",
    crop: true,
    growthTime: 120,
    drops: "MUSHROOM",
    isSeed: true,
  }),
  CACTUS: getT({
    id: 15,
    color: "#32CD32",
    solid: true,
    crop: true,
    growthTime: 1920,
    drops: "CACTUS",
    isSeed: true,
  }),
  WALNUT: getT({
    id: 33,
    color: "#654321",
    crop: true,
    growthTime: 960,
    drops: "WALNUT",
    isSeed: true,
  }),
  BERRY_BUSH: getT({
    id: 35,
    color: "#DC143C",
    crop: true,
    growthTime: 360,
    drops: "BERRY_BUSH",
    isSeed: true,
  }),
  BAMBOO: getT({
    id: 36,
    color: "#90EE90",
    solid: true,
    crop: true,
    growthTime: 180,
    drops: "BAMBOO",
    isSeed: true,
  }),
  SUNFLOWER: getT({
    id: 37,
    color: "#FFD700",
    crop: true,
    growthTime: 600,
    drops: "SUNFLOWER",
    isSeed: true,
  }),
  CORN: getT({
    id: 38,
    color: "#F0E68C",
    crop: true,
    growthTime: 420,
    drops: "CORN",
    isSeed: true,
  }),
  PINE_TREE: getT({
    id: 39,
    color: "#2E5930",
    solid: true,
    crop: true,
    growthTime: 1440,
    drops: "PINE_TREE",
    isSeed: true,
  }),
  WILLOW_TREE: getT({
    id: 40,
    color: "#8FBC8F",
    solid: true,
    crop: true,
    growthTime: 1800,
    drops: "WILLOW_TREE",
    isSeed: true,
  }),
  FERN: getT({
    id: 41,
    color: "#3CB371",
    crop: true,
    growthTime: 90,
    drops: "FERN",
    isSeed: true,
  }),
  WOOD: getT({
    id: 73,
    color: "#362200",
    solid: false,
    crop: true,
    drops: "WOOD",
  }),
  CLAY: getT({
    id: 6,
    color: "#CD853F",
    solid: true,
    farmable: true,
    drops: "CLAY",
  }),
  DIRT: getT({
    id: 2,
    color: "#8B4513",
    solid: true,
    farmable: true,
    drops: "DIRT",
  }),
  GRASS: getT({
    id: 1,
    color: "#90EE90",
    solid: true,
    farmable: true,
    drops: "DIRT",
  }),
  SAND: getT({
    id: 5,
    color: "#F4A460",
    solid: true,
    farmable: true,
    drops: "SAND",
  }),
  TREE_LEAVES: getT({
    id: 11,
    color: "#228B22",
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  TREE_TRUNK: getT({
    id: 10,
    color: "#59392B",
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  SNOW: getT({
    id: 16,
    color: "#FFFAFA",
    solid: true,
    farmable: true,
    drops: "SAND",
  }),
  CACTUS_GROWING: getT({
    id: 23,
    color: "#228B22",
    solid: true,
    crop: true,
  }),
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
  WHEAT_GROWING: getT({ id: 20, color: "#9ACD32", crop: true }),
  CARROT_GROWING: getT({ id: 21, color: "#FF7F50", crop: true }),
  TREE_GROWING: getT({ id: 34, color: "#9ACD32", crop: true }),
  MUSHROOM_GROWING: getT({ id: 22, color: "#CD5C5C", crop: true }),
  BERRY_BUSH_GROWING: getT({ id: 42, color: "#CD5C5C", crop: true }),
  BAMBOO_GROWING: getT({ id: 43, color: "#98FB98", solid: true, crop: true }),
  SUNFLOWER_GROWING: getT({ id: 44, color: "#FFEC8B", crop: true }),
  CORN_GROWING: getT({ id: 45, color: "#EEE8AA", crop: true }),
  COAL: getT({ id: 7, color: "#2F4F4F", solid: true, drops: "COAL" }),
  GOLD: getT({ id: 9, color: "#FFD700", solid: true, drops: "GOLD" }),
  IRON: getT({ id: 8, color: "#B87333", solid: true, drops: "IRON" }),
  STONE: getT({ id: 3, color: "#696969", solid: true, drops: "STONE" }),
  PUMICE: getT({ id: 71, color: "#B8A99A", solid: true, drops: "PUMICE" }),
  ICE: getT({ id: 17, color: "#B0E0E6", solid: true }),
  LAVA: getT({ id: 18, color: "#FF4500", solid: false }),
  BEDROCK: getT({ id: 19, color: "#1C1C1C", solid: true }),
  WATER: getT({ id: 4, color: "#4169E1" }),
  MOSS: getT({ id: 32, color: "#556B2F" }),
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
};

const biomeFields = {
  crops: [],
  surfaceTile: null,
  subTile: null,
};

// Biome definitions Will be set after TILES is defined
const BIOMES = {
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
};

// Initialize BIOMES after TILES IS defined
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

export const gameConfig = {
  // Fog mode setting - "fog" || "clear"
  fogMode: new Signal.State("fog"),
  fogScale: new Signal.State(8),
  isFogScaled: new Signal.State(true),
  // Break mode setting
  breakMode: new Signal.State("regular"),
  canvasScale: new Signal.State(1),
  currentResolution: new Signal.State("400"),
  version: new Signal.State("1"),
  worldSeed: new Signal.State(initialWorldSeed),
  waterPhysics: {
    // How often to update water physics (every N frames)
    updateInterval: 10, // Update every 10 frames (~6 times per second at 60fps)
    frameCounter: 0,
    // Maximum iterations per update to prevent CPU overload
    maxIterationsPerUpdate: 5,
    // How many tiles around changed areas to check
    checkRadius: 15,
    // Track areas that need water physics updates
    dirtyRegions: new Set(),
  },
  TILE_SIZE: new Signal.State(8),
  WORLD_WIDTH: new Signal.State(400),
  WORLD_HEIGHT: new Signal.State(200),
  SURFACE_LEVEL: new Signal.State(60),
  // Physics constants
  GRAVITY: new Signal.State(0.7),
  FRICTION: new Signal.State(0.8),
  MAX_FALL_SPEED: new Signal.State(15),
  TILES,
  BIOMES,
};

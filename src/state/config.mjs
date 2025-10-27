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

const TileName = {
  AIR: "AIR",
  BAMBOO: "BAMBOO",
  BAMBOO_GROWING: "BAMBOO_GROWING",
  BAMBOO_JOINT: "BAMBOO_JOINT",
  BAMBOO_LEAVES: "BAMBOO_LEAVES",
  BAMBOO_STALK: "BAMBOO_STALK",
  BEDROCK: "BEDROCK",
  BERRY_BUSH: "BERRY_BUSH",
  BERRY_BUSH_BERRIES: "BERRY_BUSH_BERRIES",
  BERRY_BUSH_BRANCH: "BERRY_BUSH_BRANCH",
  BERRY_BUSH_GROWING: "BERRY_BUSH_GROWING",
  BERRY_BUSH_LEAVES: "BERRY_BUSH_LEAVES",
  CACTUS: "CACTUS",
  CACTUS_BODY: "CACTUS_BODY",
  CACTUS_FLOWER: "CACTUS_FLOWER",
  CACTUS_GROWING: "CACTUS_GROWING",
  CARROT: "CARROT",
  CARROT_GROWING: "CARROT_GROWING",
  CARROT_LEAVES: "CARROT_LEAVES",
  CARROT_ROOT: "CARROT_ROOT",
  CLAY: "CLAY",
  CLOUD: "CLOUD",
  COAL: "COAL",
  CORN: "CORN",
  CORN_EAR: "CORN_EAR",
  CORN_GROWING: "CORN_GROWING",
  CORN_LEAVES: "CORN_LEAVES",
  CORN_SILK: "CORN_SILK",
  CORN_STALK: "CORN_STALK",
  DIRT: "DIRT",
  FERN: "FERN",
  FERN_FROND: "FERN_FROND",
  FERN_GROWING: "FERN_GROWING",
  FERN_STEM: "FERN_STEM",
  GOLD: "GOLD",
  GRASS: "GRASS",
  ICE: "ICE",
  IRON: "IRON",
  LAVA: "LAVA",
  MOSS: "MOSS",
  MUSHROOM: "MUSHROOM",
  MUSHROOM_CAP: "MUSHROOM_CAP",
  MUSHROOM_GROWING: "MUSHROOM_GROWING",
  MUSHROOM_STEM: "MUSHROOM_STEM",
  PINE_CONE: "PINE_CONE",
  PINE_NEEDLES: "PINE_NEEDLES",
  PINE_TREE: "PINE_TREE",
  PINE_TREE_GROWING: "PINE_TREE_GROWING",
  PINE_TRUNK: "PINE_TRUNK",
  PUMICE: "PUMICE",
  SAND: "SAND",
  SNOW: "SNOW",
  STONE: "STONE",
  SUNFLOWER: "SUNFLOWER",
  SUNFLOWER_CENTER: "SUNFLOWER_CENTER",
  SUNFLOWER_GROWING: "SUNFLOWER_GROWING",
  SUNFLOWER_LEAVES: "SUNFLOWER_LEAVES",
  SUNFLOWER_PETALS: "SUNFLOWER_PETALS",
  SUNFLOWER_STEM: "SUNFLOWER_STEM",
  TREE_GROWING: "TREE_GROWING",
  TREE_LEAVES: "TREE_LEAVES",
  TREE_TRUNK: "TREE_TRUNK",
  WALNUT: "WALNUT",
  WATER: "WATER",
  WHEAT: "WHEAT",
  WHEAT_GRAIN: "WHEAT_GRAIN",
  WHEAT_GROWING: "WHEAT_GROWING",
  WHEAT_STALK: "WHEAT_STALK",
  WILLOW_BRANCHES: "WILLOW_BRANCHES",
  WILLOW_LEAVES: "WILLOW_LEAVES",
  WILLOW_TREE: "WILLOW_TREE",
  WILLOW_TREE_GROWING: "WILLOW_TREE_GROWING",
  WILLOW_TRUNK: "WILLOW_TRUNK",
  WOOD: "WOOD",
};

const TILES = {
  [TileName.AIR]: getT({ id: 0, color: "#87CEEB" }),
  [TileName.WHEAT]: getT({
    id: 12,
    color: "#DAA520",
    crop: true,
    growthTime: 480,
    drops: "WHEAT",
    isSeed: true,
  }),
  [TileName.CARROT]: getT({
    id: 13,
    color: "#FF8C00",
    crop: true,
    growthTime: 240,
    drops: "CARROT",
    isSeed: true,
  }),
  [TileName.MUSHROOM]: getT({
    id: 14,
    color: "#8B0000",
    crop: true,
    growthTime: 120,
    drops: "MUSHROOM",
    isSeed: true,
  }),
  [TileName.CACTUS]: getT({
    id: 15,
    color: "#32CD32",
    solid: true,
    crop: true,
    growthTime: 1920,
    drops: "CACTUS",
    isSeed: true,
  }),
  [TileName.WALNUT]: getT({
    id: 33,
    color: "#654321",
    crop: true,
    growthTime: 960,
    drops: "WALNUT",
    isSeed: true,
  }),
  [TileName.BERRY_BUSH]: getT({
    id: 35,
    color: "#DC143C",
    crop: true,
    growthTime: 360,
    drops: "BERRY_BUSH",
    isSeed: true,
  }),
  [TileName.BAMBOO]: getT({
    id: 36,
    color: "#90EE90",
    solid: true,
    crop: true,
    growthTime: 180,
    drops: "BAMBOO",
    isSeed: true,
  }),
  [TileName.SUNFLOWER]: getT({
    id: 37,
    color: "#FFD700",
    crop: true,
    growthTime: 600,
    drops: "SUNFLOWER",
    isSeed: true,
  }),
  [TileName.CORN]: getT({
    id: 38,
    color: "#F0E68C",
    crop: true,
    growthTime: 420,
    drops: "CORN",
    isSeed: true,
  }),
  [TileName.PINE_TREE]: getT({
    id: 39,
    color: "#2E5930",
    solid: true,
    crop: true,
    growthTime: 1440,
    drops: "PINE_TREE",
    isSeed: true,
  }),
  [TileName.WILLOW_TREE]: getT({
    id: 40,
    color: "#8FBC8F",
    solid: true,
    crop: true,
    growthTime: 1800,
    drops: "WILLOW_TREE",
    isSeed: true,
  }),
  [TileName.FERN]: getT({
    id: 41,
    color: "#3CB371",
    crop: true,
    growthTime: 90,
    drops: "FERN",
    isSeed: true,
  }),
  [TileName.WOOD]: getT({
    id: 73,
    color: "#362200",
    solid: false,
    crop: true,
    drops: "WOOD",
  }),
  [TileName.CLAY]: getT({
    id: 6,
    color: "#CD853F",
    solid: true,
    farmable: true,
    drops: "CLAY",
  }),
  [TileName.DIRT]: getT({
    id: 2,
    color: "#8B4513",
    solid: true,
    farmable: true,
    drops: "DIRT",
  }),
  [TileName.GRASS]: getT({
    id: 1,
    color: "#90EE90",
    solid: true,
    farmable: true,
    drops: "GRASS",
  }),
  [TileName.SAND]: getT({
    id: 5,
    color: "#F4A460",
    solid: true,
    farmable: true,
    drops: "SAND",
  }),
  [TileName.TREE_LEAVES]: getT({
    id: 11,
    color: "#228B22",
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  [TileName.TREE_TRUNK]: getT({
    id: 10,
    color: "#59392B",
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  [TileName.SNOW]: getT({
    id: 16,
    color: "#FFFAFA",
    solid: true,
    farmable: true,
    drops: "SNOW",
  }),
  [TileName.CACTUS_GROWING]: getT({
    id: 23,
    color: "#228B22",
    solid: true,
    crop: true,
  }),
  [TileName.PINE_TREE_GROWING]: getT({
    id: 46,
    color: "#556B2F",
    solid: true,
    crop: true,
  }),
  [TileName.WILLOW_TREE_GROWING]: getT({
    id: 47,
    color: "#9BCD9B",
    solid: true,
    crop: true,
  }),
  [TileName.FERN_GROWING]: getT({ id: 48, color: "#90EE90", crop: true }),
  [TileName.WHEAT_GROWING]: getT({ id: 20, color: "#9ACD32", crop: true }),
  [TileName.CARROT_GROWING]: getT({ id: 21, color: "#FF7F50", crop: true }),
  [TileName.TREE_GROWING]: getT({ id: 34, color: "#9ACD32", crop: true }),
  [TileName.MUSHROOM_GROWING]: getT({ id: 22, color: "#CD5C5C", crop: true }),
  [TileName.BERRY_BUSH_GROWING]: getT({
    id: 42,
    color: "#CD5C5C",
    crop: true,
  }),
  [TileName.BAMBOO_GROWING]: getT({
    id: 43,
    color: "#98FB98",
    solid: true,
    crop: true,
  }),
  [TileName.SUNFLOWER_GROWING]: getT({ id: 44, color: "#FFEC8B", crop: true }),
  [TileName.CORN_GROWING]: getT({ id: 45, color: "#EEE8AA", crop: true }),
  [TileName.COAL]: getT({
    id: 7,
    color: "#2F4F4F",
    solid: true,
    drops: "COAL",
  }),
  [TileName.GOLD]: getT({
    id: 9,
    color: "#FFD700",
    solid: true,
    drops: "GOLD",
  }),
  [TileName.IRON]: getT({
    id: 8,
    color: "#B87333",
    solid: true,
    drops: "IRON",
  }),
  [TileName.STONE]: getT({
    id: 3,
    color: "#696969",
    solid: true,
    drops: "STONE",
  }),
  [TileName.PUMICE]: getT({
    id: 71,
    color: "#B8A99A",
    solid: true,
    drops: "PUMICE",
  }),
  [TileName.ICE]: getT({
    id: 17,
    color: "#B0E0E6",
    solid: true,
    drops: "ICE",
  }),
  [TileName.CLOUD]: getT({
    id: 72,
    color: "#c5d1d3ff",
    drops: "CLOUD",
    farmable: true,
    solid: true,
  }),
  [TileName.BEDROCK]: getT({ id: 19, color: "#1C1C1C", solid: true }),
  [TileName.LAVA]: getT({ id: 18, color: "#FF4500" }),
  [TileName.WATER]: getT({ id: 4, color: "#4169E1" }),
  [TileName.MOSS]: getT({ id: 32, color: "#556B2F" }),
  // Plant parts for grown crops
  [TileName.WHEAT_STALK]: getT({ id: 24, color: "#8B7355" }),
  [TileName.WHEAT_GRAIN]: getT({ id: 25, color: "#FFD700" }),
  [TileName.CARROT_LEAVES]: getT({ id: 26, color: "#228B22" }),
  [TileName.CARROT_ROOT]: getT({ id: 27, color: "#FF6347" }),
  [TileName.MUSHROOM_STEM]: getT({ id: 28, color: "#D2691E" }),
  [TileName.MUSHROOM_CAP]: getT({ id: 29, color: "#8B0000" }),
  [TileName.CACTUS_BODY]: getT({ id: 30, color: "#2E8B57", solid: true }),
  [TileName.CACTUS_FLOWER]: getT({ id: 31, color: "#FF69B4" }),
  // Berry bush parts
  [TileName.BERRY_BUSH_BRANCH]: getT({
    id: 49,
    color: "#8B4513",
    solid: true,
  }),
  [TileName.BERRY_BUSH_LEAVES]: getT({
    id: 50,
    color: "#228B22",
    solid: true,
  }),
  [TileName.BERRY_BUSH_BERRIES]: getT({ id: 51, color: "#DC143C" }),
  // Bamboo parts
  [TileName.BAMBOO_STALK]: getT({ id: 52, color: "#90EE90", solid: true }),
  [TileName.BAMBOO_JOINT]: getT({ id: 53, color: "#6B8E23", solid: true }),
  [TileName.BAMBOO_LEAVES]: getT({ id: 54, color: "#32CD32" }),
  // Sunflower parts
  [TileName.SUNFLOWER_STEM]: getT({ id: 55, color: "#8B7355" }),
  [TileName.SUNFLOWER_LEAVES]: getT({ id: 56, color: "#228B22" }),
  [TileName.SUNFLOWER_CENTER]: getT({ id: 57, color: "#8B4513" }),
  [TileName.SUNFLOWER_PETALS]: getT({ id: 58, color: "#FFD700" }),
  // Corn parts
  [TileName.CORN_STALK]: getT({ id: 59, color: "#9ACD32" }),
  [TileName.CORN_LEAVES]: getT({ id: 60, color: "#6B8E23" }),
  [TileName.CORN_EAR]: getT({ id: 61, color: "#F0E68C" }),
  [TileName.CORN_SILK]: getT({ id: 62, color: "#DEB887" }),
  // Pine tree parts
  [TileName.PINE_TRUNK]: getT({ id: 63, color: "#8B4513", solid: true }),
  [TileName.PINE_NEEDLES]: getT({ id: 64, color: "#2E5930", solid: true }),
  [TileName.PINE_CONE]: getT({ id: 65, color: "#8B7355" }),
  // Willow tree parts
  [TileName.WILLOW_TRUNK]: getT({ id: 66, color: "#8B7355", solid: true }),
  [TileName.WILLOW_BRANCHES]: getT({ id: 67, color: "#8FBC8F", solid: true }),
  [TileName.WILLOW_LEAVES]: getT({ id: 68, color: "#9ACD32" }),
  // Fern parts
  [TileName.FERN_STEM]: getT({ id: 69, color: "#556B2F" }),
  [TileName.FERN_FROND]: getT({ id: 70, color: "#3CB371" }),
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
BIOMES.TUNDRA.subTile = TILES.ICE;
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
  WORLD_WIDTH: new Signal.State(500),
  WORLD_HEIGHT: new Signal.State(300),
  SURFACE_LEVEL: new Signal.State(90),
  // Physics constants
  GRAVITY: new Signal.State(0.7),
  FRICTION: new Signal.State(0.8),
  MAX_FALL_SPEED: new Signal.State(15),
  BIOMES,
  TILES,
  TileName,
};

/**
 * Block property definition.
 *
 * @typedef {Object} BlockDefinition
 *
 * @property {number} [id] - Unique identifier for the block
 * @property {string} name - Display name of the block
 * @property {boolean} [crop=false] - Whether this block is a crop
 * @property {boolean} [solid=false] - Wheather a block is solid
 * @property {boolean} [isSeed=false] - Whether this block is a seed/plant
 * @property {string|string[]|null} [drops=null] - What material(s) drop when harvested
 * @property {boolean} [gravity=false] - Whether a block falls
 * @property {number} [growthTime] - Time in seconds for plant to grow
 * @property {number} [friction=0] - Friction value when player moves through block (0-1). 0=no friction, 1=full stop. Future use for water, lava, leaves, etc.
 */

/**
 * Block placement in a plant structure.
 *
 * @typedef {Object} BlockPlacement
 *
 * @property {number} x - World X coordinate
 * @property {number} y - World Y coordinate
 * @property {number} z - World Z coordinate
 * @property {number} blockId - Block ID (index into blocks array)
 */

export const blockNames = {
  AIR: "Air",
  AGAVE_BASE: "Agave Base",
  AGAVE_FLOWER_STALK: "Agave Flower Stalk",
  AGAVE_FLOWER: "Agave Flower",
  AGAVE_GROWING: "Agave Growing",
  AGAVE_SPIKE: "Agave Spike",
  AGAVE: "Agave",
  BAMBOO_GROWING: "Bamboo Growing",
  BAMBOO_JOINT: "Bamboo Joint",
  BAMBOO_LEAVES: "Bamboo Leaves",
  BAMBOO_STALK: "Bamboo Stalk",
  BAMBOO: "Bamboo",
  BEDROCK: "Bedrock",
  BERRY_BUSH_BERRIES: "Berry Bush Berries",
  BERRY_BUSH_BRANCH: "Berry Bush Branch",
  BERRY_BUSH_GROWING: "Berry Bush Growing",
  BERRY_BUSH_LEAVES: "Berry Bush Leaves",
  BERRY_BUSH: "Berry Bush",
  BIRCH_BARK: "Birch Bark",
  BIRCH_BRANCHES: "Birch Branches",
  BIRCH_CATKINS: "Birch Catkins",
  BIRCH_GROWING: "Birch Growing",
  BIRCH_LEAVES: "Birch Leaves",
  BIRCH_TRUNK: "Birch Trunk",
  BIRCH: "Birch",
  CACTUS_BODY: "Cactus Body",
  CACTUS_FLOWER: "Cactus Flower",
  CACTUS_GROWING: "Cactus Growing",
  CACTUS: "Cactus",
  CARROT_GROWING: "Carrot Growing",
  CARROT_LEAVES: "Carrot Leaves",
  CARROT_ROOT: "Carrot Root",
  CARROT: "Carrot",
  CLAY: "Clay",
  CLOUD: "Cloud",
  COAL: "Coal",
  CORN_EAR: "Corn Ear",
  CORN_GROWING: "Corn Growing",
  CORN_LEAVES: "Corn Leaves",
  CORN_SILK: "Corn Silk",
  CORN_STALK: "Corn Stalk",
  CORN: "Corn",
  DIRT: "Dirt",
  FERN_FROND: "Fern Frond",
  FERN_GROWING: "Fern Growing",
  FERN_STEM: "Fern Stem",
  FERN: "Fern",
  FOG: "Fog",
  GOLD: "Gold",
  GRASS: "Grass",
  ICE: "Ice",
  IRON: "Iron",
  KELP_BLADE: "Kelp Blade",
  KELP_BULB: "Kelp Bulb",
  KELP_GROWING: "Kelp Growing",
  KELP: "Kelp",
  LAVA: "Lava",
  LAVENDER_BUSH: "Lavender Bush",
  LAVENDER_FLOWERS: "Lavender Flowers",
  LAVENDER_GROWING: "Lavender Growing",
  LAVENDER_STEM: "Lavender Stem",
  LAVENDER: "Lavender",
  LOTUS_BUD: "Lotus Bud",
  LOTUS_FLOWER: "Lotus Flower",
  LOTUS_GROWING: "Lotus Growing",
  LOTUS_PAD: "Lotus Pad",
  LOTUS_STEM: "Lotus Stem",
  LOTUS: "Lotus",
  MOSS: "Moss",
  MUSHROOM_CAP: "Mushroom Cap",
  MUSHROOM_GROWING: "Mushroom Growing",
  MUSHROOM_STEM: "Mushroom Stem",
  MUSHROOM: "Mushroom",
  PINE_CONE: "Pine Cone",
  PINE_NEEDLES: "Pine Needles",
  PINE_TREE_GROWING: "Pine Tree Growing",
  PINE_TREE: "Pine Tree",
  PINE_TRUNK: "Pine Trunk",
  PUMICE: "Pumice",
  PUMPKIN_FRUIT: "Pumpkin Fruit",
  PUMPKIN_GROWING: "Pumpkin Growing",
  PUMPKIN_LEAVES: "Pumpkin Leaves",
  PUMPKIN_STEM: "Pumpkin Stem",
  PUMPKIN_VINE: "Pumpkin Vine",
  PUMPKIN: "Pumpkin",
  ROSE_BLOOM: "Rose Bloom",
  ROSE_BUD: "Rose Bud",
  ROSE_GROWING: "Rose Growing",
  ROSE_LEAVES: "Rose Leaves",
  ROSE_STEM: "Rose Stem",
  ROSE_THORNS: "Rose Thorns",
  ROSE: "Rose",
  SAND: "Sand",
  SNOW: "Snow",
  STONE: "Stone",
  SUNFLOWER_CENTER: "Sunflower Center",
  SUNFLOWER_GROWING: "Sunflower Growing",
  SUNFLOWER_LEAVES: "Sunflower Leaves",
  SUNFLOWER_PETALS: "Sunflower Petals",
  SUNFLOWER_STEM: "Sunflower Stem",
  SUNFLOWER: "Sunflower",
  TREE_GROWING: "Tree Growing",
  TREE_LEAVES: "Tree Leaves",
  TREE_TRUNK: "Tree Trunk",
  TULIP_BULB: "Tulip Bulb",
  TULIP_GROWING: "Tulip Growing",
  TULIP_LEAVES: "Tulip Leaves",
  TULIP_PETALS: "Tulip Petals",
  TULIP_STEM: "Tulip Stem",
  TULIP: "Tulip",
  WATER: "Water",
  WHEAT_GRAIN: "Wheat Grain",
  WHEAT_GROWING: "Wheat Growing",
  WHEAT_STALK: "Wheat Stalk",
  WHEAT: "Wheat",
  WILLOW_BRANCHES: "Willow Branches",
  WILLOW_LEAVES: "Willow Leaves",
  WILLOW_TREE_GROWING: "Willow Tree Growing",
  WILLOW_TREE: "Willow Tree",
  WILLOW_TRUNK: "Willow Trunk",
  WOOD: "Wood",
};

export const FAST_GROWTH_TIME = 30;

/**
 * Array of block definitions.
 *
 * @type {BlockDefinition[]}
 */
export const blocks = [
  {
    name: blockNames.AIR,
    id: 0,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.AGAVE_BASE,
    id: 82,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.AGAVE_FLOWER_STALK,
    id: 84,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.AGAVE_FLOWER,
    id: 85,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.AGAVE_GROWING,
    id: 81,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.AGAVE_SPIKE,
    id: 83,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.AGAVE,
    id: 80,
    drops: "AGAVE",
    solid: true,
    growthTime: 1920,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.BAMBOO_GROWING,
    id: 43,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.BAMBOO_JOINT,
    id: 53,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BAMBOO_LEAVES,
    id: 54,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BAMBOO_STALK,
    id: 52,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BAMBOO,
    id: 36,
    drops: "BAMBOO",
    solid: true,
    growthTime: 180,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.BEDROCK,
    id: 19,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BERRY_BUSH_BERRIES,
    id: 51,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BERRY_BUSH_BRANCH,
    id: 49,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BERRY_BUSH_GROWING,
    id: 42,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.BERRY_BUSH_LEAVES,
    id: 50,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BERRY_BUSH,
    id: 35,
    drops: "BERRY_BUSH",
    solid: true,
    growthTime: 360,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.BIRCH_BARK,
    id: 117,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BIRCH_BRANCHES,
    id: 118,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BIRCH_CATKINS,
    id: 120,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BIRCH_GROWING,
    id: 115,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.BIRCH_LEAVES,
    id: 119,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BIRCH_TRUNK,
    id: 116,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.BIRCH,
    id: 114,
    drops: ["BIRCH", "WOOD"],
    solid: true,
    growthTime: 1260,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.CACTUS_BODY,
    id: 30,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CACTUS_FLOWER,
    id: 31,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CACTUS_GROWING,
    id: 23,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.CACTUS,
    id: 15,
    drops: "CACTUS",
    solid: true,
    growthTime: 2400,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.CARROT_GROWING,
    id: 21,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.CARROT_LEAVES,
    id: 26,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CARROT_ROOT,
    id: 27,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CARROT,
    id: 13,
    drops: "CARROT",
    solid: true,
    growthTime: 240,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.CLAY,
    id: 6,
    drops: "CLAY",
    solid: true,
  },
  {
    name: blockNames.CLOUD,
    id: 72,
    drops: "CLOUD",
    solid: true,
  },
  {
    name: blockNames.COAL,
    id: 7,
    drops: "COAL",
    solid: true,
  },
  {
    name: blockNames.CORN_EAR,
    id: 61,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CORN_GROWING,
    id: 45,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.CORN_LEAVES,
    id: 60,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CORN_SILK,
    id: 62,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CORN_STALK,
    id: 59,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.CORN,
    id: 38,
    drops: "CORN",
    solid: true,
    growthTime: 420,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.DIRT,
    id: 2,
    drops: "DIRT",
    solid: true,
  },
  {
    name: blockNames.FERN_FROND,
    id: 70,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.FERN_GROWING,
    id: 48,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.FERN_STEM,
    id: 69,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.FERN,
    id: 41,
    drops: "FERN",
    solid: true,
    growthTime: 90,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.GOLD,
    id: 9,
    drops: "GOLD",
    solid: true,
  },
  {
    name: blockNames.GRASS,
    id: 1,
    drops: "GRASS",
    solid: true,
  },
  {
    name: blockNames.ICE,
    id: 17,
    drops: "ICE",
    solid: true,
  },
  {
    name: blockNames.IRON,
    id: 8,
    drops: "IRON",
    solid: true,
  },
  {
    name: blockNames.KELP_BLADE,
    id: 93,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.KELP_BULB,
    id: 94,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.KELP_GROWING,
    id: 92,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.KELP,
    id: 91,
    drops: "KELP",
    solid: true,
    growthTime: 150,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.LAVA,
    id: 18,
    drops: null,
    solid: true,
    gravity: true,
  },
  {
    name: blockNames.LAVENDER_BUSH,
    id: 89,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.LAVENDER_FLOWERS,
    id: 90,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.LAVENDER_GROWING,
    id: 87,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.LAVENDER_STEM,
    id: 88,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.LAVENDER,
    id: 86,
    drops: "LAVENDER",
    solid: true,
    growthTime: 200,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.LOTUS_BUD,
    id: 112,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.LOTUS_FLOWER,
    id: 113,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.LOTUS_GROWING,
    id: 109,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.LOTUS_PAD,
    id: 110,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.LOTUS_STEM,
    id: 111,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.LOTUS,
    id: 108,
    drops: "LOTUS",
    solid: true,
    growthTime: 390,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.MUSHROOM_CAP,
    id: 29,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.MUSHROOM_GROWING,
    id: 22,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.MUSHROOM_STEM,
    id: 28,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.MUSHROOM,
    id: 14,
    drops: "MUSHROOM",
    solid: true,
    growthTime: 120,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.PINE_CONE,
    id: 65,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.PINE_NEEDLES,
    id: 64,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.PINE_TREE_GROWING,
    id: 46,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.PINE_TREE,
    id: 39,
    drops: "PINE_TREE",
    solid: true,
    growthTime: 1440,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.PINE_TRUNK,
    id: 63,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.PUMICE,
    id: 71,
    drops: "PUMICE",
    solid: true,
  },
  {
    name: blockNames.PUMPKIN_FRUIT,
    id: 106,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.PUMPKIN_GROWING,
    id: 103,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.PUMPKIN_LEAVES,
    id: 105,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.PUMPKIN_STEM,
    id: 107,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.PUMPKIN_VINE,
    id: 104,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.PUMPKIN,
    id: 102,
    drops: "PUMPKIN",
    solid: true,
    growthTime: 660,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.ROSE_BLOOM,
    id: 101,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.ROSE_BUD,
    id: 100,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.ROSE_GROWING,
    id: 96,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.ROSE_LEAVES,
    id: 99,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.ROSE_STEM,
    id: 97,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.ROSE_THORNS,
    id: 98,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.ROSE,
    id: 95,
    drops: "ROSE",
    solid: true,
    growthTime: 540,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.SAND,
    id: 5,
    drops: "SAND",
    solid: true,
    gravity: true,
  },
  {
    name: blockNames.SNOW,
    id: 16,
    drops: "SNOW",
    solid: true,
  },
  {
    name: blockNames.STONE,
    id: 3,
    drops: "STONE",
    solid: true,
  },
  {
    name: blockNames.SUNFLOWER_CENTER,
    id: 57,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.SUNFLOWER_GROWING,
    id: 44,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.SUNFLOWER_LEAVES,
    id: 56,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.SUNFLOWER_PETALS,
    id: 58,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.SUNFLOWER_STEM,
    id: 55,
    drops: "SUNFLOWER",
    solid: true,
  },
  {
    name: blockNames.SUNFLOWER,
    id: 37,
    drops: null,
    solid: true,
    growthTime: 600,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.TREE_GROWING,
    id: 34,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.TREE_LEAVES,
    id: 11,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.TREE_TRUNK,
    id: 10,
    drops: "WOOD",
    solid: true,
    crop: true,
  },
  {
    name: blockNames.TULIP_BULB,
    id: 79,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.TULIP_GROWING,
    id: 75,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.TULIP_LEAVES,
    id: 77,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.TULIP_PETALS,
    id: 78,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.TULIP_STEM,
    id: 76,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.TULIP,
    id: 74,
    drops: "TULIP",
    solid: true,
    growthTime: 300,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.WATER,
    id: 4,
    drops: null,
    solid: true,
    gravity: true,
  },
  {
    name: blockNames.WHEAT_GRAIN,
    id: 25,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.WHEAT_GROWING,
    id: 20,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.WHEAT_STALK,
    id: 24,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.WHEAT,
    id: 12,
    drops: "WHEAT",
    solid: true,
    growthTime: 480,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.WILLOW_BRANCHES,
    id: 67,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.WILLOW_LEAVES,
    id: 68,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.WILLOW_TREE_GROWING,
    id: 47,
    drops: null,
    solid: true,
    crop: true,
  },
  {
    name: blockNames.WILLOW_TREE,
    id: 40,
    drops: ["WILLOW_TREE", "WOOD"],
    solid: true,
    growthTime: 1800,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.WILLOW_TRUNK,
    id: 66,
    drops: null,
    solid: true,
  },
  {
    name: blockNames.WOOD,
    id: 73,
    drops: "WOOD",
    solid: true,
    crop: true,
  },
];

/**
 * Build a map of block ID to array index.
 *
 * @type {Map<number, number>}
 */
const blockIdToIndexMap = new Map();
blocks.forEach((block, index) => {
  blockIdToIndexMap.set(block.id, index);
});

/**
 * Get the array index of a block by its ID.
 *
 * @param {number} blockId - The block ID
 *
 * @returns {number|undefined} The array index, or undefined if not found
 */
export function getBlockIndexById(blockId) {
  return blockIdToIndexMap.get(blockId);
}

/**
 * Get a block definition by its ID.
 *
 * @param {number} blockId - The block ID
 *
 * @returns {BlockDefinition|undefined} The block definition, or undefined if not found
 */
export function getBlockById(blockId) {
  const index = blockIdToIndexMap.get(blockId);
  return index !== undefined ? blocks[index] : undefined;
}

/**
 * Get a block definition by its array index.
 *
 * @param {number} index - The array index
 *
 * @returns {BlockDefinition|undefined} The block definition, or undefined if not found
 */
export function getBlockByIndex(index) {
  return blocks[index];
}

/**
 * Block property definition.
 *
 * @typedef {Object} BlockDefinition
 *
 * @property {string} name - Display name of the block
 * @property {number} [growthTime] - Time in seconds for plant to grow
 * @property {boolean} [isSeed=false] - Whether this block is a seed/plant
 * @property {boolean} [gravity=false] - Whether a block falls
 * @property {boolean} [crop=false] - Whether this block is a crop
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
  },
  {
    name: blockNames.AGAVE_BASE,
  },
  {
    name: blockNames.AGAVE_FLOWER_STALK,
  },
  {
    name: blockNames.AGAVE_FLOWER,
  },
  {
    name: blockNames.AGAVE_GROWING,
    crop: true,
  },
  {
    name: blockNames.AGAVE_SPIKE,
  },
  {
    name: blockNames.AGAVE,
    growthTime: 1920,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.BAMBOO_GROWING,
    crop: true,
  },
  {
    name: blockNames.BAMBOO_JOINT,
  },
  {
    name: blockNames.BAMBOO_LEAVES,
  },
  {
    name: blockNames.BAMBOO_STALK,
  },
  {
    name: blockNames.BAMBOO,
    growthTime: 180,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.BEDROCK,
  },
  {
    name: blockNames.BERRY_BUSH_BERRIES,
  },
  {
    name: blockNames.BERRY_BUSH_BRANCH,
  },
  {
    name: blockNames.BERRY_BUSH_GROWING,
    crop: true,
  },
  {
    name: blockNames.BERRY_BUSH_LEAVES,
  },
  {
    name: blockNames.BERRY_BUSH,
    growthTime: 360,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.BIRCH_BARK,
  },
  {
    name: blockNames.BIRCH_BRANCHES,
  },
  {
    name: blockNames.BIRCH_CATKINS,
  },
  {
    name: blockNames.BIRCH_GROWING,
    crop: true,
  },
  {
    name: blockNames.BIRCH_LEAVES,
  },
  {
    name: blockNames.BIRCH_TRUNK,
  },
  {
    name: blockNames.BIRCH,
    growthTime: 1260,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.CACTUS_BODY,
  },
  {
    name: blockNames.CACTUS_FLOWER,
  },
  {
    name: blockNames.CACTUS_GROWING,
    crop: true,
  },
  {
    name: blockNames.CACTUS,
    growthTime: 2400,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.CARROT_GROWING,
    crop: true,
  },
  {
    name: blockNames.CARROT_LEAVES,
  },
  {
    name: blockNames.CARROT_ROOT,
  },
  {
    name: blockNames.CARROT,
    growthTime: 240,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.CLAY,
  },
  {
    name: blockNames.CLOUD,
  },
  {
    name: blockNames.COAL,
  },
  {
    name: blockNames.CORN_EAR,
  },
  {
    name: blockNames.CORN_GROWING,
    crop: true,
  },
  {
    name: blockNames.CORN_LEAVES,
  },
  {
    name: blockNames.CORN_SILK,
  },
  {
    name: blockNames.CORN_STALK,
  },
  {
    name: blockNames.CORN,
    growthTime: 420,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.DIRT,
  },
  {
    name: blockNames.FERN_FROND,
  },
  {
    name: blockNames.FERN_GROWING,
    crop: true,
  },
  {
    name: blockNames.FERN_STEM,
  },
  {
    name: blockNames.FERN,
    growthTime: 90,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.GOLD,
  },
  {
    name: blockNames.GRASS,
  },
  {
    name: blockNames.ICE,
  },
  {
    name: blockNames.IRON,
  },
  {
    name: blockNames.KELP_BLADE,
  },
  {
    name: blockNames.KELP_BULB,
  },
  {
    name: blockNames.KELP_GROWING,
    crop: true,
  },
  {
    name: blockNames.KELP,
    growthTime: 150,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.LAVA,
    gravity: true,
  },
  {
    name: blockNames.LAVENDER_BUSH,
  },
  {
    name: blockNames.LAVENDER_FLOWERS,
  },
  {
    name: blockNames.LAVENDER_GROWING,
    crop: true,
  },
  {
    name: blockNames.LAVENDER_STEM,
  },
  {
    name: blockNames.LAVENDER,
    growthTime: 200,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.LOTUS_BUD,
  },
  {
    name: blockNames.LOTUS_FLOWER,
  },
  {
    name: blockNames.LOTUS_GROWING,
    crop: true,
  },
  {
    name: blockNames.LOTUS_PAD,
  },
  {
    name: blockNames.LOTUS_STEM,
  },
  {
    name: blockNames.LOTUS,
    growthTime: 390,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.MUSHROOM_CAP,
  },
  {
    name: blockNames.MUSHROOM_GROWING,
    crop: true,
  },
  {
    name: blockNames.MUSHROOM_STEM,
  },
  {
    name: blockNames.MUSHROOM,
    growthTime: 120,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.PINE_CONE,
  },
  {
    name: blockNames.PINE_NEEDLES,
  },
  {
    name: blockNames.PINE_TREE_GROWING,
    crop: true,
  },
  {
    name: blockNames.PINE_TREE,
    growthTime: 1440,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.PINE_TRUNK,
  },
  {
    name: blockNames.PUMICE,
  },
  {
    name: blockNames.PUMPKIN_FRUIT,
  },
  {
    name: blockNames.PUMPKIN_GROWING,
    crop: true,
  },
  {
    name: blockNames.PUMPKIN_LEAVES,
  },
  {
    name: blockNames.PUMPKIN_STEM,
  },
  {
    name: blockNames.PUMPKIN_VINE,
  },
  {
    name: blockNames.PUMPKIN,
    growthTime: 660,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.ROSE_BLOOM,
  },
  {
    name: blockNames.ROSE_BUD,
  },
  {
    name: blockNames.ROSE_GROWING,
    crop: true,
  },
  {
    name: blockNames.ROSE_LEAVES,
  },
  {
    name: blockNames.ROSE_STEM,
  },
  {
    name: blockNames.ROSE_THORNS,
  },
  {
    name: blockNames.ROSE,
    growthTime: 540,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.SAND,
    gravity: true,
  },
  {
    name: blockNames.SNOW,
  },
  {
    name: blockNames.STONE,
  },
  {
    name: blockNames.SUNFLOWER_CENTER,
  },
  {
    name: blockNames.SUNFLOWER_GROWING,
    crop: true,
  },
  {
    name: blockNames.SUNFLOWER_LEAVES,
  },
  {
    name: blockNames.SUNFLOWER_PETALS,
  },
  {
    name: blockNames.SUNFLOWER_STEM,
  },
  {
    name: blockNames.SUNFLOWER,
    growthTime: 600,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.TREE_GROWING,
    crop: true,
  },
  {
    name: blockNames.TREE_LEAVES,
    crop: true,
  },
  {
    name: blockNames.TREE_TRUNK,
    crop: true,
  },
  {
    name: blockNames.TULIP_BULB,
  },
  {
    name: blockNames.TULIP_GROWING,
    crop: true,
  },
  {
    name: blockNames.TULIP_LEAVES,
  },
  {
    name: blockNames.TULIP_PETALS,
  },
  {
    name: blockNames.TULIP_STEM,
  },
  {
    name: blockNames.TULIP,
    growthTime: 300,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.WATER,
    gravity: true,
  },
  {
    name: blockNames.WHEAT_GRAIN,
  },
  {
    name: blockNames.WHEAT_GROWING,
    crop: true,
  },
  {
    name: blockNames.WHEAT_STALK,
  },
  {
    name: blockNames.WHEAT,
    growthTime: 480,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.WILLOW_BRANCHES,
  },
  {
    name: blockNames.WILLOW_LEAVES,
  },
  {
    name: blockNames.WILLOW_TREE_GROWING,
    crop: true,
  },
  {
    name: blockNames.WILLOW_TREE,
    growthTime: 1800,
    isSeed: true,
    crop: true,
  },
  {
    name: blockNames.WILLOW_TRUNK,
  },
  {
    name: blockNames.WOOD,
    crop: true,
  },
];

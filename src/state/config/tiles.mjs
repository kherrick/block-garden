/**
 * @param {any} v
 *
 * @returns {any}
 */
const getT = (v) => ({
  crop: false,
  farmable: false,
  solid: false,
  isSeed: false,
  drops: null,
  ...v,
});

export const TileName = {
  AIR: "AIR",
  AGAVE_BASE: "AGAVE_BASE",
  AGAVE_FLOWER_STALK: "AGAVE_FLOWER_STALK",
  AGAVE_FLOWER: "AGAVE_FLOWER",
  AGAVE_GROWING: "AGAVE_GROWING",
  AGAVE_SPIKE: "AGAVE_SPIKE",
  AGAVE: "AGAVE",
  BAMBOO_GROWING: "BAMBOO_GROWING",
  BAMBOO_JOINT: "BAMBOO_JOINT",
  BAMBOO_LEAVES: "BAMBOO_LEAVES",
  BAMBOO_STALK: "BAMBOO_STALK",
  BAMBOO: "BAMBOO",
  BEDROCK: "BEDROCK",
  BERRY_BUSH_BERRIES: "BERRY_BUSH_BERRIES",
  BERRY_BUSH_BRANCH: "BERRY_BUSH_BRANCH",
  BERRY_BUSH_GROWING: "BERRY_BUSH_GROWING",
  BERRY_BUSH_LEAVES: "BERRY_BUSH_LEAVES",
  BERRY_BUSH: "BERRY_BUSH",
  BIRCH_BARK: "BIRCH_BARK",
  BIRCH_BRANCHES: "BIRCH_BRANCHES",
  BIRCH_CATKINS: "BIRCH_CATKINS",
  BIRCH_GROWING: "BIRCH_GROWING",
  BIRCH_LEAVES: "BIRCH_LEAVES",
  BIRCH_TRUNK: "BIRCH_TRUNK",
  BIRCH: "BIRCH",
  CACTUS_BODY: "CACTUS_BODY",
  CACTUS_FLOWER: "CACTUS_FLOWER",
  CACTUS_GROWING: "CACTUS_GROWING",
  CACTUS: "CACTUS",
  CARROT_GROWING: "CARROT_GROWING",
  CARROT_LEAVES: "CARROT_LEAVES",
  CARROT_ROOT: "CARROT_ROOT",
  CARROT: "CARROT",
  CLAY: "CLAY",
  CLOUD: "CLOUD",
  COAL: "COAL",
  CORN_EAR: "CORN_EAR",
  CORN_GROWING: "CORN_GROWING",
  CORN_LEAVES: "CORN_LEAVES",
  CORN_SILK: "CORN_SILK",
  CORN_STALK: "CORN_STALK",
  CORN: "CORN",
  DIRT: "DIRT",
  FERN_FROND: "FERN_FROND",
  FERN_GROWING: "FERN_GROWING",
  FERN_STEM: "FERN_STEM",
  FERN: "FERN",
  GOLD: "GOLD",
  GRASS: "GRASS",
  ICE: "ICE",
  IRON: "IRON",
  KELP_BLADE: "KELP_BLADE",
  KELP_BULB: "KELP_BULB",
  KELP_GROWING: "KELP_GROWING",
  KELP: "KELP",
  LAVA: "LAVA",
  LAVENDER_BUSH: "LAVENDER_BUSH",
  LAVENDER_FLOWERS: "LAVENDER_FLOWERS",
  LAVENDER_GROWING: "LAVENDER_GROWING",
  LAVENDER_STEM: "LAVENDER_STEM",
  LAVENDER: "LAVENDER",
  LOTUS_BUD: "LOTUS_BUD",
  LOTUS_FLOWER: "LOTUS_FLOWER",
  LOTUS_GROWING: "LOTUS_GROWING",
  LOTUS_PAD: "LOTUS_PAD",
  LOTUS_STEM: "LOTUS_STEM",
  LOTUS: "LOTUS",
  MOSS: "MOSS",
  MUSHROOM_CAP: "MUSHROOM_CAP",
  MUSHROOM_GROWING: "MUSHROOM_GROWING",
  MUSHROOM_STEM: "MUSHROOM_STEM",
  MUSHROOM: "MUSHROOM",
  PINE_CONE: "PINE_CONE",
  PINE_NEEDLES: "PINE_NEEDLES",
  PINE_TREE_GROWING: "PINE_TREE_GROWING",
  PINE_TREE: "PINE_TREE",
  PINE_TRUNK: "PINE_TRUNK",
  PUMICE: "PUMICE",
  PUMPKIN_FRUIT: "PUMPKIN_FRUIT",
  PUMPKIN_GROWING: "PUMPKIN_GROWING",
  PUMPKIN_LEAVES: "PUMPKIN_LEAVES",
  PUMPKIN_STEM: "PUMPKIN_STEM",
  PUMPKIN_VINE: "PUMPKIN_VINE",
  PUMPKIN: "PUMPKIN",
  ROSE_BLOOM: "ROSE_BLOOM",
  ROSE_BUD: "ROSE_BUD",
  ROSE_GROWING: "ROSE_GROWING",
  ROSE_LEAVES: "ROSE_LEAVES",
  ROSE_STEM: "ROSE_STEM",
  ROSE_THORNS: "ROSE_THORNS",
  ROSE: "ROSE",
  SAND: "SAND",
  SNOW: "SNOW",
  STONE: "STONE",
  SUNFLOWER_CENTER: "SUNFLOWER_CENTER",
  SUNFLOWER_GROWING: "SUNFLOWER_GROWING",
  SUNFLOWER_LEAVES: "SUNFLOWER_LEAVES",
  SUNFLOWER_PETALS: "SUNFLOWER_PETALS",
  SUNFLOWER_STEM: "SUNFLOWER_STEM",
  SUNFLOWER: "SUNFLOWER",
  TREE_GROWING: "TREE_GROWING",
  TREE_LEAVES: "TREE_LEAVES",
  TREE_TRUNK: "TREE_TRUNK",
  TULIP_BULB: "TULIP_BULB",
  TULIP_GROWING: "TULIP_GROWING",
  TULIP_LEAVES: "TULIP_LEAVES",
  TULIP_PETALS: "TULIP_PETALS",
  TULIP_STEM: "TULIP_STEM",
  TULIP: "TULIP",
  WALNUT: "WALNUT",
  WATER: "WATER",
  WHEAT_GRAIN: "WHEAT_GRAIN",
  WHEAT_GROWING: "WHEAT_GROWING",
  WHEAT_STALK: "WHEAT_STALK",
  WHEAT: "WHEAT",
  WILLOW_BRANCHES: "WILLOW_BRANCHES",
  WILLOW_LEAVES: "WILLOW_LEAVES",
  WILLOW_TREE_GROWING: "WILLOW_TREE_GROWING",
  WILLOW_TREE: "WILLOW_TREE",
  WILLOW_TRUNK: "WILLOW_TRUNK",
  WOOD: "WOOD",
};

export const TILES = {
  [TileName.AIR]: getT({ id: 0 }),
  [TileName.AGAVE_BASE]: getT({ id: 82, solid: true }),
  [TileName.AGAVE_FLOWER_STALK]: getT({ id: 84 }),
  [TileName.AGAVE_FLOWER]: getT({ id: 85 }),
  [TileName.AGAVE_GROWING]: getT({ id: 81, solid: true, crop: true }),
  [TileName.AGAVE_SPIKE]: getT({ id: 83, solid: true }),
  [TileName.AGAVE]: getT({
    id: 80,
    solid: true,
    crop: true,
    growthTime: 1920,
    drops: "AGAVE",
    isSeed: true,
  }),
  [TileName.BAMBOO_GROWING]: getT({ id: 43, solid: true, crop: true }),
  [TileName.BAMBOO_JOINT]: getT({ id: 53, solid: true }),
  [TileName.BAMBOO_LEAVES]: getT({ id: 54 }),
  [TileName.BAMBOO_STALK]: getT({ id: 52, solid: true }),
  [TileName.BAMBOO]: getT({
    id: 36,
    solid: true,
    crop: true,
    growthTime: 180,
    drops: "BAMBOO",
    isSeed: true,
  }),
  [TileName.BEDROCK]: getT({ id: 19, solid: true }),
  [TileName.BERRY_BUSH_BERRIES]: getT({ id: 51 }),
  [TileName.BERRY_BUSH_BRANCH]: getT({ id: 49, solid: true }),
  [TileName.BERRY_BUSH_GROWING]: getT({ id: 42, crop: true }),
  [TileName.BERRY_BUSH_LEAVES]: getT({ id: 50, solid: true }),
  [TileName.BERRY_BUSH]: getT({
    id: 35,
    crop: true,
    growthTime: 360,
    drops: "BERRY_BUSH",
    isSeed: true,
  }),
  [TileName.BIRCH_BARK]: getT({ id: 117, solid: true }),
  [TileName.BIRCH_BRANCHES]: getT({ id: 118, solid: true }),
  [TileName.BIRCH_CATKINS]: getT({ id: 120 }),
  [TileName.BIRCH_GROWING]: getT({ id: 115, solid: true, crop: true }),
  [TileName.BIRCH_LEAVES]: getT({ id: 119 }),
  [TileName.BIRCH_TRUNK]: getT({ id: 116, solid: true }),
  [TileName.BIRCH]: getT({
    id: 114,
    solid: true,
    crop: true,
    growthTime: 1260,
    drops: ["BIRCH", "WOOD"],
    isSeed: true,
  }),
  [TileName.CACTUS_BODY]: getT({ id: 30, solid: true }),
  [TileName.CACTUS_FLOWER]: getT({ id: 31 }),
  [TileName.CACTUS_GROWING]: getT({ id: 23, solid: true, crop: true }),
  [TileName.CACTUS]: getT({
    id: 15,
    solid: true,
    crop: true,
    growthTime: 2400,
    drops: "CACTUS",
    isSeed: true,
  }),
  [TileName.CARROT_GROWING]: getT({ id: 21, crop: true }),
  [TileName.CARROT_LEAVES]: getT({ id: 26 }),
  [TileName.CARROT_ROOT]: getT({ id: 27 }),
  [TileName.CARROT]: getT({
    id: 13,
    crop: true,
    growthTime: 240,
    drops: "CARROT",
    isSeed: true,
  }),
  [TileName.CLAY]: getT({ id: 6, solid: true, farmable: true, drops: "CLAY" }),
  [TileName.CLOUD]: getT({
    id: 72,
    drops: "CLOUD",
    farmable: true,
    solid: true,
  }),
  [TileName.COAL]: getT({ id: 7, solid: true, drops: "COAL" }),
  [TileName.CORN_EAR]: getT({ id: 61 }),
  [TileName.CORN_GROWING]: getT({ id: 45, crop: true }),
  [TileName.CORN_LEAVES]: getT({ id: 60 }),
  [TileName.CORN_SILK]: getT({ id: 62 }),
  [TileName.CORN_STALK]: getT({ id: 59 }),
  [TileName.CORN]: getT({
    id: 38,
    crop: true,
    growthTime: 420,
    drops: "CORN",
    isSeed: true,
  }),
  [TileName.DIRT]: getT({ id: 2, solid: true, farmable: true, drops: "DIRT" }),
  [TileName.FERN_FROND]: getT({ id: 70 }),
  [TileName.FERN_GROWING]: getT({ id: 48, crop: true }),
  [TileName.FERN_STEM]: getT({ id: 69 }),
  [TileName.FERN]: getT({
    id: 41,
    crop: true,
    growthTime: 90,
    drops: "FERN",
    isSeed: true,
  }),
  [TileName.GOLD]: getT({ id: 9, solid: true, drops: "GOLD" }),
  [TileName.GRASS]: getT({
    id: 1,
    solid: true,
    farmable: true,
    drops: "GRASS",
  }),
  [TileName.ICE]: getT({ id: 17, solid: true, drops: "ICE" }),
  [TileName.IRON]: getT({ id: 8, solid: true, drops: "IRON" }),
  [TileName.KELP_BLADE]: getT({ id: 93 }),
  [TileName.KELP_BULB]: getT({ id: 94 }),
  [TileName.KELP_GROWING]: getT({ id: 92, crop: true }),
  [TileName.KELP]: getT({
    id: 91,
    crop: true,
    growthTime: 150,
    drops: "KELP",
    isSeed: true,
  }),
  [TileName.LAVA]: getT({ id: 18 }),
  [TileName.LAVENDER_BUSH]: getT({ id: 89 }),
  [TileName.LAVENDER_FLOWERS]: getT({ id: 90 }),
  [TileName.LAVENDER_GROWING]: getT({ id: 87, crop: true }),
  [TileName.LAVENDER_STEM]: getT({ id: 88 }),
  [TileName.LAVENDER]: getT({
    id: 86,
    crop: true,
    growthTime: 200,
    drops: "LAVENDER",
    isSeed: true,
  }),
  [TileName.LOTUS_BUD]: getT({ id: 112 }),
  [TileName.LOTUS_FLOWER]: getT({ id: 113 }),
  [TileName.LOTUS_GROWING]: getT({ id: 109, crop: true }),
  [TileName.LOTUS_PAD]: getT({ id: 110 }),
  [TileName.LOTUS_STEM]: getT({ id: 111 }),
  [TileName.LOTUS]: getT({
    id: 108,
    crop: true,
    growthTime: 390,
    drops: "LOTUS",
    isSeed: true,
  }),
  [TileName.MOSS]: getT({ id: 32 }),
  [TileName.MUSHROOM_CAP]: getT({ id: 29 }),
  [TileName.MUSHROOM_GROWING]: getT({ id: 22, crop: true }),
  [TileName.MUSHROOM_STEM]: getT({ id: 28 }),
  [TileName.MUSHROOM]: getT({
    id: 14,
    crop: true,
    growthTime: 120,
    drops: "MUSHROOM",
    isSeed: true,
  }),
  [TileName.PINE_CONE]: getT({ id: 65 }),
  [TileName.PINE_NEEDLES]: getT({ id: 64, solid: true }),
  [TileName.PINE_TREE_GROWING]: getT({ id: 46, solid: true, crop: true }),
  [TileName.PINE_TREE]: getT({
    id: 39,
    solid: true,
    crop: true,
    growthTime: 1440,
    drops: "PINE_TREE",
    isSeed: true,
  }),
  [TileName.PINE_TRUNK]: getT({ id: 63, solid: true }),
  [TileName.PUMICE]: getT({ id: 71, solid: true, drops: "PUMICE" }),
  [TileName.PUMPKIN_FRUIT]: getT({ id: 106 }),
  [TileName.PUMPKIN_GROWING]: getT({ id: 103, crop: true }),
  [TileName.PUMPKIN_LEAVES]: getT({ id: 105 }),
  [TileName.PUMPKIN_STEM]: getT({ id: 107 }),
  [TileName.PUMPKIN_VINE]: getT({ id: 104 }),
  [TileName.PUMPKIN]: getT({
    id: 102,
    crop: true,
    growthTime: 660,
    drops: "PUMPKIN",
    isSeed: true,
  }),
  [TileName.ROSE_BLOOM]: getT({ id: 101 }),
  [TileName.ROSE_BUD]: getT({ id: 100 }),
  [TileName.ROSE_GROWING]: getT({ id: 96, crop: true }),
  [TileName.ROSE_LEAVES]: getT({ id: 99 }),
  [TileName.ROSE_STEM]: getT({ id: 97 }),
  [TileName.ROSE_THORNS]: getT({ id: 98 }),
  [TileName.ROSE]: getT({
    id: 95,
    crop: true,
    growthTime: 540,
    drops: "ROSE",
    isSeed: true,
  }),
  [TileName.SAND]: getT({ id: 5, solid: true, farmable: true, drops: "SAND" }),
  [TileName.SNOW]: getT({ id: 16, solid: true, farmable: true, drops: "SNOW" }),
  [TileName.STONE]: getT({ id: 3, solid: true, drops: "STONE" }),
  [TileName.SUNFLOWER_CENTER]: getT({ id: 57 }),
  [TileName.SUNFLOWER_GROWING]: getT({ id: 44, crop: true }),
  [TileName.SUNFLOWER_LEAVES]: getT({ id: 56 }),
  [TileName.SUNFLOWER_PETALS]: getT({ id: 58 }),
  [TileName.SUNFLOWER_STEM]: getT({ id: 55 }),
  [TileName.SUNFLOWER]: getT({
    id: 37,
    crop: true,
    growthTime: 600,
    drops: "SUNFLOWER",
    isSeed: true,
  }),
  [TileName.TREE_GROWING]: getT({ id: 34, crop: true }),
  [TileName.TREE_LEAVES]: getT({
    id: 11,
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  [TileName.TREE_TRUNK]: getT({
    id: 10,
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  [TileName.TULIP_BULB]: getT({ id: 79 }),
  [TileName.TULIP_GROWING]: getT({ id: 75, crop: true }),
  [TileName.TULIP_LEAVES]: getT({ id: 77 }),
  [TileName.TULIP_PETALS]: getT({ id: 78 }),
  [TileName.TULIP_STEM]: getT({ id: 76 }),
  [TileName.TULIP]: getT({
    id: 74,
    crop: true,
    growthTime: 300,
    drops: "TULIP",
    isSeed: true,
  }),
  [TileName.WALNUT]: getT({
    id: 33,
    crop: true,
    growthTime: 960,
    drops: ["WALNUT", "WOOD"],
    isSeed: true,
  }),
  [TileName.WATER]: getT({ id: 4 }),
  [TileName.WHEAT_GRAIN]: getT({ id: 25 }),
  [TileName.WHEAT_GROWING]: getT({ id: 20, crop: true }),
  [TileName.WHEAT_STALK]: getT({ id: 24 }),
  [TileName.WHEAT]: getT({
    id: 12,
    crop: true,
    growthTime: 480,
    drops: "WHEAT",
    isSeed: true,
  }),
  [TileName.WILLOW_BRANCHES]: getT({ id: 67, solid: true }),
  [TileName.WILLOW_LEAVES]: getT({ id: 68 }),
  [TileName.WILLOW_TREE_GROWING]: getT({ id: 47, solid: true, crop: true }),
  [TileName.WILLOW_TREE]: getT({
    id: 40,
    solid: true,
    crop: true,
    growthTime: 1800,
    drops: ["WILLOW_TREE", "WOOD"],
    isSeed: true,
  }),
  [TileName.WILLOW_TRUNK]: getT({ id: 66, solid: true }),
  [TileName.WOOD]: getT({ id: 73, solid: false, crop: true, drops: "WOOD" }),
};

export const sgColorPropList = [
  "--sg-color-amber-500",
  "--sg-color-amber-800",
  "--sg-color-amber-900",
  "--sg-color-black-alpha-80",
  "--sg-color-black-transparent",
  "--sg-color-black",
  "--sg-color-blue-400",
  "--sg-color-blue-500",
  "--sg-color-blue-700",
  "--sg-color-emerald-600",
  "--sg-color-emerald-700",
  "--sg-color-gray-100",
  "--sg-color-gray-200",
  "--sg-color-gray-300",
  "--sg-color-gray-400",
  "--sg-color-gray-50",
  "--sg-color-gray-500",
  "--sg-color-gray-600",
  "--sg-color-gray-700",
  "--sg-color-gray-800",
  "--sg-color-gray-900",
  "--sg-color-gray-alpha-30",
  "--sg-color-gray-alpha-50",
  "--sg-color-gray-alpha-70",
  "--sg-color-green-500",
  "--sg-color-neutral-950",
  "--sg-color-orange-500",
  "--sg-color-red-500",
  "--sg-color-sky-50",
  "--sg-color-stone-100",
  "--sg-color-stone-50",
  "--sg-color-white",
];

export const sgTileColorPropList = [
  "--sg-tile-color-agave-base",
  "--sg-tile-color-agave-flower-stalk",
  "--sg-tile-color-agave-flower",
  "--sg-tile-color-agave-growing",
  "--sg-tile-color-agave-spike",
  "--sg-tile-color-agave",
  "--sg-tile-color-air",
  "--sg-tile-color-bamboo-growing",
  "--sg-tile-color-bamboo-joint",
  "--sg-tile-color-bamboo-leaves",
  "--sg-tile-color-bamboo-stalk",
  "--sg-tile-color-bamboo",
  "--sg-tile-color-bedrock",
  "--sg-tile-color-berry-bush-berries",
  "--sg-tile-color-berry-bush-branch",
  "--sg-tile-color-berry-bush-growing",
  "--sg-tile-color-berry-bush-leaves",
  "--sg-tile-color-berry-bush",
  "--sg-tile-color-birch-bark",
  "--sg-tile-color-birch-branches",
  "--sg-tile-color-birch-catkins",
  "--sg-tile-color-birch-growing",
  "--sg-tile-color-birch-leaves",
  "--sg-tile-color-birch-trunk",
  "--sg-tile-color-birch",
  "--sg-tile-color-cactus-body",
  "--sg-tile-color-cactus-flower",
  "--sg-tile-color-cactus-growing",
  "--sg-tile-color-cactus",
  "--sg-tile-color-carrot-growing",
  "--sg-tile-color-carrot-leaves",
  "--sg-tile-color-carrot-root",
  "--sg-tile-color-carrot",
  "--sg-tile-color-clay",
  "--sg-tile-color-cloud",
  "--sg-tile-color-coal",
  "--sg-tile-color-corn-ear",
  "--sg-tile-color-corn-growing",
  "--sg-tile-color-corn-leaves",
  "--sg-tile-color-corn-silk",
  "--sg-tile-color-corn-stalk",
  "--sg-tile-color-corn",
  "--sg-tile-color-dirt",
  "--sg-tile-color-fern-frond",
  "--sg-tile-color-fern-growing",
  "--sg-tile-color-fern-stem",
  "--sg-tile-color-fern",
  "--sg-tile-color-gold",
  "--sg-tile-color-grass",
  "--sg-tile-color-ice",
  "--sg-tile-color-iron",
  "--sg-tile-color-kelp-blade",
  "--sg-tile-color-kelp-bulb",
  "--sg-tile-color-kelp-growing",
  "--sg-tile-color-kelp",
  "--sg-tile-color-lava",
  "--sg-tile-color-lavender-bush",
  "--sg-tile-color-lavender-flowers",
  "--sg-tile-color-lavender-growing",
  "--sg-tile-color-lavender-stem",
  "--sg-tile-color-lavender",
  "--sg-tile-color-loading-pixel",
  "--sg-tile-color-lotus-bud",
  "--sg-tile-color-lotus-flower",
  "--sg-tile-color-lotus-growing",
  "--sg-tile-color-lotus-pad",
  "--sg-tile-color-lotus-stem",
  "--sg-tile-color-lotus",
  "--sg-tile-color-moss",
  "--sg-tile-color-mushroom-cap",
  "--sg-tile-color-mushroom-growing",
  "--sg-tile-color-mushroom-stem",
  "--sg-tile-color-mushroom",
  "--sg-tile-color-pine-cone",
  "--sg-tile-color-pine-needles",
  "--sg-tile-color-pine-tree-growing",
  "--sg-tile-color-pine-tree",
  "--sg-tile-color-pine-trunk",
  "--sg-tile-color-pumice",
  "--sg-tile-color-pumpkin-fruit",
  "--sg-tile-color-pumpkin-growing",
  "--sg-tile-color-pumpkin-leaves",
  "--sg-tile-color-pumpkin-stem",
  "--sg-tile-color-pumpkin-vine",
  "--sg-tile-color-pumpkin",
  "--sg-tile-color-rose-bloom",
  "--sg-tile-color-rose-bud",
  "--sg-tile-color-rose-growing",
  "--sg-tile-color-rose-leaves",
  "--sg-tile-color-rose-stem",
  "--sg-tile-color-rose-thorns",
  "--sg-tile-color-rose",
  "--sg-tile-color-sand",
  "--sg-tile-color-snow",
  "--sg-tile-color-stone",
  "--sg-tile-color-sunflower-center",
  "--sg-tile-color-sunflower-growing",
  "--sg-tile-color-sunflower-leaves",
  "--sg-tile-color-sunflower-petals",
  "--sg-tile-color-sunflower-stem",
  "--sg-tile-color-sunflower",
  "--sg-tile-color-tree-growing",
  "--sg-tile-color-tree-leaves",
  "--sg-tile-color-tree-trunk",
  "--sg-tile-color-tulip-bulb",
  "--sg-tile-color-tulip-growing",
  "--sg-tile-color-tulip-leaves",
  "--sg-tile-color-tulip-petals",
  "--sg-tile-color-tulip-stem",
  "--sg-tile-color-tulip",
  "--sg-tile-color-walnut",
  "--sg-tile-color-water",
  "--sg-tile-color-wheat-grain",
  "--sg-tile-color-wheat-growing",
  "--sg-tile-color-wheat-stalk",
  "--sg-tile-color-wheat",
  "--sg-tile-color-willow-branches",
  "--sg-tile-color-willow-leaves",
  "--sg-tile-color-willow-tree-growing",
  "--sg-tile-color-willow-tree",
  "--sg-tile-color-willow-trunk",
  "--sg-tile-color-wood",
  "--sg-tile-color-xray",
];

/**
 * @param {any} name
 *
 * @returns {any}
 */
export function normalizeTileName(name) {
  return name.toUpperCase().replace(/-/g, "_");
}

/**
 * @param {any} name
 *
 * @returns {any}
 */
export function denormalizeTileName(name) {
  return name.toLowerCase().replace(/_/g, "-");
}

/**
 *
 * @param {*} cssStyleDeclaration
 * @param {*} propNames
 *
 * @returns {{}}
 */
export function buildColorMapByPropNames(cssStyleDeclaration, propNames) {
  const colorMap = {};

  for (const propName of propNames) {
    // Extract tile name from custom property name
    colorMap[propName] = cssStyleDeclaration.getPropertyValue(propName);
  }

  return colorMap;
}

/**
 *
 * @param {*} cssStyleDeclaration
 * @param {*} propNames
 * @param {string} prefix
 *
 * @returns {{}}
 */
export function buildColorMapWithoutPrefixesByPropNames(
  cssStyleDeclaration,
  propNames,
  prefix,
) {
  const colorMap = {};

  for (const propName of propNames) {
    // Extract tile name from custom property name
    colorMap[propName.slice(prefix.length)] =
      cssStyleDeclaration.getPropertyValue(propName);
  }

  return colorMap;
}

/**
 * @param {any} cssStyleDeclaration
 * @param {string} [prefix="--sg-"]
 * @param {(key: any) => any} [keyTransform=(key) => key]
 *
 * @returns {{}}
 */
export function buildColorMapByStyleDeclaration(
  cssStyleDeclaration,
  prefix = "--sg-",
  keyTransform = (key) => key,
) {
  const colorMap = {};

  for (const propName of cssStyleDeclaration) {
    if (propName.startsWith(prefix)) {
      // Extract tile name from custom property name
      const tileNameRaw = propName.slice(prefix.length);
      const tileKey = keyTransform(tileNameRaw);
      const rawValue = cssStyleDeclaration
        .getPropertyValue(propName)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      colorMap[tileKey] = rawValue;
    }
  }

  return colorMap;
}

/**
 * @param {{}} [styleMap={}]
 * @param {string} [prefix="--sg-"]
 * @param {(key: any) => any} [keyTransform=(key) => key]
 *
 * @returns {{}}
 */
export function buildColorMapByStyleMap(
  styleMap = {},
  prefix = "--sg-",
  keyTransform = (key) => key,
) {
  const colorMap = {};

  for (const [key, value] of Object.entries(styleMap)) {
    if (key.startsWith(prefix)) {
      const tileKey = keyTransform(key.slice(prefix.length));

      colorMap[tileKey] = value.trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return colorMap;
}

/**
 * @param {any} currentTiles
 * @param {any} id
 *
 * @returns {string}
 */
export function getTileNameById(currentTiles, id) {
  for (const key in currentTiles) {
    if (currentTiles[key].id === id) {
      return key;
    }
  }

  return null;
}

/**
 * @param {any} currentTiles
 *
 * @returns {any}
 */
export function getTileNameByIdMap(currentTiles) {
  return Object.fromEntries(
    Object.entries(currentTiles).map(([k, v]) => [
      ...[v.id, denormalizeTileName(k)],
    ]),
  );
}

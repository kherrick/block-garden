/**
 * Tile property definition.
 *
 * @typedef {Object} TileDefinition
 *
 * @property {number} [id] - Unique identifier for the tile sprite
 * @property {boolean} [crop=false] - Whether this tile is a crop
 * @property {boolean} [farmable=false] - Whether this tile can be farmed
 * @property {boolean} [solid=false] - Whether this tile is solid/collidable
 * @property {boolean} [isSeed=false] - Whether this tile is a seed
 * @property {string|string[]|null} [drops=null] - What material(s) drop when harvested
 * @property {number} [growthTime] - Time in game ticks for crop to grow
 */

/** @typedef {string} TileName */

/**
 * Tiles.
 *
 * Used for consistent tile usage throughout the game.
 *
 * @typedef {{ [tilename: TileName]: TileDefinition }} TileMap
 */

/**
 * Normalized tile names mapping to string identifiers.
 *
 * Used for consistent tile identification throughout the game.
 *
 * @typedef {{ [tilename: TileName]: string }} TileNameMap
 */

/**
 * Normalized tile names mapping to id numbers.
 *
 * Map of tile ID to denormalized tile name.
 *
 * @typedef {{ [id: number]: string }} TileIdMap
 */

/**
 * Creates a tile definition object with default values.
 *
 * Merges provided properties with sensible defaults for solid, farmable, crop, and seed flags.
 *
 * @param {Partial<TileDefinition>} v - Tile properties to set
 *
 * @returns {TileDefinition} Complete tile definition with defaults applied
 */
const getT = (v) => ({
  crop: false,
  farmable: false,
  solid: false,
  isSeed: false,
  drops: null,
  ...v,
});

/**
 * Map of all tile name constants.
 *
 * @type {TileNameMap}
 *
 * @constant
 */
export const TileNames = {
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
  FOG: "FOG",
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
  LOADING_PIXEL: "LOADING_PIXEL",
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
  PLAYER_BODY: "PLAYER_BODY",
  PLAYER_BORDER: "PLAYER_BORDER",
  PLAYER_EYES: "PLAYER_EYES",
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
  XRAY: "XRAY",
};

/**
 * Complete tile definitions mapping tile names to their properties.
 *
 * Each tile includes an ID for sprite rendering, flags for behavior (solid, farmable, crop),
 * and optional growth time and drop information.
 *
 * @type {TileMap}
 *
 * @constant
 */
export const TILES = {
  [TileNames.AIR]: getT({ id: 0 }),
  [TileNames.AGAVE_BASE]: getT({ id: 82, solid: true }),
  [TileNames.AGAVE_FLOWER_STALK]: getT({ id: 84 }),
  [TileNames.AGAVE_FLOWER]: getT({ id: 85 }),
  [TileNames.AGAVE_GROWING]: getT({ id: 81, solid: true, crop: true }),
  [TileNames.AGAVE_SPIKE]: getT({ id: 83, solid: true }),
  [TileNames.AGAVE]: getT({
    id: 80,
    solid: true,
    crop: true,
    growthTime: 1920,
    drops: "AGAVE",
    isSeed: true,
  }),
  [TileNames.BAMBOO_GROWING]: getT({ id: 43, solid: true, crop: true }),
  [TileNames.BAMBOO_JOINT]: getT({ id: 53, solid: true }),
  [TileNames.BAMBOO_LEAVES]: getT({ id: 54 }),
  [TileNames.BAMBOO_STALK]: getT({ id: 52, solid: true }),
  [TileNames.BAMBOO]: getT({
    id: 36,
    solid: true,
    crop: true,
    growthTime: 180,
    drops: "BAMBOO",
    isSeed: true,
  }),
  [TileNames.BEDROCK]: getT({ id: 19, solid: true }),
  [TileNames.BERRY_BUSH_BERRIES]: getT({ id: 51 }),
  [TileNames.BERRY_BUSH_BRANCH]: getT({ id: 49, solid: true }),
  [TileNames.BERRY_BUSH_GROWING]: getT({ id: 42, crop: true }),
  [TileNames.BERRY_BUSH_LEAVES]: getT({ id: 50, solid: true }),
  [TileNames.BERRY_BUSH]: getT({
    id: 35,
    crop: true,
    growthTime: 360,
    drops: "BERRY_BUSH",
    isSeed: true,
  }),
  [TileNames.BIRCH_BARK]: getT({ id: 117, solid: true }),
  [TileNames.BIRCH_BRANCHES]: getT({ id: 118, solid: true }),
  [TileNames.BIRCH_CATKINS]: getT({ id: 120 }),
  [TileNames.BIRCH_GROWING]: getT({ id: 115, solid: true, crop: true }),
  [TileNames.BIRCH_LEAVES]: getT({ id: 119 }),
  [TileNames.BIRCH_TRUNK]: getT({ id: 116, solid: true }),
  [TileNames.BIRCH]: getT({
    id: 114,
    solid: true,
    crop: true,
    growthTime: 1260,
    drops: ["BIRCH", "WOOD"],
    isSeed: true,
  }),
  [TileNames.CACTUS_BODY]: getT({ id: 30, solid: true }),
  [TileNames.CACTUS_FLOWER]: getT({ id: 31 }),
  [TileNames.CACTUS_GROWING]: getT({ id: 23, solid: true, crop: true }),
  [TileNames.CACTUS]: getT({
    id: 15,
    solid: true,
    crop: true,
    growthTime: 2400,
    drops: "CACTUS",
    isSeed: true,
  }),
  [TileNames.CARROT_GROWING]: getT({ id: 21, crop: true }),
  [TileNames.CARROT_LEAVES]: getT({ id: 26 }),
  [TileNames.CARROT_ROOT]: getT({ id: 27 }),
  [TileNames.CARROT]: getT({
    id: 13,
    crop: true,
    growthTime: 240,
    drops: "CARROT",
    isSeed: true,
  }),
  [TileNames.CLAY]: getT({ id: 6, solid: true, farmable: true, drops: "CLAY" }),
  [TileNames.CLOUD]: getT({
    id: 72,
    drops: "CLOUD",
    farmable: true,
    solid: true,
  }),
  [TileNames.COAL]: getT({ id: 7, solid: true, drops: "COAL" }),
  [TileNames.CORN_EAR]: getT({ id: 61 }),
  [TileNames.CORN_GROWING]: getT({ id: 45, crop: true }),
  [TileNames.CORN_LEAVES]: getT({ id: 60 }),
  [TileNames.CORN_SILK]: getT({ id: 62 }),
  [TileNames.CORN_STALK]: getT({ id: 59 }),
  [TileNames.CORN]: getT({
    id: 38,
    crop: true,
    growthTime: 420,
    drops: "CORN",
    isSeed: true,
  }),
  [TileNames.DIRT]: getT({ id: 2, solid: true, farmable: true, drops: "DIRT" }),
  [TileNames.FERN_FROND]: getT({ id: 70 }),
  [TileNames.FERN_GROWING]: getT({ id: 48, crop: true }),
  [TileNames.FERN_STEM]: getT({ id: 69 }),
  [TileNames.FERN]: getT({
    id: 41,
    crop: true,
    growthTime: 90,
    drops: "FERN",
    isSeed: true,
  }),
  [TileNames.FOG]: getT({ id: 121 }),
  [TileNames.GOLD]: getT({ id: 9, solid: true, drops: "GOLD" }),
  [TileNames.GRASS]: getT({
    id: 1,
    solid: true,
    farmable: true,
    drops: "GRASS",
  }),
  [TileNames.ICE]: getT({ id: 17, solid: true, drops: "ICE" }),
  [TileNames.IRON]: getT({ id: 8, solid: true, drops: "IRON" }),
  [TileNames.KELP_BLADE]: getT({ id: 93 }),
  [TileNames.KELP_BULB]: getT({ id: 94 }),
  [TileNames.KELP_GROWING]: getT({ id: 92, crop: true }),
  [TileNames.KELP]: getT({
    id: 91,
    crop: true,
    growthTime: 150,
    drops: "KELP",
    isSeed: true,
  }),
  [TileNames.LAVA]: getT({ id: 18 }),
  [TileNames.LAVENDER_BUSH]: getT({ id: 89 }),
  [TileNames.LAVENDER_FLOWERS]: getT({ id: 90 }),
  [TileNames.LAVENDER_GROWING]: getT({ id: 87, crop: true }),
  [TileNames.LAVENDER_STEM]: getT({ id: 88 }),
  [TileNames.LAVENDER]: getT({
    id: 86,
    crop: true,
    growthTime: 200,
    drops: "LAVENDER",
    isSeed: true,
  }),
  [TileNames.LOADING_PIXEL]: getT({ id: 122 }),
  [TileNames.LOTUS_BUD]: getT({ id: 112 }),
  [TileNames.LOTUS_FLOWER]: getT({ id: 113 }),
  [TileNames.LOTUS_GROWING]: getT({ id: 109, crop: true }),
  [TileNames.LOTUS_PAD]: getT({ id: 110 }),
  [TileNames.LOTUS_STEM]: getT({ id: 111 }),
  [TileNames.LOTUS]: getT({
    id: 108,
    crop: true,
    growthTime: 390,
    drops: "LOTUS",
    isSeed: true,
  }),
  [TileNames.MOSS]: getT({ id: 32 }),
  [TileNames.MUSHROOM_CAP]: getT({ id: 29 }),
  [TileNames.MUSHROOM_GROWING]: getT({ id: 22, crop: true }),
  [TileNames.MUSHROOM_STEM]: getT({ id: 28 }),
  [TileNames.MUSHROOM]: getT({
    id: 14,
    crop: true,
    growthTime: 120,
    drops: "MUSHROOM",
    isSeed: true,
  }),
  [TileNames.PINE_CONE]: getT({ id: 65 }),
  [TileNames.PINE_NEEDLES]: getT({ id: 64, solid: true }),
  [TileNames.PINE_TREE_GROWING]: getT({ id: 46, solid: true, crop: true }),
  [TileNames.PINE_TREE]: getT({
    id: 39,
    solid: true,
    crop: true,
    growthTime: 1440,
    drops: "PINE_TREE",
    isSeed: true,
  }),
  [TileNames.PINE_TRUNK]: getT({ id: 63, solid: true }),
  [TileNames.PLAYER_BODY]: getT({ id: 124 }),
  [TileNames.PLAYER_BORDER]: getT({ id: 125 }),
  [TileNames.PLAYER_EYES]: getT({ id: 126 }),
  [TileNames.PUMICE]: getT({ id: 71, solid: true, drops: "PUMICE" }),
  [TileNames.PUMPKIN_FRUIT]: getT({ id: 106 }),
  [TileNames.PUMPKIN_GROWING]: getT({ id: 103, crop: true }),
  [TileNames.PUMPKIN_LEAVES]: getT({ id: 105 }),
  [TileNames.PUMPKIN_STEM]: getT({ id: 107 }),
  [TileNames.PUMPKIN_VINE]: getT({ id: 104 }),
  [TileNames.PUMPKIN]: getT({
    id: 102,
    crop: true,
    growthTime: 660,
    drops: "PUMPKIN",
    isSeed: true,
  }),
  [TileNames.ROSE_BLOOM]: getT({ id: 101 }),
  [TileNames.ROSE_BUD]: getT({ id: 100 }),
  [TileNames.ROSE_GROWING]: getT({ id: 96, crop: true }),
  [TileNames.ROSE_LEAVES]: getT({ id: 99 }),
  [TileNames.ROSE_STEM]: getT({ id: 97 }),
  [TileNames.ROSE_THORNS]: getT({ id: 98 }),
  [TileNames.ROSE]: getT({
    id: 95,
    crop: true,
    growthTime: 540,
    drops: "ROSE",
    isSeed: true,
  }),
  [TileNames.SAND]: getT({ id: 5, solid: true, farmable: true, drops: "SAND" }),
  [TileNames.SNOW]: getT({
    id: 16,
    solid: true,
    farmable: true,
    drops: "SNOW",
  }),
  [TileNames.STONE]: getT({ id: 3, solid: true, drops: "STONE" }),
  [TileNames.SUNFLOWER_CENTER]: getT({ id: 57 }),
  [TileNames.SUNFLOWER_GROWING]: getT({ id: 44, crop: true }),
  [TileNames.SUNFLOWER_LEAVES]: getT({ id: 56 }),
  [TileNames.SUNFLOWER_PETALS]: getT({ id: 58 }),
  [TileNames.SUNFLOWER_STEM]: getT({ id: 55 }),
  [TileNames.SUNFLOWER]: getT({
    id: 37,
    crop: true,
    growthTime: 600,
    drops: "SUNFLOWER",
    isSeed: true,
  }),
  [TileNames.TREE_GROWING]: getT({ id: 34, crop: true }),
  [TileNames.TREE_LEAVES]: getT({
    id: 11,
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  [TileNames.TREE_TRUNK]: getT({
    id: 10,
    solid: true,
    crop: true,
    drops: "WOOD",
  }),
  [TileNames.TULIP_BULB]: getT({ id: 79 }),
  [TileNames.TULIP_GROWING]: getT({ id: 75, crop: true }),
  [TileNames.TULIP_LEAVES]: getT({ id: 77 }),
  [TileNames.TULIP_PETALS]: getT({ id: 78 }),
  [TileNames.TULIP_STEM]: getT({ id: 76 }),
  [TileNames.TULIP]: getT({
    id: 74,
    crop: true,
    growthTime: 300,
    drops: "TULIP",
    isSeed: true,
  }),
  [TileNames.WALNUT]: getT({
    id: 33,
    crop: true,
    growthTime: 960,
    drops: ["WALNUT", "WOOD"],
    isSeed: true,
  }),
  [TileNames.WATER]: getT({ id: 4 }),
  [TileNames.WHEAT_GRAIN]: getT({ id: 25 }),
  [TileNames.WHEAT_GROWING]: getT({ id: 20, crop: true }),
  [TileNames.WHEAT_STALK]: getT({ id: 24 }),
  [TileNames.WHEAT]: getT({
    id: 12,
    crop: true,
    growthTime: 480,
    drops: "WHEAT",
    isSeed: true,
  }),
  [TileNames.WILLOW_BRANCHES]: getT({ id: 67, solid: true }),
  [TileNames.WILLOW_LEAVES]: getT({ id: 68 }),
  [TileNames.WILLOW_TREE_GROWING]: getT({ id: 47, solid: true, crop: true }),
  [TileNames.WILLOW_TREE]: getT({
    id: 40,
    solid: true,
    crop: true,
    growthTime: 1800,
    drops: ["WILLOW_TREE", "WOOD"],
    isSeed: true,
  }),
  [TileNames.WILLOW_TRUNK]: getT({ id: 66, solid: true }),
  [TileNames.WOOD]: getT({ id: 73, solid: false, crop: true, drops: "WOOD" }),
  [TileNames.XRAY]: getT({ id: 123 }),
};

/**
 * Tiles used for planting
 *
 * @type {{[ tilename: TileName ]: TileDefinition }}
 */
export const seedTileMap = {
  [TileNames.AGAVE]: TILES.AGAVE_GROWING,
  [TileNames.BAMBOO]: TILES.BAMBOO_GROWING,
  [TileNames.BERRY_BUSH]: TILES.BERRY_BUSH_GROWING,
  [TileNames.BIRCH]: TILES.BIRCH_GROWING,
  [TileNames.CACTUS]: TILES.CACTUS_GROWING,
  [TileNames.CARROT]: TILES.CARROT_GROWING,
  [TileNames.CORN]: TILES.CORN_GROWING,
  [TileNames.FERN]: TILES.FERN_GROWING,
  [TileNames.KELP]: TILES.KELP_GROWING,
  [TileNames.LAVENDER]: TILES.LAVENDER_GROWING,
  [TileNames.LOTUS]: TILES.LOTUS_GROWING,
  [TileNames.MUSHROOM]: TILES.MUSHROOM_GROWING,
  [TileNames.PINE_TREE]: TILES.PINE_TREE_GROWING,
  [TileNames.PUMPKIN]: TILES.PUMPKIN_GROWING,
  [TileNames.ROSE]: TILES.ROSE_GROWING,
  [TileNames.SUNFLOWER]: TILES.SUNFLOWER_GROWING,
  [TileNames.TULIP]: TILES.TULIP_GROWING,
  [TileNames.WALNUT]: TILES.TREE_GROWING,
  [TileNames.WHEAT]: TILES.WHEAT_GROWING,
  [TileNames.WILLOW_TREE]: TILES.WILLOW_TREE_GROWING,
};

/**
 * Converts a tile name from kebab-case or mixed case to UPPER_SNAKE_CASE.
 *
 * Used to normalize tile name input for lookups.
 *
 * @param {string} name - The tile name to normalize (e.g., "berry-bush" or "BerryBush")
 *
 * @returns {string} Normalized tile name in UPPER_SNAKE_CASE (e.g., "BERRY_BUSH")
 */
export function normalizeTileName(name) {
  return name.toUpperCase().replace(/-/g, "_");
}

/**
 * Converts a tile name from UPPER_SNAKE_CASE to kebab-case.
 *
 * Inverse operation of normalizeTileName.
 *
 * @param {string} name - The tile name to denormalize (e.g., "BERRY_BUSH")
 *
 * @returns {string} Denormalized tile name in kebab-case (e.g., "berry-bush")
 */
export function denormalizeTileName(name) {
  return name.toLowerCase().replace(/_/g, "-");
}

/**
 * Looks up a tile name by its unique sprite ID.
 *
 * Used for reverse lookups when you have an ID and need the tile name.
 *
 * @param {TileMap} currentTiles - The tiles map to search
 * @param {number} id - The tile ID to look for
 *
 * @returns {TileDefinition|null} The tile definition matching the ID, or null if not found
 */
export function getTileById(currentTiles, id) {
  for (const tiles in currentTiles) {
    if (currentTiles[tiles].id === id) {
      return currentTiles[tiles];
    }
  }

  return null;
}

/**
 * Looks up a tile name by its unique tile ID.
 *
 * Used for reverse lookups when you have an ID and need the tile name.
 *
 * @param {TileMap} currentTiles - The tiles map to search
 * @param {number} id - The tile ID to look for
 *
 * @returns {string|null} The tile name matching the ID, or null if not found
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
 * Creates a map for O(1) reverse lookups from tile ID to tile name.
 *
 * Useful for efficient sprite-to-name conversions during rendering.
 *
 * @param {TileMap} currentTiles - The tiles map to index
 *
 * @returns {TileIdMap} Map of tile ID to denormalized tile name
 */
export function getTileNameByIdMap(currentTiles) {
  return Object.fromEntries(
    Object.entries(currentTiles).map(([k, v]) => [
      ...[v.id, denormalizeTileName(k)],
    ]),
  );
}

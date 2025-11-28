import { TILES } from "./tiles.mjs";

/** @typedef {import('./tiles.mjs').TileDefinition} TileDefinition */

/**
 * Single biome definition.
 *
 * @typedef {Object} Biome
 *
 * @property {boolean} trees - Whether this biome naturally spawns trees
 * @property {string} name - Display name for the biome
 * @property {TileDefinition} surfaceTile - The primary surface tile for this biome
 * @property {TileDefinition} subTile - The subsurface tile for this biome
 * @property {TileDefinition[]} crops - Array of crops that naturally grow in this biome
 */

/**
 * Biome definitions mapping.
 *
 * @typedef {Object} BiomeMap
 *
 * @property {Biome} FOREST - Temperate forest with trees and diverse crops
 * @property {Biome} DESERT - Hot, dry region with cacti and succulents
 * @property {Biome} TUNDRA - Cold region with limited vegetation
 * @property {Biome} SWAMP - Wet region with water-based crops
 */

const biomeFields = {
  crops: [],
  surfaceTile: null,
  subTile: null,
};

/**
 * Biome definitions for all world regions.
 *
 * Will be initialized after TILES is defined with surface/sub tiles and crops.
 *
 * @type {BiomeMap}
 *
 * @constant
 */
// Biome definitions Will be set after TILES is defined
const BIOMES = {
  FOREST: { trees: true, name: "Forest", ...biomeFields },
  DESERT: { trees: false, name: "Desert", ...biomeFields },
  TUNDRA: { trees: false, name: "Tundra", ...biomeFields },
  SWAMP: { trees: true, name: "Swamp", ...biomeFields },
};

// Initialize BIOMES after TILES IS defined
BIOMES.FOREST.surfaceTile = TILES.GRASS;
BIOMES.FOREST.subTile = TILES.DIRT;
BIOMES.FOREST.crops = [
  TILES.BERRY_BUSH,
  TILES.BIRCH,
  TILES.CARROT,
  TILES.FERN,
  TILES.LAVENDER,
  TILES.PINE_TREE,
  TILES.PUMPKIN,
  TILES.ROSE,
  TILES.TULIP,
  TILES.WHEAT,
];

BIOMES.DESERT.surfaceTile = TILES.SAND;
BIOMES.DESERT.subTile = TILES.SAND;
BIOMES.DESERT.crops = [TILES.AGAVE, TILES.CACTUS, TILES.SUNFLOWER];

BIOMES.TUNDRA.surfaceTile = TILES.SNOW;
BIOMES.TUNDRA.subTile = TILES.ICE;
BIOMES.TUNDRA.crops = [TILES.BIRCH, TILES.FERN, TILES.PINE_TREE];

BIOMES.SWAMP.surfaceTile = TILES.CLAY;
BIOMES.SWAMP.subTile = TILES.CLAY;
BIOMES.SWAMP.crops = [
  TILES.BAMBOO,
  TILES.CORN,
  TILES.KELP,
  TILES.LOTUS,
  TILES.MUSHROOM,
  TILES.WILLOW_TREE,
];

/**
 * Map of all biome definitions keyed by biome name.
 *
 * Each biome contains terrain types, naturally spawning crops, and environment properties.
 *
 * @type {BiomeMap}
 *
 * @constant
 */
export { BIOMES };

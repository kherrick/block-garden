/**
 * Biome configuration for Block Garden.
 *
 * Each biome defines surface/sub-surface blocks and available crops.
 */

import { blocks, blockNames } from "./blocks.mjs";

/** @typedef {import('./blocks.mjs').BlockDefinition} BlockDefinition */

/**
 * Get block ID by name.
 *
 * @param {string} name - Block name
 * @returns {number} Block ID
 */
function getBlockId(name) {
  const block = blocks.find((b) => b.name === name);
  return block ? block.id : -1;
}

/**
 * Single biome definition.
 *
 * @typedef {Object} Biome
 *
 * @property {string} name - Display name for the biome
 * @property {boolean} trees - Whether this biome naturally spawns trees
 * @property {number} surfaceBlockId - Block ID for surface
 * @property {number} subBlockId - Block ID for sub-surface
 * @property {number[]} cropBlockIds - Block IDs for crops that spawn in this biome
 */

/**
 * Biome definitions mapping.
 *
 * @typedef {Object} BiomeMap
 *
 * @property {Biome} FOREST
 * @property {Biome} DESERT
 * @property {Biome} TUNDRA
 * @property {Biome} SWAMP
 */

/**
 * @type {BiomeMap}
 */
export const BIOMES = {
  FOREST: {
    name: "Forest",
    trees: true,
    surfaceBlockId: getBlockId(blockNames.GRASS),
    subBlockId: getBlockId(blockNames.DIRT),
    cropBlockIds: [
      getBlockId(blockNames.BERRY_BUSH),
      getBlockId(blockNames.BIRCH),
      getBlockId(blockNames.CARROT),
      getBlockId(blockNames.FERN),
      getBlockId(blockNames.LAVENDER),
      getBlockId(blockNames.PINE_TREE),
      getBlockId(blockNames.PUMPKIN),
      getBlockId(blockNames.ROSE),
      getBlockId(blockNames.TULIP),
      getBlockId(blockNames.WHEAT),
    ],
  },
  DESERT: {
    name: "Desert",
    trees: false,
    surfaceBlockId: getBlockId(blockNames.SAND),
    subBlockId: getBlockId(blockNames.SAND),
    cropBlockIds: [
      getBlockId(blockNames.AGAVE),
      getBlockId(blockNames.CACTUS),
      getBlockId(blockNames.SUNFLOWER),
    ],
  },
  TUNDRA: {
    name: "Tundra",
    trees: false,
    surfaceBlockId: getBlockId(blockNames.SNOW),
    subBlockId: getBlockId(blockNames.ICE),
    cropBlockIds: [
      getBlockId(blockNames.BIRCH),
      getBlockId(blockNames.FERN),
      getBlockId(blockNames.PINE_TREE),
    ],
  },
  SWAMP: {
    name: "Swamp",
    trees: true,
    surfaceBlockId: getBlockId(blockNames.CLAY),
    subBlockId: getBlockId(blockNames.CLAY),
    cropBlockIds: [
      getBlockId(blockNames.BAMBOO),
      getBlockId(blockNames.CORN),
      getBlockId(blockNames.KELP),
      getBlockId(blockNames.LOTUS),
      getBlockId(blockNames.MUSHROOM),
      getBlockId(blockNames.WILLOW_TREE),
    ],
  },
};

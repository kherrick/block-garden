/**
 * Per-chunk procedural terrain generator.
 * Generates terrain for a single chunk based on world seed.
 */

import { initNoise, terrainNoise, noise3d } from "../util/noise.mjs";

/**
 * @typedef {import('../util/chunk.mjs').Chunk} Chunk
 */

/**
 * @typedef {import('../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 */

// Block IDs (cached after first lookup)
let blockIds = null;

/**
 * Initialize block ID lookup cache.
 *
 * @param {BlockDefinition[]} blocks
 * @param {{[key: string]: string}} blockNames
 */
function initBlockIds(blocks, blockNames) {
  if (blockIds) return;

  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  blockIds = {
    GRASS: getBlockId(blockNames.GRASS),
    DIRT: getBlockId(blockNames.DIRT),
    STONE: getBlockId(blockNames.STONE),
    WATER: getBlockId(blockNames.WATER),
    SAND: getBlockId(blockNames.SAND),
    CLOUD: getBlockId(blockNames.CLOUD),
    WOOD: getBlockId(blockNames.WOOD),
    TREE_LEAVES: getBlockId(blockNames.TREE_LEAVES),
  };
}

/**
 * Terrain generation constants.
 */
const MIN_Y = 1;
const MAX_Y = 24;
const SEA_LEVEL = 4;
const CLOUD_HEIGHT_MIN = 18;
const CLOUD_HEIGHT_MAX = 22;

/**
 * Generate terrain for a single chunk.
 *
 * @param {Chunk} chunk - The chunk to generate
 * @param {number} seed - World seed
 * @param {BlockDefinition[]} blocks - Block definitions
 * @param {{[key: string]: string}} blockNames - Block name mapping
 */
export function generateChunk(chunk, seed, blocks, blockNames) {
  // Skip if already generated
  if (chunk.generated) {
    return;
  }

  // Ensure noise is initialized
  initNoise(seed);

  // Ensure block IDs are cached
  initBlockIds(blocks, blockNames);

  const { GRASS, DIRT, STONE, WATER, SAND, CLOUD, WOOD, TREE_LEAVES } =
    blockIds;

  // Generate each column in the chunk
  for (let localX = 0; localX < 16; localX++) {
    for (let localZ = 0; localZ < 16; localZ++) {
      const worldX = chunk.worldX + localX;
      const worldZ = chunk.worldZ + localZ;

      // Calculate terrain height using noise
      const n = terrainNoise(worldX, worldZ, seed);
      let surfaceHeight = Math.floor(((n + 1) / 2) * 12 + 2);

      // Ensure spawn area has solid ground
      if (Math.abs(worldX) < 3 && Math.abs(worldZ) < 3) {
        surfaceHeight = Math.max(surfaceHeight, SEA_LEVEL + 1);
      }

      // Fill the column
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        let blockType = 0; // Air by default

        if (y === MIN_Y) {
          blockType = WATER; // Bottom water layer
        } else if (y <= surfaceHeight) {
          if (y === surfaceHeight) {
            if (y < SEA_LEVEL + 1) {
              blockType = SAND;
            } else {
              blockType = GRASS;

              // Tree chance (away from spawn)
              if (
                (Math.abs(worldX) > 4 || Math.abs(worldZ) > 4) &&
                seededRandom(worldX, worldZ, seed) < 0.02 &&
                worldX % 3 !== 0 &&
                worldZ % 3 !== 0
              ) {
                placeTree(chunk, localX, y + 1, localZ, WOOD, TREE_LEAVES);
              }
            }
          } else if (y > surfaceHeight - 3) {
            blockType = DIRT;
          } else {
            blockType = STONE;
          }
        } else {
          // Above surface
          if (y <= SEA_LEVEL) {
            blockType = WATER;
          } else if (
            (Math.abs(worldX) > 6 || Math.abs(worldZ) > 6) &&
            y >= CLOUD_HEIGHT_MIN &&
            y <= CLOUD_HEIGHT_MAX
          ) {
            // Cloud generation
            const cn = noise3d(worldX, y, worldZ, seed, 2, 0.5, 0.05);
            if (cn > 0.45) {
              blockType = CLOUD;
            }
          }
        }

        if (blockType !== 0) {
          chunk.setBlock(localX, y, localZ, blockType);
        }
      }
    }
  }

  chunk.generated = true;
  chunk.dirty = true;
}

/**
 * Seeded random for consistent tree placement.
 *
 * @param {number} x
 * @param {number} z
 * @param {number} seed
 *
 * @returns {number} 0-1 random value
 */
function seededRandom(x, z, seed) {
  const n = Math.sin(x * 12.9898 + z * 78.233 + seed * 43758.5453) * 43758.5453;

  return n - Math.floor(n);
}

/**
 * Place a tree at the given position.
 *
 * @param {Chunk} chunk
 * @param {number} localX
 * @param {number} y
 * @param {number} localZ
 * @param {number} woodId
 * @param {number} leavesId
 */
function placeTree(chunk, localX, y, localZ, woodId, leavesId) {
  const height = 4 + Math.floor(seededRandom(localX, localZ, y) * 2);

  // Trunk
  for (let i = 0; i < height; i++) {
    if (y + i < 128) {
      chunk.setBlock(localX, y + i, localZ, woodId);
    }
  }

  // Leaves (simple sphere approximation)
  for (let lx = -2; lx <= 2; lx++) {
    for (let lz = -2; lz <= 2; lz++) {
      for (let ly = height - 2; ly <= height + 1; ly++) {
        const tx = localX + lx;
        const tz = localZ + lz;
        const ty = y + ly;

        // Stay within chunk bounds
        if (tx < 0 || tx >= 16 || tz < 0 || tz >= 16 || ty >= 128) {
          continue;
        }

        // Simple sphere check
        if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly - height) <= 3) {
          if (chunk.getBlock(tx, ty, tz) === 0) {
            chunk.setBlock(tx, ty, tz, leavesId);
          }
        }
      }
    }
  }
}

/**
 * Calculate the surface height at a world position.
 * Useful for spawning the player.
 *
 * @param {number} worldX
 * @param {number} worldZ
 * @param {number} seed
 *
 * @returns {number} Surface Y coordinate
 */
export function getSurfaceHeight(worldX, worldZ, seed) {
  initNoise(seed);
  const n = terrainNoise(worldX, worldZ, seed);
  let surfaceHeight = Math.floor(((n + 1) / 2) * 12 + 2);

  if (Math.abs(worldX) < 3 && Math.abs(worldZ) < 3) {
    surfaceHeight = Math.max(surfaceHeight, SEA_LEVEL + 1);
  }

  return surfaceHeight;
}

/**
 * Reset block ID cache (for testing or config changes).
 */
export function resetBlockIdCache() {
  blockIds = null;
}

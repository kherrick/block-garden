/**
 * Per-chunk procedural terrain generator.
 * Generates terrain for a single chunk based on world seed.
 *
 * Features:
 * - Biome-aware surface blocks (grass, sand, snow, clay)
 * - Depth layers with ore distribution (coal, iron, gold)
 * - Cave generation using 3D noise
 * - Resource block dispersal (crops, flowers)
 * - Trees in forest/swamp biomes
 * - Clouds at high altitude
 */

import {
  noise,
  noise3d,
  terrainNoise,
  caveNoise,
  oreNoise,
  initNoise,
} from "../util/noise.mjs";

import { getBiome } from "../util/getBiome.mjs";
import { blockNames } from "../state/config/blocks.mjs";
import { getBlockIdByName } from "../state/config/getBlockIdByName.mjs";

/**
 * @typedef {import('../util/chunk.mjs').Chunk} Chunk
 */

/**
 * @typedef {import('../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 */

// Block IDs (cached at top level)
const GRASS = getBlockIdByName(blockNames.GRASS);
const DIRT = getBlockIdByName(blockNames.DIRT);
const STONE = getBlockIdByName(blockNames.STONE);
const WATER = getBlockIdByName(blockNames.WATER);
const SAND = getBlockIdByName(blockNames.SAND);
const SNOW = getBlockIdByName(blockNames.SNOW);
const ICE = getBlockIdByName(blockNames.ICE);
const CLAY = getBlockIdByName(blockNames.CLAY);
const BEDROCK = getBlockIdByName(blockNames.BEDROCK);
const LAVA = getBlockIdByName(blockNames.LAVA);
const COAL = getBlockIdByName(blockNames.COAL);
const IRON = getBlockIdByName(blockNames.IRON);
const GOLD = getBlockIdByName(blockNames.GOLD);
const CLOUD = getBlockIdByName(blockNames.CLOUD);
const WOOD = getBlockIdByName(blockNames.WOOD);
const TREE_LEAVES = getBlockIdByName(blockNames.TREE_LEAVES);

/**
 * Terrain generation constants.
 */
export const MIN_Y = 0;
export const MAX_Y = 128;
const SEA_LEVEL = 32;
const CLOUD_HEIGHT_MIN = 100;
const CLOUD_HEIGHT_MAX = 120;

// Depth layer thresholds (relative to surface)
const DIRT_DEPTH = 4; // Dirt layer depth
const COAL_MIN_DEPTH = 10; // Coal starts appearing
const COAL_MAX_DEPTH = 50; // Coal stops appearing
const IRON_MIN_DEPTH = 20; // Iron starts appearing
const IRON_MAX_DEPTH = 60; // Iron stops appearing
const GOLD_MIN_DEPTH = 30; // Gold starts appearing (deep)
const GOLD_MAX_DEPTH = 70; // Gold stops appearing
const LAVA_HEIGHT = 5; // Lava level
const BEDROCK_HEIGHT = 2; // Bedrock at bottom

// Cave generation thresholds
const CAVE_THRESHOLD = 0.55; // Higher = less caves, lower = more caves
const CAVE_MIN_Y = 8; // Don't carve caves below this
const CAVE_MAX_Y_OFFSET = 20; // Don't carve caves closer than this to surface

/**
 * Generate terrain for a single chunk.
 *
 * @param {Chunk} chunk - The chunk to generate
 * @param {number} seed - World seed
 * @param {Object} [settings={}] - Generation settings
 */
export function generateChunk(chunk, seed, settings = {}) {
  const {
    terrainOctaves = 4,
    mountainScale = 50,
    decorationDensity = 100,
    caveThreshold = 55,
    useCaves = true,
    cloudDensity = 100,
  } = settings;

  // Skip if already generated
  if (chunk.generated) {
    return;
  }

  // Ensure noise is initialized
  initNoise(seed);

  // Generate each column in the chunk
  for (let localX = 0; localX < 16; localX++) {
    for (let localZ = 0; localZ < 16; localZ++) {
      const worldX = chunk.worldX + localX;
      const worldZ = chunk.worldZ + localZ;

      // Get biome for this column
      const biome = getBiome(worldX, worldZ, seed);

      // Calculate terrain height using noise
      const n = noise(worldX, worldZ, seed, terrainOctaves, 0.5, 0.01);
      // Base terrain between 30-60
      let surfaceHeight = Math.floor(((n + 1) / 2) * 30 + 30);

      if (mountainScale > 0) {
        // Add mountain peaks with granular amplitude control
        const mountainNoise = terrainNoise(
          worldX * 0.5,
          worldZ * 0.5,
          seed + 100,
          false, // Don't use terrainNoise's internal lowDetail logic anymore
        );
        if (mountainNoise > 0.6) {
          surfaceHeight += Math.floor((mountainNoise - 0.6) * mountainScale);
        }
      }

      // Ensure spawn area has solid ground
      if (Math.abs(worldX) < 3 && Math.abs(worldZ) < 3) {
        surfaceHeight = Math.max(surfaceHeight, SEA_LEVEL + 1);
      }

      // Cap surface height
      surfaceHeight = Math.min(surfaceHeight, MAX_Y - 10);

      // Fill the column
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        let blockType = 0; // Air by default

        if (y <= surfaceHeight) {
          // Underground or at surface
          const depth = surfaceHeight - y;

          if (y < BEDROCK_HEIGHT) {
            // Bedrock at very bottom
            blockType = BEDROCK;
          } else if (y < LAVA_HEIGHT) {
            // Lava layer
            blockType =
              seededRandom(worldX, worldZ, y + seed) < 0.7 ? LAVA : BEDROCK;
          } else if (y === surfaceHeight) {
            // Surface block based on biome
            if (y < SEA_LEVEL + 1) {
              blockType = SAND; // Underwater is always sand
            } else {
              blockType = biome.surfaceBlockId;
            }
          } else if (depth < DIRT_DEPTH) {
            // Sub-surface layer (dirt for most biomes)
            blockType = biome.subBlockId;
          } else {
            // Deep stone layer with ore distribution
            blockType = STONE;

            if (terrainOctaves > 2) {
              // Ore generation based on depth (disabled at very low detail)
              const oreValue = oreNoise(worldX, y, worldZ, seed);

              if (
                depth >= GOLD_MIN_DEPTH &&
                depth <= GOLD_MAX_DEPTH &&
                oreValue > 0.8
              ) {
                blockType = GOLD;
              } else if (
                depth >= IRON_MIN_DEPTH &&
                depth <= IRON_MAX_DEPTH &&
                oreValue > 0.65
              ) {
                blockType = IRON;
              } else if (
                depth >= COAL_MIN_DEPTH &&
                depth <= COAL_MAX_DEPTH &&
                oreValue > 0.55
              ) {
                blockType = COAL;
              }
            }
          }

          // Cave carving (don't carve near surface or in lava/bedrock)
          if (
            useCaves &&
            y > CAVE_MIN_Y &&
            y < surfaceHeight - CAVE_MAX_Y_OFFSET &&
            blockType !== BEDROCK &&
            blockType !== LAVA
          ) {
            const caveValue = caveNoise(worldX, y, worldZ, seed);
            if (caveValue > caveThreshold / 100) {
              blockType = 0; // Air (cave)
            }
          }
        } else {
          // Above surface
          if (y <= SEA_LEVEL) {
            // Water level
            blockType = WATER;
          } else if (
            (Math.abs(worldX) > 6 || Math.abs(worldZ) > 6) &&
            y >= CLOUD_HEIGHT_MIN &&
            y <= CLOUD_HEIGHT_MAX
          ) {
            // Cloud generation
            const cloudOctaves = cloudDensity > 50 ? 2 : 1;
            const cn = noise3d(
              worldX,
              y,
              worldZ,
              seed,
              cloudOctaves,
              0.5,
              0.05,
            );
            if (cn > 1.0 - cloudDensity / 200 - 0.05) {
              // Heuristic for cloud density
              blockType = CLOUD;
            }
          }
        }

        if (blockType !== 0) {
          chunk.setBlock(localX, y, localZ, blockType);
        }
      }

      // Surface decorations (only if surface is above water)
      if (surfaceHeight > SEA_LEVEL) {
        // Tree generation in biomes with trees
        if (
          biome.trees &&
          (Math.abs(worldX) > 4 || Math.abs(worldZ) > 4) &&
          seededRandom(worldX, worldZ, seed) <
            0.02 * (decorationDensity / 100) &&
          worldX % 3 !== 0 &&
          worldZ % 3 !== 0
        ) {
          placeTree(
            chunk,
            localX,
            surfaceHeight + 1,
            localZ,
            WOOD,
            TREE_LEAVES,
          );
        }

        // Crop/resource dispersal - drastically reduced density
        if (
          biome.cropBlockIds.length > 0 &&
          seededRandom(worldX, worldZ, seed + 500) <
            0.002 * (decorationDensity / 100) &&
          !biome.trees
        ) {
          placeResource(
            chunk,
            localX,
            surfaceHeight + 1,
            localZ,
            biome,
            seed,
            worldX,
            worldZ,
          );
        } else if (
          biome.cropBlockIds.length > 0 &&
          seededRandom(worldX, worldZ, seed + 1000) <
            0.0005 * (decorationDensity / 100)
        ) {
          placeResource(
            chunk,
            localX,
            surfaceHeight + 1,
            localZ,
            biome,
            seed,
            worldX,
            worldZ,
          );
        }
      }
    }
  }

  chunk.generated = true;
  chunk.dirty = true;
}

/**
 * Place a resource/crop block on the surface.
 *
 * @param {Chunk} chunk
 * @param {number} localX
 * @param {number} y
 * @param {number} localZ
 * @param {import('../state/config/biomes.mjs').Biome} biome
 * @param {number} seed
 * @param {number} worldX
 * @param {number} worldZ
 */
function placeResource(chunk, localX, y, localZ, biome, seed, worldX, worldZ) {
  if (y >= MAX_Y || biome.cropBlockIds.length === 0) return;

  // Select a random crop from the biome's available crops
  const cropIndex = Math.floor(
    seededRandom(worldX + 100, worldZ + 100, seed) * biome.cropBlockIds.length,
  );
  const cropBlockId = biome.cropBlockIds[cropIndex];

  if (cropBlockId > 0 && chunk.getBlock(localX, y, localZ) === 0) {
    chunk.setBlock(localX, y, localZ, cropBlockId);
  }
}

/**
 * Seeded random for consistent placement.
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
    if (y + i < MAX_Y) {
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
        if (tx < 0 || tx >= 16 || tz < 0 || tz >= 16 || ty >= MAX_Y) {
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
export function getSurfaceHeight(worldX, worldZ, seed, settings = {}) {
  const { terrainOctaves = 4, mountainScale = 50 } = settings;
  initNoise(seed);
  const n = noise(worldX, worldZ, seed, terrainOctaves, 0.5, 0.01);
  let surfaceHeight = Math.floor(((n + 1) / 2) * 30 + 30);

  if (mountainScale > 0) {
    // Add mountain peaks
    const mountainNoise = terrainNoise(worldX * 0.5, worldZ * 0.5, seed + 100);
    if (mountainNoise > 0.6) {
      surfaceHeight += Math.floor((mountainNoise - 0.6) * mountainScale);
    }
  }

  if (Math.abs(worldX) < 3 && Math.abs(worldZ) < 3) {
    surfaceHeight = Math.max(surfaceHeight, SEA_LEVEL + 1);
  }

  return Math.min(surfaceHeight, MAX_Y - 10);
}

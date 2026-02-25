/**
 * Per-chunk procedural terrain generator.
 * Generates terrain for a single chunk based on world seed.
 *
 * Features:
 * - Smooth rolling terrain with natural mountain slopes
 * - Properly layered soil: grass/dirt surface → stone below
 * - Natural cave systems with surface entrances
 * - Trees and decorations on all suitable terrain
 * - Biome-aware surface blocks (grass, sand, snow, clay)
 * - Depth layers with ore distribution (coal, iron, gold)
 * - Multiple noise-based cave types (tunnels and caverns)
 */

import {
  noise,
  noise3d,
  terrainNoise,
  caveNoise,
  oreNoise,
  initNoise,
} from "../../../utils/noise.mjs";

import { getBiome } from "../../../utils/getBiome.mjs";
import { blockNames, getBlockIdByName } from "../config/blocks.mjs";
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from "../meshing/chunk.mjs";

/**
 * @typedef {import('../meshing/chunk.mjs').Chunk} Chunk
 */

/**
 * @typedef {import('../config/biomes.mjs').Biome} Biome
 */

/**
 * @typedef {import('../config/blocks.mjs').BlockDefinition} BlockDefinition
 */

/**
 * @typedef {Object} TerrainGenerationSettings
 * @property {number} [terrainOctaves=6] - Terrain noise octaves (increased for detail)
 * @property {number} [mountainScale=120] - Mountain height scale (increased)
 * @property {number} [decorationDensity=100] - Decoration density
 * @property {number} [caveThreshold=55] - Cave generation threshold
 * @property {boolean} [useCaves=true] - Whether to generate caves
 * @property {number} [cloudDensity=100] - Cloud density
 */

// Block IDs (cached at top level)
const GRASS = getBlockIdByName(blockNames.GRASS);
const DIRT = getBlockIdByName(blockNames.DIRT);
const STONE = getBlockIdByName(blockNames.STONE);
const WATER = getBlockIdByName(blockNames.WATER);
const SAND = getBlockIdByName(blockNames.SAND);
const SNOW = getBlockIdByName(blockNames.SNOW);

const CLAY = getBlockIdByName(blockNames.CLAY);
const BEDROCK = getBlockIdByName(blockNames.BEDROCK);
const LAVA = getBlockIdByName(blockNames.LAVA);
const COAL = getBlockIdByName(blockNames.COAL);
const IRON = getBlockIdByName(blockNames.IRON);
const GOLD = getBlockIdByName(blockNames.GOLD);
const CLOUD = getBlockIdByName(blockNames.CLOUD);
const TREE_TRUNK = getBlockIdByName(blockNames.TREE_TRUNK);
const TREE_LEAVES = getBlockIdByName(blockNames.TREE_LEAVES);
const COPPER = getBlockIdByName(blockNames.COPPER);
const SILVER = getBlockIdByName(blockNames.SILVER);
const DIAMOND = getBlockIdByName(blockNames.DIAMOND);

/**
 * Terrain generation constants.
 */
export const MIN_Y = 0;
export const MAX_Y = 128;
export const SEA_LEVEL = 32;
export const CLOUD_HEIGHT_MIN = 100;
export const CLOUD_HEIGHT_MAX = 120;

// Depth layer thresholds (depth below surface for soil layers)
const DIRT_DEPTH = 4;

// Ore Y-level ranges (absolute Y positions — lower Y = deeper = rarer ores)
const COAL_MIN_Y = 5;
const COAL_MAX_Y = 80;

const COPPER_MIN_Y = 5;
const COPPER_MAX_Y = 60;

const IRON_MIN_Y = 5;
const IRON_MAX_Y = 50;

const GOLD_MIN_Y = 5;
const GOLD_MAX_Y = 40;

const SILVER_MIN_Y = 5;
const SILVER_MAX_Y = 35;

const DIAMOND_MIN_Y = 5;
const DIAMOND_MAX_Y = 25;

const LAVA_HEIGHT = 3; // Very deep lava layer
const BEDROCK_HEIGHT = 2;
const LAVA_PROTECTION_ZONE = 12; // Caves cannot exist within this distance from lava

// Cave generation thresholds
const CAVE_MIN_Y = LAVA_PROTECTION_ZONE;

// Terrain Shape Constants
const SNOW_LINE = 90;

/**
 * Generate terrain for a single chunk.
 *
 * @param {Chunk} chunk - The chunk to generate
 * @param {number} seed - World seed
 * @param {TerrainGenerationSettings} [settings={}] - Generation settings
 */
export function generateChunk(chunk, seed, settings = {}) {
  const {
    terrainOctaves = 6,
    mountainScale = 120,
    decorationDensity = 100,
    caveThreshold = 45,
    useCaves = true,
    cloudDensity = 100,
  } = settings;

  // Skip if already generated
  if (chunk.generated) {
    return;
  }

  initNoise(seed);

  const mountainScaleBlocks = normalizeScale(mountainScale);
  const mount_zero_level = SEA_LEVEL + 10;

  // Cache for neighbor height differences per column to avoid redundant noise sampling
  const neighborDiffCache = new Map();

  /**
   * Helper to predict if a tree, resource, or ore should spawn at a world position.
   *
   * @param {number} worldX
   * @param {number} worldZ
   * @param {number} [yCheck] - Optional Y to check for ores
   */
  const predictDecoration = (worldX, worldZ, yCheck = -1, skipOres = false) => {
    const biome = getBiome(worldX, worldZ, seed);
    const surfaceHeight = getSurfaceHeight(worldX, worldZ, seed, settings);

    // Check for Ores (Important items)
    // Skip ore checks when called from cave protection to avoid false-positive protection
    if (!skipOres && terrainOctaves >= 2) {
      const checkY = yCheck !== -1 ? [yCheck] : [20, 40, 60, 80]; // Sample common ore depths
      for (const y of checkY) {
        if (y > surfaceHeight) {
          continue;
        }

        const oreValue = oreNoise(worldX, y, worldZ, seed);
        // If any significant ore density is found, we treat the column as protected
        if (oreValue > 0.55 || oreValue < -0.6) {
          return { type: "ore", y };
        }
      }
    }

    // Check for Trees/Resources
    const nh1 = getSurfaceHeight(worldX + 1, worldZ, seed, settings);
    const nh2 = getSurfaceHeight(worldX - 1, worldZ, seed, settings);
    const nh3 = getSurfaceHeight(worldX, worldZ + 1, seed, settings);
    const nh4 = getSurfaceHeight(worldX, worldZ - 1, seed, settings);
    const maxNeighborDiff = Math.max(
      Math.abs(surfaceHeight - nh1),
      Math.abs(surfaceHeight - nh2),
      Math.abs(surfaceHeight - nh3),
      Math.abs(surfaceHeight - nh4),
    );

    const isTooSteepOrTooHigh =
      maxNeighborDiff >= 4 || surfaceHeight > SNOW_LINE;

    if (surfaceHeight <= SEA_LEVEL) return null;

    // Tree check
    if (
      biome.trees &&
      !isTooSteepOrTooHigh &&
      (Math.abs(worldX) > 4 || Math.abs(worldZ) > 4) &&
      seededRandom(worldX, worldZ, seed) < 0.015 * (decorationDensity / 100) &&
      worldX % 3 !== 0 &&
      worldZ % 3 !== 0
    ) {
      return { type: "tree", y: surfaceHeight };
    }

    // Resource check
    if (
      biome.cropBlockIds.length > 0 &&
      seededRandom(worldX, worldZ, seed + 500) <
        0.002 * (decorationDensity / 100) &&
      !biome.trees
    ) {
      return { type: "resource", y: surfaceHeight };
    }

    return null;
  };

  // --- PASS: TERRAIN, CAVES & STABILITY ---
  for (let localX = 0; localX < CHUNK_SIZE_X; localX++) {
    for (let localZ = 0; localZ < CHUNK_SIZE_Z; localZ++) {
      const worldX = chunk.chunkX * CHUNK_SIZE_X + localX;
      const worldZ = chunk.chunkZ * CHUNK_SIZE_Z + localZ;
      const biome = getBiome(worldX, worldZ, seed);
      const surfaceHeight = getSurfaceHeight(worldX, worldZ, seed, settings);

      // Check protection (Cave Plug) for Trees, Seeds, and Ores
      let isProtected = false;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (predictDecoration(worldX + dx, worldZ + dz, -1, true)) {
            isProtected = true;

            break;
          }
        }

        if (isProtected) {
          break;
        }
      }

      // Initial column filling
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        let blockType = 0; // Air

        if (y <= surfaceHeight) {
          const depth = surfaceHeight - y;

          if (y < BEDROCK_HEIGHT) {
            blockType = BEDROCK;
          } else if (y < LAVA_HEIGHT) {
            blockType =
              seededRandom(worldX, worldZ, y + seed) < 0.7 ? LAVA : BEDROCK;
          } else if (y === surfaceHeight) {
            if (y < SEA_LEVEL) {
              blockType = y < SEA_LEVEL - 5 ? CLAY : SAND;
            } else if (y > SNOW_LINE) {
              blockType = SNOW;
            } else {
              // Note: Slope-based stone is handled here too
              // Cache neighbor heights to avoid redundant noise sampling
              const neighborKey = `${worldX},${worldZ}`;
              let maxNeighborDiff;
              if (!neighborDiffCache.has(neighborKey)) {
                const nh1 = getSurfaceHeight(
                  worldX + 1,
                  worldZ,
                  seed,
                  settings,
                );
                const nh2 = getSurfaceHeight(
                  worldX - 1,
                  worldZ,
                  seed,
                  settings,
                );
                const nh3 = getSurfaceHeight(
                  worldX,
                  worldZ + 1,
                  seed,
                  settings,
                );
                const nh4 = getSurfaceHeight(
                  worldX,
                  worldZ - 1,
                  seed,
                  settings,
                );
                maxNeighborDiff = Math.max(
                  Math.abs(surfaceHeight - nh1),
                  Math.abs(surfaceHeight - nh2),
                  Math.abs(surfaceHeight - nh3),
                  Math.abs(surfaceHeight - nh4),
                );
                neighborDiffCache.set(neighborKey, maxNeighborDiff);
              } else {
                maxNeighborDiff = neighborDiffCache.get(neighborKey);
              }

              blockType = maxNeighborDiff >= 4 ? STONE : biome.surfaceBlockId;
            }
          } else if (depth <= DIRT_DEPTH) {
            blockType = y > SNOW_LINE - 3 ? SNOW : biome.subBlockId;
          } else {
            blockType = STONE;
          }

          // Cave Carving
          if (
            useCaves &&
            y > CAVE_MIN_Y &&
            blockType !== BEDROCK &&
            blockType !== LAVA
          ) {
            const depthBelowSurface = surfaceHeight - y;
            // "Cave Plug": Suppress carving near decorations/ores
            if (isProtected && depthBelowSurface < 8) {
              // Skip carving
            } else {
              const caveThresholdNorm = Math.max(
                0,
                Math.min(1, caveThreshold / 100),
              );

              const protectedFromLava = y > LAVA_HEIGHT + LAVA_PROTECTION_ZONE;

              if (protectedFromLava) {
                const caveVal1 = caveNoise(worldX, y, worldZ, seed);
                const caveProb1 = (caveVal1 + 1) / 2;
                const caveVal2 = noise3d(
                  worldX * 0.08,
                  y * 0.08,
                  worldZ * 0.08,
                  seed + 1500,
                  2,
                  0.5,
                  0.04,
                );

                const caveProb2 = (caveVal2 + 1) / 2;

                const tunnelProd = caveProb1 * caveProb2;
                const tunnelThresh = 0.6 + caveThresholdNorm * 0.2;
                const tunnelCarve = tunnelProd > tunnelThresh * tunnelThresh;

                const cavernLimit = mount_zero_level + 30;
                const cavernTaper = 50;
                const cavernAmp = Math.min(
                  (cavernLimit - y) / cavernTaper,
                  1.0,
                );

                const cavernThreshold = 0.85 - caveThresholdNorm * 0.15;
                const cavernCarve =
                  Math.abs(caveVal1) * cavernAmp > cavernThreshold;

                const inMountainRange = surfaceHeight > SEA_LEVEL + 15;
                const mountainShapeForCarving = noise3d(
                  worldX * 0.06,
                  y * 0.1,
                  worldZ * 0.06,
                  seed + 5500,
                  3,
                  0.6,
                  0.008,
                );

                const mountainCaveEntrance =
                  inMountainRange &&
                  depthBelowSurface <= 8 &&
                  tunnelProd > 0.75 &&
                  mountainShapeForCarving > 0.3 &&
                  caveThresholdNorm > 0.4;

                const shoreCaveEntrance =
                  y <= SEA_LEVEL + 3 &&
                  y >= SEA_LEVEL - 3 &&
                  tunnelProd > 0.85 &&
                  caveThresholdNorm > 0.5;

                if (
                  tunnelCarve ||
                  cavernCarve ||
                  mountainCaveEntrance ||
                  shoreCaveEntrance
                ) {
                  blockType = 0; // Air
                }
              }
            }
          }

          // Ore placement (only in STONE)
          // Priority: rarest ores first so they aren't overridden by common ones
          // Uses absolute Y position — lower Y = deeper = rarer ores
          if (blockType === STONE && terrainOctaves >= 2) {
            const oreValue = oreNoise(worldX, y, worldZ, seed);
            if (y >= DIAMOND_MIN_Y && y <= DIAMOND_MAX_Y && oreValue > 0.85) {
              blockType = DIAMOND;
            } else if (
              y >= SILVER_MIN_Y &&
              y <= SILVER_MAX_Y &&
              oreValue < -0.7
            ) {
              blockType = SILVER;
            } else if (y >= GOLD_MIN_Y && y <= GOLD_MAX_Y && oreValue > 0.75) {
              blockType = GOLD;
            } else if (
              y >= COPPER_MIN_Y &&
              y <= COPPER_MAX_Y &&
              oreValue < -0.6
            ) {
              blockType = COPPER;
            } else if (y >= IRON_MIN_Y && y <= IRON_MAX_Y && oreValue > 0.65) {
              blockType = IRON;
            } else if (y >= COAL_MIN_Y && y <= COAL_MAX_Y && oreValue > 0.55) {
              blockType = COAL;
            }
          }
        } else if (y <= SEA_LEVEL) {
          blockType = WATER;
        } else if (
          (Math.abs(worldX) > 6 || Math.abs(worldZ) > 6) &&
          y >= CLOUD_HEIGHT_MIN &&
          y <= CLOUD_HEIGHT_MAX
        ) {
          const cloudOctaves = cloudDensity > 50 ? 2 : 1;
          const cn = noise3d(worldX, y, worldZ, seed, cloudOctaves, 0.5, 0.05);
          if (cn > 1.0 - cloudDensity / 200 - 0.05) {
            blockType = CLOUD;
          }
        }

        if (blockType !== 0) {
          chunk.setBlock(localX, y, localZ, blockType);
        }
      }

      // --- STABILITY CHECK & NATURAL PILLARS ---
      // Eliminate floating clods or support protected items
      for (let y = MAX_Y; y >= MIN_Y; y--) {
        const block = chunk.getBlock(localX, y, localZ);
        if (block !== 0 && block !== WATER && block !== CLOUD) {
          // Found a solid block. Check if it's floating.
          if (
            y > BEDROCK_HEIGHT + 2 &&
            chunk.getBlock(localX, y - 1, localZ) === 0
          ) {
            // Floating!
            if (isProtected) {
              // NATURAL PILLAR: Support the protected item down to the next solid block
              for (let sy = y - 1; sy >= Math.max(MIN_Y + 2, y - 16); sy--) {
                if (chunk.getBlock(localX, sy, localZ) === 0) {
                  // Mix stone and dirt for natural look
                  const supportBlock =
                    sy < SEA_LEVEL - 5 ||
                    seededRandom(worldX, sy, worldZ + seed) > 0.6
                      ? STONE
                      : DIRT;
                  chunk.setBlock(localX, sy, localZ, supportBlock);
                } else {
                  break; // Hit ground
                }
              }
            } else if (y >= surfaceHeight - 5) {
              // FLOATING CLOD: Remove to keep world clean
              // Only remove close to surface to avoid deleting legitimate cave formations deep down
              for (let ry = y; ry >= Math.max(MIN_Y, y - 8); ry--) {
                if (chunk.getBlock(localX, ry, localZ) !== 0) {
                  chunk.setBlock(localX, ry, localZ, 0);
                } else {
                  break;
                }
              }
            }
          }

          // After handling the top floating section, we usually don't need to check deeper
          // in the same column for stability, as caves handles the rest.
          break;
        }
      }

      // Lake Bed Correction (standard water logic)
      if (surfaceHeight < SEA_LEVEL) {
        for (let y = SEA_LEVEL; y > surfaceHeight; y--) {
          if (chunk.getBlock(localX, y, localZ) === 0) {
            chunk.setBlock(localX, y, localZ, WATER);
          }
        }
        // Ensure lake bed is solid
        for (
          let y = surfaceHeight;
          y >= Math.max(MIN_Y + 2, surfaceHeight - 8);
          y--
        ) {
          if (chunk.getBlock(localX, y, localZ) === 0) {
            chunk.setBlock(localX, y, localZ, y < SEA_LEVEL - 3 ? STONE : DIRT);
          } else {
            break;
          }
        }
      }
    }
  }

  // --- PASS: DECORATIONS ---
  // Check every column in the chunk AND a 3-block radius around it
  for (let localX = -3; localX < CHUNK_SIZE_X + 3; localX++) {
    for (let localZ = -3; localZ < CHUNK_SIZE_Z + 3; localZ++) {
      const worldX = chunk.chunkX * CHUNK_SIZE_X + localX;
      const worldZ = chunk.chunkZ * CHUNK_SIZE_Z + localZ;

      const decoration = predictDecoration(worldX, worldZ);
      if (decoration) {
        if (decoration.type === "tree") {
          placeTree(
            chunk,
            localX,
            decoration.y + 1,
            localZ,
            TREE_TRUNK,
            TREE_LEAVES,
            worldX,
            worldZ,
            seed,
          );
        } else if (
          decoration.type === "resource" &&
          localX >= 0 &&
          localX < CHUNK_SIZE_X &&
          localZ >= 0 &&
          localZ < CHUNK_SIZE_Z
        ) {
          // Resources only place in their own chunk (no overlap)
          const biome = getBiome(worldX, worldZ, seed);
          placeResource(
            chunk,
            localX,
            decoration.y + 1,
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
 * @param {Chunk} chunk - The chunk to modify.
 * @param {number} localX - Local X coordinate in the chunk.
 * @param {number} y - Y coordinate.
 * @param {number} localZ - Local Z coordinate in the chunk.
 * @param {Biome} biome - Biome data for the location.
 * @param {number} seed - World seed.
 * @param {number} worldX - World X coordinate.
 * @param {number} worldZ - World Z coordinate.
 */
function placeResource(chunk, localX, y, localZ, biome, seed, worldX, worldZ) {
  if (y >= MAX_Y || biome.cropBlockIds.length === 0) {
    return;
  }

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
 * @param {number} x - X coordinate.
 * @param {number} z - Z coordinate.
 * @param {number} seed - World seed.
 *
 * @returns {number} Random value between 0 and 1.
 */
function seededRandom(x, z, seed) {
  const n = Math.sin(x * 12.9898 + z * 78.233 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Place a tree at the given position.
 *
 * @param {Chunk} chunk - The chunk to modify.
 * @param {number} localX - Local X coordinate in the chunk.
 * @param {number} y - Y coordinate.
 * @param {number} localZ - Local Z coordinate in the chunk.
 * @param {number} woodId - Block ID for the tree trunk.
 * @param {number} leavesId - Block ID for the tree leaves.
 * @param {number} worldX - World X coordinate (for reproducible tree shape).
 * @param {number} worldZ - World Z coordinate (for reproducible tree shape).
 * @param {number} seed - World seed.
 */
function placeTree(
  chunk,
  localX,
  y,
  localZ,
  woodId,
  leavesId,
  worldX,
  worldZ,
  seed,
) {
  // Determine if the trunk is inside this chunk
  const trunkInChunk =
    localX >= 0 &&
    localX < CHUNK_SIZE_X &&
    localZ >= 0 &&
    localZ < CHUNK_SIZE_Z;

  // Use world coordinates and world seed for reproducible tree shapes
  const height = 4 + Math.floor(seededRandom(worldX, worldZ, seed + 12345) * 2);

  // Place trunk only if it's inside the chunk
  if (trunkInChunk) {
    for (let i = 0; i < height; i++) {
      const ty = y + i;
      if (ty < MAX_Y && chunk.getBlock(localX, ty, localZ) === 0) {
        chunk.setBlock(localX, ty, localZ, woodId);
      }
    }
  }
  for (let lx = -2; lx <= 2; lx++) {
    for (let lz = -2; lz <= 2; lz++) {
      for (let ly = height - 2; ly <= height + 1; ly++) {
        const tx = localX + lx;
        const tz = localZ + lz;
        const ty = y + ly;

        if (
          tx < 0 ||
          tx >= CHUNK_SIZE_X ||
          tz < 0 ||
          tz >= CHUNK_SIZE_Z ||
          ty >= MAX_Y
        ) {
          continue;
        }

        if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly - height) <= 3) {
          if (chunk.getBlock(tx, ty, tz) === 0)
            chunk.setBlock(tx, ty, tz, leavesId);
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
 * @param {TerrainGenerationSettings} [settings={}]
 *
 * @returns {number} Surface Y coordinate
 */
export function getSurfaceHeight(worldX, worldZ, seed, settings = {}) {
  const { mountainScale = 120 } = settings;

  const mountainScaleBlocks = normalizeScale(mountainScale);

  // Use the same algorithm as generateChunk for consistency
  // Base terrain height
  const terrainBase = noise(worldX, worldZ, seed + 1000, 4, 0.5, 0.004);
  const terrainAlt = noise(worldX, worldZ, seed + 2000, 4, 0.5, 0.004);
  const heightSelect = noise(worldX, worldZ, seed + 3000, 2, 0.5, 0.003);

  let baseHeight =
    SEA_LEVEL +
    4 +
    (terrainBase * heightSelect + terrainAlt * (1 - heightSelect)) * 16;

  const mountainShape3d = noise3d(
    worldX * 0.06,
    SEA_LEVEL * 0.08,
    worldZ * 0.06,
    seed + 5500,
    4,
    0.5,
    0.008,
  );

  const mountainNoise = mountainShape3d; // Main mountain shape

  if (mountainNoise > -0.15) {
    const mountainIntensity = Math.max(
      0,
      Math.min(1, (mountainNoise + 0.15) / 1.15),
    );

    const logScale = Math.pow(mountainScaleBlocks / 100, 0.7) * 100;
    baseHeight += mountainIntensity * logScale * 0.7;
  }

  // Hilliness
  const hilliness = noise(
    worldX * 0.12,
    worldZ * 0.12,
    seed + 6000,
    2,
    0.5,
    0.01,
  );

  baseHeight += hilliness * 8;

  // Lake depressions
  const lakeNoise = noise(
    worldX * 0.02,
    worldZ * 0.02,
    seed + 7000,
    2,
    0.5,
    0.005,
  );

  const lakeThreshold = 0.2;
  const lakeSteepness = 0.8;

  if (lakeNoise < lakeThreshold) {
    const depress = (lakeThreshold - lakeNoise) * lakeSteepness * 20;
    baseHeight = Math.max(SEA_LEVEL - 10, baseHeight - depress);
  }

  // Spawn protection
  let surfaceHeight = Math.floor(baseHeight);
  if (Math.abs(worldX) < 3 && Math.abs(worldZ) < 3) {
    surfaceHeight = Math.max(surfaceHeight, SEA_LEVEL + 1);
  }

  return Math.min(surfaceHeight, MAX_Y - 5);
}

/**
 * Normalize scale value.
 *
 * @param {number} s - Scale value to normalize.
 *
 * @returns {number} Normalized scale value.
 */
function normalizeScale(s) {
  if (s <= 1) {
    // fraction -> up to 200 blocks
    return s * 200;
  }

  if (s <= 100) {
    // percent or blocks
    return s;
  }

  // already absolute
  return s;
}

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
const ICE = getBlockIdByName(blockNames.ICE);
const CLAY = getBlockIdByName(blockNames.CLAY);
const BEDROCK = getBlockIdByName(blockNames.BEDROCK);
const LAVA = getBlockIdByName(blockNames.LAVA);
const COAL = getBlockIdByName(blockNames.COAL);
const IRON = getBlockIdByName(blockNames.IRON);
const GOLD = getBlockIdByName(blockNames.GOLD);
const CLOUD = getBlockIdByName(blockNames.CLOUD);
const TREE_TRUNK = getBlockIdByName(blockNames.TREE_TRUNK);
const TREE_LEAVES = getBlockIdByName(blockNames.TREE_LEAVES);

/**
 * Terrain generation constants.
 */
export const MIN_Y = 0;
export const MAX_Y = 128;
export const SEA_LEVEL = 32;
export const CLOUD_HEIGHT_MIN = 100;
export const CLOUD_HEIGHT_MAX = 120;

// Depth layer thresholds
const DIRT_DEPTH = 4;
const COAL_MIN_DEPTH = 10;
const COAL_MAX_DEPTH = 50;
const IRON_MIN_DEPTH = 20;
const IRON_MAX_DEPTH = 60;
const GOLD_MIN_DEPTH = 30;
const GOLD_MAX_DEPTH = 70;
const LAVA_HEIGHT = 3; // Very deep lava layer
const BEDROCK_HEIGHT = 2;
const LAVA_PROTECTION_ZONE = 12; // Caves cannot exist within this distance from lava

// Cave generation thresholds
const CAVE_MIN_Y = LAVA_PROTECTION_ZONE;
const CAVE_MAX_Y_OFFSET = 20; // allow caves closer to surface so entrances form

// Terrain Shape Constants
// SNOW_LINE: Raised to 90 so mountains have soil/trees below snow peaks
const SNOW_LINE = 90;
const MOUNTAIN_THRESHOLD = 0.4; // Lowered threshold for more frequent mountains
const VALLEY_THRESHOLD = -0.3; // Adjusted for deeper valleys
const LAKE_SEED_OFFSET = 400;

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
    mountainScale = 120, // Increased scale for taller mountains (can be percent or blocks)
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

  // Generate terrain for each column in the chunk
  for (let localX = 0; localX < CHUNK_SIZE_X; localX++) {
    for (let localZ = 0; localZ < CHUNK_SIZE_Z; localZ++) {
      const worldX = chunk.chunkX * CHUNK_SIZE_X + localX;
      const worldZ = chunk.chunkZ * CHUNK_SIZE_Z + localZ;

      const biome = getBiome(worldX, worldZ, seed);

      // --- TERRAIN GENERATION ---

      // Base terrain height on plains (used as foundation)
      const terrainBase = noise(worldX, worldZ, seed + 1000, 4, 0.5, 0.004);
      const terrainAlt = noise(worldX, worldZ, seed + 2000, 4, 0.5, 0.004);
      const heightSelect = noise(worldX, worldZ, seed + 3000, 2, 0.5, 0.003);

      let baseHeight =
        SEA_LEVEL +
        4 +
        (terrainBase * heightSelect + terrainAlt * (1 - heightSelect)) * 16;

      // Mountain generation using density gradient approach
      // This creates natural slopes instead of pillars
      const mountainHeightNoise = noise(
        worldX,
        worldZ,
        seed + 4000,
        3,
        0.6,
        0.005,
      );

      const mnt_h_n = Math.max(1.0, 40 + mountainHeightNoise * 20); // Mountain height scale

      // 3D mountain shape noise for actual mountain structure
      const mountainShape3d = noise3d(
        worldX * 0.06,
        SEA_LEVEL * 0.08,
        worldZ * 0.06,
        seed + 5500,
        4,
        0.5,
        0.008,
      );

      // Density gradient: decreases with altitude
      // This creates smooth slopes - mountains get narrower as you go up
      // density_gradient = -((y - mount_zero_level) / mnt_h_n)
      // We apply this at surface level to get the mountain intensity
      const mount_zero_level = SEA_LEVEL + 10;
      const densityGradient = 1.0; // At surface, gradient contributes linearly

      // Mountains exist where mountainShape + densityGradient >= threshold
      // Lower threshold = more mountains
      const mountainNoise = mountainShape3d; // Main mountain shape

      // Apply mountain intensity with proper scaling
      if (mountainNoise > -0.15) {
        // Mountain terrain: use the density effect for slope
        const mountainIntensity = Math.max(
          0,
          Math.min(1, (mountainNoise + 0.15) / 1.15),
        );
        const logScale = Math.pow(mountainScaleBlocks / 100, 0.7) * 100;
        baseHeight += mountainIntensity * logScale * 0.7;
      }

      // Add small-scale rolling hills for natural variation
      const hilliness = noise(
        worldX * 0.12,
        worldZ * 0.12,
        seed + 6000,
        2,
        0.5,
        0.01,
      );
      baseHeight += hilliness * 8;

      // Valley/lake depressions
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

      // Finalize and clamp surface height
      let surfaceHeight = Math.floor(baseHeight);
      surfaceHeight = Math.max(MIN_Y + 1, Math.min(surfaceHeight, MAX_Y - 5));

      // Compute neighbor surface heights for slope-based material selection
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

      // Spawn protection
      if (Math.abs(worldX) < 3 && Math.abs(worldZ) < 3) {
        surfaceHeight = Math.max(surfaceHeight, SEA_LEVEL + 1);
      }

      // --- COLUMN FILLING ---
      // Track water positions to fill lake beds
      let hasWaterColumn = false;
      let waterY = -1;

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
            // Surface block selection - proper soil layers
            if (y < SEA_LEVEL) {
              // Underwater surfaces - sand below, clay deeper
              blockType = y < SEA_LEVEL - 5 ? CLAY : SAND;
            } else if (y > SNOW_LINE) {
              // Snow capped peaks
              blockType = SNOW;
            } else {
              // Above water - use biome's surface material (grass/dirt)
              // Only use stone for very steep slopes
              if (maxNeighborDiff >= 4) {
                blockType = STONE;
              } else {
                blockType = biome.surfaceBlockId;
              }
            }
          } else if (depth <= DIRT_DEPTH) {
            // Dirt layer below surface (top soil)
            // Always use dirt/sub-surface blocks here for all biomes
            if (y > SNOW_LINE - 3) {
              blockType = SNOW; // Snow extends down a bit
            } else {
              blockType = biome.subBlockId; // Dirt or sand
            }
          } else {
            // Deep stone with ores
            blockType = STONE;
            if (terrainOctaves > 2) {
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

          // Cave Generation: with three types
          // Tunnels, then caverns, then random-walk caves
          if (
            useCaves &&
            y > CAVE_MIN_Y &&
            blockType !== BEDROCK &&
            blockType !== LAVA
          ) {
            const caveThresholdNorm = Math.max(
              0,
              Math.min(1, caveThreshold / 100),
            );

            // CRITICAL: Protect lava zone - no caves whatsoever
            const protectedFromLava = y > LAVA_HEIGHT + LAVA_PROTECTION_ZONE;

            if (protectedFromLava) {
              // Tunnel caves: noise intersection
              // Two noise fields that carve where both are "active"
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

              // Tunnel carving: very conservative - tunnels are rare unless density is high
              // At 50% threshold: only deep caves form, surface entrances are rare
              // Product threshold is very high to avoid excessive tunnelation
              const tunnelProd = caveProb1 * caveProb2;
              const tunnelThresh = 0.6 + caveThresholdNorm * 0.2; // 0.6-0.8 range
              const tunnelCarve = tunnelProd > tunnelThresh * tunnelThresh;

              // Cavern generation: single noise with amplitude tapering by depth
              // cavern_amp = min((cavern_limit - y) / cavern_taper, 1.0)
              // This makes caverns deeper and smaller as you go up
              const cavernLimit = mount_zero_level + 30;
              const cavernTaper = 50;
              const cavernAmp = Math.min((cavernLimit - y) / cavernTaper, 1.0);
              const cavernThreshold = 0.85 - caveThresholdNorm * 0.15; // 0.7-0.85 range, lower = more caverns
              const cavernCarve =
                Math.abs(caveVal1) * cavernAmp > cavernThreshold;

              // Natural cave entrances in mountains and near surface
              // Caves connect to surface naturally in mountain areas
              const depthBelowSurface = surfaceHeight - y;
              const inMountainRange = surfaceHeight > SEA_LEVEL + 15; // Mountains are high

              // Mountain cave entrances: in steep mountain areas, allow some surface piercing
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

              // Shore cave entrances: caves at water level edge
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
                blockType = 0; // Air (carve cave)
              }
            }
          }
        } else {
          // Above Surface
          if (y <= SEA_LEVEL) {
            blockType = WATER;
            if (!hasWaterColumn) {
              hasWaterColumn = true;
              waterY = y;
            }
          } else if (
            (Math.abs(worldX) > 6 || Math.abs(worldZ) > 6) &&
            y >= CLOUD_HEIGHT_MIN &&
            y <= CLOUD_HEIGHT_MAX
          ) {
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
              blockType = CLOUD;
            }
          }
        }

        if (blockType !== 0) {
          chunk.setBlock(localX, y, localZ, blockType);
        }
      }

      // --- LAKE BED GENERATION ---
      // Ensure water lakes have solid ground below them (no floating water)
      if (hasWaterColumn && waterY > 0) {
        for (let y = waterY - 1; y >= Math.max(MIN_Y + 2, waterY - 8); y--) {
          const blockBelow = chunk.getBlock(localX, y, localZ);
          // Fill air with dirt/stone to create lake bed
          if (blockBelow === 0) {
            chunk.setBlock(localX, y, localZ, y < SEA_LEVEL - 3 ? STONE : DIRT);
          } else if (blockBelow === WATER) {
            // Continue filling through water columns
            continue;
          } else {
            // Hit solid block, stop
            break;
          }
        }
      }

      // --- DECORATION ---
      if (surfaceHeight > SEA_LEVEL) {
        // Trees: Can grow on mountains with reasonable slopes + below snow line
        // Only restrict on very steep terrain (slopes >= 4) or extreme altitudes
        const isTooSteepOrTooHigh =
          maxNeighborDiff >= 4 || surfaceHeight > SNOW_LINE;

        if (
          biome.trees &&
          !isTooSteepOrTooHigh &&
          (Math.abs(worldX) > 4 || Math.abs(worldZ) > 4) &&
          seededRandom(worldX, worldZ, seed) <
            0.015 * (decorationDensity / 100) &&
          worldX % 3 !== 0 &&
          worldZ % 3 !== 0
        ) {
          placeTree(
            chunk,
            localX,
            surfaceHeight + 1,
            localZ,
            TREE_TRUNK,
            TREE_LEAVES,
          );
        }

        // Crops/Resources
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
        }
      }
    }
  }

  chunk.generated = true;
  chunk.dirty = true;
}

/**
 * Place a resource/crop block on the surface.
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
  if (y >= MAX_Y || biome.cropBlockIds.length === 0) return;
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
 * @param {number} x - X coordinate.
 * @param {number} z - Z coordinate.
 * @param {number} seed - World seed.
 * @returns {number} Random value between 0 and 1.
 */
function seededRandom(x, z, seed) {
  const n = Math.sin(x * 12.9898 + z * 78.233 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Place a tree at the given position.
 * @param {Chunk} chunk - The chunk to modify.
 * @param {number} localX - Local X coordinate in the chunk.
 * @param {number} y - Y coordinate.
 * @param {number} localZ - Local Z coordinate in the chunk.
 * @param {number} woodId - Block ID for the tree trunk.
 * @param {number} leavesId - Block ID for the tree leaves.
 */
function placeTree(chunk, localX, y, localZ, woodId, leavesId) {
  const height = 4 + Math.floor(seededRandom(localX, localZ, y) * 2);
  for (let i = 0; i < height; i++) {
    if (y + i < MAX_Y) chunk.setBlock(localX, y + i, localZ, woodId);
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
        )
          continue;
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
  initNoise(seed);

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

  // Mountain generation with density gradient
  const mountainHeightNoise = noise(worldX, worldZ, seed + 4000, 3, 0.6, 0.005);
  const mnt_h_n = Math.max(1.0, 40 + mountainHeightNoise * 20);

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
 * @param {number} s - Scale value to normalize.
 * @returns {number} Normalized scale value.
 */
function normalizeScale(s) {
  if (s <= 1) return s * 200; // fraction -> up to 200 blocks
  if (s <= 100) return s; // percent or blocks
  return s; // already absolute
}

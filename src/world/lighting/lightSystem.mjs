/**
 * Light Propagation System
 *
 * Implements voxel lighting with light levels 0-15.
 * Light propagates via BFS flood-fill, attenuating by 1 per block.
 *
 * @module lightSystem
 */

import {
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  worldToChunk,
} from "../meshing/chunk.mjs";

/**
 * Maximum light level (equivalent to direct sunlight/lightstone).
 *
 * @constant {number}
 */
export const MAX_LIGHT_LEVEL = 15;

/**
 * Default light level for torches.
 *
 * @constant {number}
 */
export const TORCH_LIGHT_LEVEL = 14;

/**
 * Maximum distance light can propagate (in blocks).
 *
 * @constant {number}
 */
export const MAX_LIGHT_RADIUS = 16;

/**
 * Minimum ambient light multiplier (for caves/night without torches).
 *
 * @constant {number}
 */
export const MIN_AMBIENT_LIGHT = 0.0625; // 1/16

/**
 * Convert light level (0-15) to brightness multiplier (0.0625-1.0).
 *
 * @param {number} lightLevel - Light level 0-15
 *
 * @returns {number} Brightness multiplier
 */
export function lightLevelToBrightness(lightLevel) {
  // each level doubles brightness
  // Level 0 = 0.0625, Level 15 = 1.0
  return Math.pow(0.8, MAX_LIGHT_LEVEL - lightLevel);
}

/**
 * LightMap - Stores light levels for a chunk.
 * Uses a flat Uint8Array for memory efficiency.
 */
export class LightMap {
  /**
   * @param {number} sizeX - Chunk X size
   * @param {number} sizeY - Chunk Y size
   * @param {number} sizeZ - Chunk Z size
   */
  constructor(
    sizeX = CHUNK_SIZE_X,
    sizeY = CHUNK_SIZE_Y,
    sizeZ = CHUNK_SIZE_Z,
  ) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;

    this.data = new Uint8Array(sizeX * sizeY * sizeZ);
  }

  /**
   * Get index into flat array.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   *
   * @returns {number}
   */
  getIndex(x, y, z) {
    return x + y * this.sizeX + z * this.sizeX * this.sizeY;
  }

  /**
   * Get light level at local coordinates.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number}
   */
  get(x, y, z) {
    if (
      x < 0 ||
      x >= this.sizeX ||
      y < 0 ||
      y >= this.sizeY ||
      z < 0 ||
      z >= this.sizeZ
    ) {
      return 0;
    }

    return this.data[this.getIndex(x, y, z)];
  }

  /**
   * Set light level at local coordinates.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} level
   */
  set(x, y, z, level) {
    if (
      x < 0 ||
      x >= this.sizeX ||
      y < 0 ||
      y >= this.sizeY ||
      z < 0 ||
      z >= this.sizeZ
    ) {
      return;
    }

    this.data[this.getIndex(x, y, z)] = Math.max(
      0,
      Math.min(MAX_LIGHT_LEVEL, level),
    );
  }

  /**
   * Clear all light values.
   */
  clear() {
    this.data.fill(0);
  }
}

/**
 * Propagate light from emissive blocks using BFS flood-fill.
 * Updates the chunk's lightMap in place.
 *
 * @param {import('../meshing/chunk.mjs').Chunk} chunk - Chunk to calculate light for
 * @param {import('../config/blocks.mjs').BlockArray} blockDefs - Block definitions
 * @param {import('../chunkManager.mjs').ChunkManager} [chunkManager] - For cross-chunk lookups
 */
export function propagateLight(chunk, blockDefs, chunkManager = null) {
  // Initialize or clear the light map
  if (!chunk.lightMap) {
    chunk.lightMap = new LightMap();
  } else {
    chunk.lightMap.clear();
  }

  // Collect all emissive blocks as light sources
  /** @type {Array<{x: number, y: number, z: number, level: number}>} */
  const sources = [];

  for (let y = 0; y < CHUNK_SIZE_Y; y++) {
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
      for (let x = 0; x < CHUNK_SIZE_X; x++) {
        const blockType = chunk.getBlock(x, y, z);
        if (blockType === 0) continue;

        const block = blockDefs.getById(blockType);
        if (block && block.emissive > 0) {
          sources.push({ x, y, z, level: block.emissive });
          chunk.lightMap.set(x, y, z, block.emissive);
        }
      }
    }
  }

  // BFS flood-fill from all light sources
  const queue = [...sources];
  const directions = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];

  while (queue.length > 0) {
    const { x, y, z, level } = queue.shift();

    if (level <= 1) continue; // Light exhausted

    for (const [dx, dy, dz] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;

      // Skip out-of-chunk positions (future: cross-chunk propagation)
      if (
        nx < 0 ||
        nx >= CHUNK_SIZE_X ||
        ny < 0 ||
        ny >= CHUNK_SIZE_Y ||
        nz < 0 ||
        nz >= CHUNK_SIZE_Z
      ) {
        continue;
      }

      // Check if neighbor blocks light
      const neighborType = chunk.getBlock(nx, ny, nz);
      if (neighborType !== 0) {
        const neighborBlock = blockDefs.getById(neighborType);

        // Solid blocks block light (except emissive ones which are already sources)
        if (neighborBlock && neighborBlock.solid && !neighborBlock.emissive) {
          continue;
        }
      }

      // Propagate light with attenuation
      const newLevel = level - 1;
      const currentLevel = chunk.lightMap.get(nx, ny, nz);

      if (newLevel > currentLevel) {
        chunk.lightMap.set(nx, ny, nz, newLevel);

        queue.push({ x: nx, y: ny, z: nz, level: newLevel });
      }
    }
  }
}

/**
 * Get light level at world coordinates.
 *
 * @param {import('../chunkManager.mjs').ChunkManager} chunkManager
 * @param {number} worldX
 * @param {number} worldY
 * @param {number} worldZ
 * @returns {number} Light level 0-15
 */
export function getLightLevel(chunkManager, worldX, worldY, worldZ) {
  const { chunkX, chunkZ, localX, localZ } = worldToChunk(worldX, worldZ);
  const chunk = chunkManager.getChunk(chunkX, chunkZ);

  if (!chunk || !chunk.lightMap) {
    return 0;
  }

  return chunk.lightMap.get(localX, worldY, localZ);
}

/**
 * Recalculate light for affected chunks when a block changes.
 *
 * @param {import('../chunkManager.mjs').ChunkManager} chunkManager
 * @param {number} worldX
 * @param {number} worldY
 * @param {number} worldZ
 * @param {import('../config/blocks.mjs').BlockArray} blockDefs
 */
export function updateLightOnBlockChange(
  chunkManager,
  worldX,
  worldY,
  worldZ,
  blockDefs,
) {
  const { chunkX, chunkZ, localX, localZ } = worldToChunk(worldX, worldZ);
  const chunk = chunkManager.getChunk(chunkX, chunkZ);

  if (chunk) {
    propagateLight(chunk, blockDefs, chunkManager);

    chunk.dirty = true;
  }

  // Also update neighbor chunks if near boundaries (within MAX_LIGHT_RADIUS)
  // This ensures cross-chunk light updates
  const nearBoundary = MAX_LIGHT_RADIUS;

  if (localX < nearBoundary) {
    const neighbor = chunkManager.getChunk(chunkX - 1, chunkZ);
    if (neighbor) {
      propagateLight(neighbor, blockDefs, chunkManager);

      neighbor.dirty = true;
    }
  }

  if (localX >= CHUNK_SIZE_X - nearBoundary) {
    const neighbor = chunkManager.getChunk(chunkX + 1, chunkZ);
    if (neighbor) {
      propagateLight(neighbor, blockDefs, chunkManager);

      neighbor.dirty = true;
    }
  }

  if (localZ < nearBoundary) {
    const neighbor = chunkManager.getChunk(chunkX, chunkZ - 1);
    if (neighbor) {
      propagateLight(neighbor, blockDefs, chunkManager);

      neighbor.dirty = true;
    }
  }

  if (localZ >= CHUNK_SIZE_Z - nearBoundary) {
    const neighbor = chunkManager.getChunk(chunkX, chunkZ + 1);
    if (neighbor) {
      propagateLight(neighbor, blockDefs, chunkManager);

      neighbor.dirty = true;
    }
  }
}

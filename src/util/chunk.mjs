/** Chunk dimensions */
export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 128;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_VOLUME = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

/**
 * @typedef {Object} ChunkMesh
 *
 * @property {Float32Array} positions - Vertex positions
 * @property {Float32Array} normals - Vertex normals
 * @property {Float32Array} colors - Vertex colors (RGBA)
 * @property {Float32Array} [uvs] - UV coordinates
 * @property {Float32Array} [ao] - Ambient occlusion values
 * @property {Float32Array} [localUVs] - Local quad coordinates for Radial AO
 * @property {Float32Array} [cornerAO] - 4-corner AO values per face for Radial AO
 * @property {Uint16Array} [indices] - Vertex indices for indexed geometry
 * @property {number} vertexCount - Number of vertices
 * @property {number} [indexCount] - Number of indices (for indexed geometry)
 * @property {WebGLBuffer|null} positionBuffer - GPU buffer for positions
 * @property {WebGLBuffer|null} normalBuffer - GPU buffer for normals
 * @property {WebGLBuffer|null} colorBuffer - GPU buffer for colors
 * @property {WebGLBuffer|null} [uvBuffer] - GPU buffer for UVs
 * @property {WebGLBuffer|null} [aoBuffer] - GPU buffer for AO
 * @property {WebGLBuffer|null} [localUVBuffer] - GPU buffer for local UVs
 * @property {WebGLBuffer|null} [cornerAOBuffer] - GPU buffer for corner AO
 * @property {WebGLBuffer|null} [indexBuffer] - GPU buffer for indices
 */

/**
 * Chunk data structure for efficient voxel storage.
 *
 * Each chunk represents a 16x128x16 section of the world.
 * Blocks are stored in a flat Uint8Array for cache efficiency.
 *
 */
export class Chunk {
  /**
   * @param {number} chunkX - Chunk X coordinate (in chunk space)
   * @param {number} chunkZ - Chunk Z coordinate (in chunk space)
   */
  constructor(chunkX, chunkZ) {
    /** @type {number} */
    this.chunkX = chunkX;
    /** @type {number} */
    this.chunkZ = chunkZ;

    /** @type {Uint8Array} Block data (0 = air) */
    this.blocks = new Uint8Array(CHUNK_VOLUME);

    /** @type {boolean} Whether mesh needs rebuild */
    this.dirty = true;

    /** @type {boolean} Whether terrain has been generated */
    this.generated = false;

    /** @type {boolean} Whether peristent data has been restored */
    this.restored = false;

    /** @type {ChunkMesh|null} Cached mesh data */
    this.mesh = null;

    /** @type {Map<number, number>} Index -> block type for player-modified blocks */
    this.modifiedBlocks = new Map();

    /** @type {Map<number, Object>} Index -> metadata object */
    this.metadata = new Map();
  }

  /**
   * Mark a block as player-modified.
   * Stores the modification for persistence across chunk unload/reload.
   *
   * @param {number} x - Local X (0-15)
   * @param {number} y - Local Y (0-127)
   * @param {number} z - Local Z (0-15)
   * @param {number} type - Block type (0 = air for deletions)
   * @param {Object} [metadata] - Optional metadata for the block
   */
  markModified(x, y, z, type, metadata = null) {
    if (!this.inBounds(x, y, z)) {
      return;
    }
    const idx = this.index(x, y, z);
    this.modifiedBlocks.set(idx, type);

    if (metadata) {
      this.metadata.set(idx, metadata);
    } else {
      this.metadata.delete(idx);
    }
  }

  /**
   * Get all player modifications for this chunk.
   *
   * @returns {Map<number, number>} Index -> block type map
   */
  getModifications() {
    return this.modifiedBlocks;
  }

  /**
   * Apply stored modifications to chunk data.
   * Used when restoring a chunk after it was unloaded.
   *
   * @param {Map<number, number>} mods - Index -> block type map
   * @param {Map<number, Object>} [metadata] - Index -> metadata map
   */
  applyModifications(mods, metadata = null) {
    for (const [idx, type] of mods) {
      this.blocks[idx] = type;
    }
    this.modifiedBlocks = new Map(mods);

    if (metadata) {
      for (const [idx, data] of metadata) {
        this.metadata.set(idx, data);
      }
    }

    this.dirty = true;
  }

  /**
   * Check if chunk has any player modifications.
   *
   * @returns {boolean}
   */
  hasModifications() {
    return this.modifiedBlocks.size > 0;
  }

  /**
   * Convert local chunk coordinates to array index.
   *
   * @param {number} x - Local X (0-15)
   * @param {number} y - Local Y (0-127)
   * @param {number} z - Local Z (0-15)
   *
   * @returns {number} Array index
   */
  index(x, y, z) {
    return x + z * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
  }

  /**
   * Check if local coordinates are within chunk bounds.
   *
   * @param {number} x - Local X
   * @param {number} y - Local Y
   * @param {number} z - Local Z
   *
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    return (
      x >= 0 &&
      x < CHUNK_SIZE_X &&
      y >= 0 &&
      y < CHUNK_SIZE_Y &&
      z >= 0 &&
      z < CHUNK_SIZE_Z
    );
  }

  /**
   * Get block type at local coordinates.
   *
   * @param {number} x - Local X (0-15)
   * @param {number} y - Local Y (0-127)
   * @param {number} z - Local Z (0-15)
   *
   * @returns {number} Block type (0 = air)
   */
  getBlock(x, y, z) {
    if (!this.inBounds(x, y, z)) {
      return 0;
    }

    return this.blocks[this.index(x, y, z)];
  }

  /**
   * Set block type at local coordinates.
   *
   * @param {number} x - Local X (0-15)
   * @param {number} y - Local Y (0-127)
   * @param {number} z - Local Z (0-15)
   * @param {number} type - Block type (0 = air)
   *
   * @returns {boolean} True if block was set
   */
  setBlock(x, y, z, type) {
    if (!this.inBounds(x, y, z)) {
      return false;
    }

    const idx = this.index(x, y, z);
    if (this.blocks[idx] !== type) {
      this.blocks[idx] = type;
      this.dirty = true;
    }

    return true;
  }

  /**
   * Check if chunk has any non-air blocks.
   *
   * @returns {boolean}
   */
  isEmpty() {
    for (let i = 0; i < CHUNK_VOLUME; i++) {
      if (this.blocks[i] !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clear all blocks in chunk.
   */
  clear() {
    this.blocks.fill(0);
    this.dirty = true;
  }

  /**
   * Get world X coordinate of chunk origin.
   *
   * @returns {number}
   */
  get worldX() {
    return this.chunkX * CHUNK_SIZE_X;
  }

  /**
   * Get world Z coordinate of chunk origin.
   *
   * @returns {number}
   */
  get worldZ() {
    return this.chunkZ * CHUNK_SIZE_Z;
  }

  /**
   * Serialize chunk to a transferable format for workers.
   *
   * @returns {{chunkX: number, chunkZ: number, blocks: ArrayBuffer}}
   */
  toTransferable() {
    return {
      chunkX: this.chunkX,
      chunkZ: this.chunkZ,
      blocks: /** @type {ArrayBuffer} */ (this.blocks.buffer.slice(0)),
    };
  }

  /**
   * Create a chunk from compressed/serialized data.
   * Future: decompress gzip/brotli/custom RLE
   *
   * @param {{chunkX: number, chunkZ: number, blocks: ArrayBuffer}} data
   *
   * @returns {Chunk}
   */
  static fromCompressed(data) {
    const chunk = new Chunk(data.chunkX, data.chunkZ);
    chunk.blocks.set(new Uint8Array(data.blocks));

    return chunk;
  }
}

/**
 * Convert world coordinates to chunk coordinates.
 *
 * @param {number} worldX - World X coordinate
 * @param {number} worldZ - World Z coordinate
 *
 * @returns {{chunkX: number, chunkZ: number, localX: number, localZ: number}}
 */
export function worldToChunk(worldX, worldZ) {
  const chunkX = Math.floor(worldX / CHUNK_SIZE_X);
  const chunkZ = Math.floor(worldZ / CHUNK_SIZE_Z);

  // Handle negative coordinates properly
  const localX = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
  const localZ = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

  return { chunkX, chunkZ, localX, localZ };
}

/**
 * Convert chunk + local coordinates to world coordinates.
 *
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @param {number} localX - Local X (0-15)
 * @param {number} localZ - Local Z (0-15)
 *
 * @returns {{worldX: number, worldZ: number}}
 */
export function chunkToWorld(chunkX, chunkZ, localX, localZ) {
  return {
    worldX: chunkX * CHUNK_SIZE_X + localX,
    worldZ: chunkZ * CHUNK_SIZE_Z + localZ,
  };
}

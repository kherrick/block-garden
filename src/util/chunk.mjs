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
 * @property {number} vertexCount - Number of vertices
 * @property {WebGLBuffer|null} positionBuffer - GPU buffer for positions
 * @property {WebGLBuffer|null} normalBuffer - GPU buffer for normals
 * @property {WebGLBuffer|null} colorBuffer - GPU buffer for colors
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

    /** @type {ChunkMesh|null} Cached mesh data */
    this.mesh = null;
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

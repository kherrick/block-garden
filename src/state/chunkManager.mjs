import {
  Chunk,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  worldToChunk,
} from "../util/chunk.mjs";

/**
 * ChunkManager - Manages chunk lifecycle and world access.
 *
 * Provides a unified interface for block access across chunks,
 * handles chunk loading/unloading, and maintains backward compatibility
 * with the Map-based world storage.
 *
 */
export class ChunkManager {
  constructor() {
    /** @type {Map<string, Chunk>} Loaded chunks by "chunkX,chunkZ" key */
    this.chunks = new Map();

    /** @type {number} Chunk load radius around player */
    this.loadRadius = 4;
  }

  /**
   * Get chunk key string.
   *
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   *
   * @returns {string}
   */
  getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
  }

  /**
   * Get or create a chunk at the given chunk coordinates.
   *
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   *
   * @returns {Chunk}
   */
  getOrCreateChunk(chunkX, chunkZ) {
    const key = this.getChunkKey(chunkX, chunkZ);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(chunkX, chunkZ);

      this.chunks.set(key, chunk);
    }

    return chunk;
  }

  /**
   * Get chunk at the given chunk coordinates (if loaded).
   *
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   *
   * @returns {Chunk|undefined}
   */
  getChunk(chunkX, chunkZ) {
    return this.chunks.get(this.getChunkKey(chunkX, chunkZ));
  }

  /**
   * Get block type at world coordinates.
   *
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} z - World Z coordinate
   *
   * @returns {number} Block type (0 = air)
   */
  getBlock(x, y, z) {
    // Handle bottom at y <= 0
    if (y <= 0) {
      return 1; // Bottom
    }

    if (y >= CHUNK_SIZE_Y) {
      return 0; // Air above world height
    }

    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const floorZ = Math.floor(z);

    const { chunkX, chunkZ, localX, localZ } = worldToChunk(floorX, floorZ);
    const chunk = this.getChunk(chunkX, chunkZ);

    if (!chunk) {
      return 0; // Unloaded chunk = air
    }

    return chunk.getBlock(localX, floorY, localZ);
  }

  /**
   * Set block type at world coordinates.
   *
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} z - World Z coordinate
   * @param {number} type - Block type (0 = air)
   *
   * @returns {boolean} True if block was set
   */
  setBlock(x, y, z, type) {
    if (y <= 0 || y >= CHUNK_SIZE_Y) {
      return false; // Can't modify bottom or above world
    }

    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const floorZ = Math.floor(z);

    const { chunkX, chunkZ, localX, localZ } = worldToChunk(floorX, floorZ);
    const chunk = this.getOrCreateChunk(chunkX, chunkZ);

    const result = chunk.setBlock(localX, floorY, localZ, type);

    // Mark neighboring chunks dirty if block is at edge
    if (result) {
      this.markNeighborsDirty(chunkX, chunkZ, localX, localZ);
    }

    return result;
  }

  /**
   * Mark neighboring chunks as dirty if block is at chunk edge.
   *
   * @param {number} chunkX - Chunk X
   * @param {number} chunkZ - Chunk Z
   * @param {number} localX - Local X
   * @param {number} localZ - Local Z
   */
  markNeighborsDirty(chunkX, chunkZ, localX, localZ) {
    // If block is at edge, neighbor chunks need mesh rebuild
    if (localX === 0) {
      const neighbor = this.getChunk(chunkX - 1, chunkZ);
      if (neighbor) {
        neighbor.dirty = true;
      }
    }

    if (localX === CHUNK_SIZE_X - 1) {
      const neighbor = this.getChunk(chunkX + 1, chunkZ);
      if (neighbor) {
        neighbor.dirty = true;
      }
    }

    if (localZ === 0) {
      const neighbor = this.getChunk(chunkX, chunkZ - 1);
      if (neighbor) {
        neighbor.dirty = true;
      }
    }

    if (localZ === CHUNK_SIZE_Z - 1) {
      const neighbor = this.getChunk(chunkX, chunkZ + 1);
      if (neighbor) {
        neighbor.dirty = true;
      }
    }
  }

  /**
   * Check if a block exists at world coordinates.
   *
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} z - World Z coordinate
   *
   * @returns {boolean}
   */
  hasBlock(x, y, z) {
    return this.getBlock(x, y, z) !== 0;
  }

  /**
   * Delete block at world coordinates (set to air).
   *
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} z - World Z coordinate
   *
   * @returns {boolean}
   */
  deleteBlock(x, y, z) {
    return this.setBlock(x, y, z, 0);
  }

  /**
   * Clear all chunks.
   */
  clear() {
    this.chunks.clear();
  }

  /**
   * Get all loaded chunks.
   *
   * @returns {IterableIterator<Chunk>}
   */
  getAllChunks() {
    return this.chunks.values();
  }

  /**
   * Get chunks within load radius of player.
   *
   * @param {number} playerX - Player world X
   * @param {number} playerZ - Player world Z
   *
   * @returns {Chunk[]}
   */
  getVisibleChunks(playerX, playerZ) {
    const { chunkX: playerChunkX, chunkZ: playerChunkZ } = worldToChunk(
      playerX,
      playerZ,
    );

    const visible = [];

    for (const chunk of this.chunks.values()) {
      const dx = Math.abs(chunk.chunkX - playerChunkX);
      const dz = Math.abs(chunk.chunkZ - playerChunkZ);

      if (dx <= this.loadRadius && dz <= this.loadRadius) {
        visible.push(chunk);
      }
    }

    return visible;
  }

  /**
   * Iterate over all blocks in all chunks.
   * Provides Map-like forEach for backward compatibility.
   *
   * @param {(type: number, key: string) => void} callback
   */
  forEach(callback) {
    for (const chunk of this.chunks.values()) {
      const baseX = chunk.worldX;
      const baseZ = chunk.worldZ;

      for (let y = 1; y < CHUNK_SIZE_Y; y++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
          for (let x = 0; x < CHUNK_SIZE_X; x++) {
            const type = chunk.getBlock(x, y, z);

            if (type !== 0) {
              const worldX = baseX + x;
              const worldZ = baseZ + z;
              const key = `${worldX},${y},${worldZ}`;

              callback(type, key);
            }
          }
        }
      }
    }
  }

  /**
   * Get entries iterator for backward compatibility.
   * Yields [key, type] pairs like Map.entries().
   *
   * @returns {Generator<[string, number]>}
   */
  *entries() {
    for (const chunk of this.chunks.values()) {
      const baseX = chunk.worldX;
      const baseZ = chunk.worldZ;

      for (let y = 1; y < CHUNK_SIZE_Y; y++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
          for (let x = 0; x < CHUNK_SIZE_X; x++) {
            const type = chunk.getBlock(x, y, z);
            if (type !== 0) {
              const worldX = baseX + x;
              const worldZ = baseZ + z;
              const key = `${worldX},${y},${worldZ}`;

              yield [key, type];
            }
          }
        }
      }
    }
  }

  /**
   * Check if block exists at key (backward compatibility).
   *
   * @param {string} key - "x,y,z" key
   *
   * @returns {boolean}
   */
  has(key) {
    const [x, y, z] = key.split(",").map(Number);

    return this.hasBlock(x, y, z);
  }

  /**
   * Get block at key (backward compatibility).
   *
   * @param {string} key - "x,y,z" key
   * @returns {number|undefined}
   */
  get(key) {
    const [x, y, z] = key.split(",").map(Number);
    const type = this.getBlock(x, y, z);

    return type === 0 ? undefined : type;
  }

  /**
   * Set block at key (backward compatibility).
   *
   * @param {string} key - "x,y,z" key
   * @param {number} type - Block type
   *
   * @returns {ChunkManager}
   */
  set(key, type) {
    const [x, y, z] = key.split(",").map(Number);
    this.setBlock(x, y, z, type);

    return this;
  }

  /**
   * Delete block at key (backward compatibility).
   *
   * @param {string} key - "x,y,z" key
   * @returns {boolean}
   */
  delete(key) {
    const [x, y, z] = key.split(",").map(Number);

    return this.deleteBlock(x, y, z);
  }
}

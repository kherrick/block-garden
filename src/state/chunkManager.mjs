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
 * @class ChunkManager
 *
 * @example
 * const manager = new ChunkManager();
 * manager.setBlock(10, 50, 10, 1); // Set block at world coords
 * const type = manager.getBlock(10, 50, 10); // Get block type
 *
 * // Map-compatible API for backward compatibility
 * manager.set("10,50,10", 1);
 * manager.get("10,50,10");
 */
export class ChunkManager {
  /**
   * Creates a new ChunkManager instance.
   *
   * @constructor
   */
  constructor() {
    /** @type {Map<string, Chunk>} Loaded chunks by "chunkX,chunkZ" key */
    this.chunks = new Map();

    /** @type {number} Chunk render radius (generation distance) */
    this.renderRadius = 16;

    /** @type {number} Chunk cache radius (persistence distance) */
    this.cacheRadius = 24;

    /** @type {number|null} World radius limit in blocks (null = infinite) */
    this.worldRadius = null;
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
   * Creates and generates chunks as needed.
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

      if (dx <= this.renderRadius && dz <= this.renderRadius) {
        visible.push(chunk);
      }
    }

    return visible;
  }

  /**
   * Update visible chunks around player position.
   * Generates terrain for new chunks, unloads distant chunks.
   * Returns chunks sorted by distance (nearest first).
   *
   * @param {number} playerX - Player world X
   * @param {number} playerZ - Player world Z
   * @param {number} seed - World seed
   * @param {import('../state/config/blocks.mjs').BlockDefinition[]} blocks - Block definitions
   * @param {{[key: string]: string}} blockNames - Block name mapping
   * @param {(chunk: Chunk, seed: number, blocks: any, blockNames: any) => void} generateChunk - Chunk generator function
   * @param {WebGL2RenderingContext} [gl] - WebGL context for cleanup
   * @param {(gl: WebGL2RenderingContext, chunk: Chunk) => void} [deleteChunkMesh] - Mesh cleanup function
   *
   * @returns {Chunk[]} Visible chunks sorted by distance
   */
  updateVisibleChunks(
    playerX,
    playerZ,
    seed,
    blocks,
    blockNames,
    generateChunk,
    gl,
    deleteChunkMesh,
  ) {
    const { chunkX: playerChunkX, chunkZ: playerChunkZ } = worldToChunk(
      playerX,
      playerZ,
    );

    const visible = [];

    // Generate chunks in spiral from player (nearest first) within renderRadius
    for (let r = 0; r <= this.renderRadius; r++) {
      if (r === 0) {
        // Center chunk
        const chunk = this.getOrCreateChunk(playerChunkX, playerChunkZ);
        if (!chunk.generated) {
          generateChunk(chunk, seed, blocks, blockNames);
        }
        visible.push(chunk);
      } else {
        // Ring at radius r
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            // Only process chunks at exactly radius r (the ring)
            if (Math.abs(dx) !== r && Math.abs(dz) !== r) {
              continue;
            }

            const cx = playerChunkX + dx;
            const cz = playerChunkZ + dz;

            // Check world bounds if worldRadius is set
            if (this.worldRadius !== null) {
              const minChunkX = Math.floor(-this.worldRadius / CHUNK_SIZE_X);
              const maxChunkX = Math.floor(this.worldRadius / CHUNK_SIZE_X);
              const minChunkZ = Math.floor(-this.worldRadius / CHUNK_SIZE_Z);
              const maxChunkZ = Math.floor(this.worldRadius / CHUNK_SIZE_Z);

              if (
                cx < minChunkX ||
                cx > maxChunkX ||
                cz < minChunkZ ||
                cz > maxChunkZ
              ) {
                continue;
              }
            }

            const chunk = this.getOrCreateChunk(cx, cz);
            if (!chunk.generated) {
              generateChunk(chunk, seed, blocks, blockNames);
            }
            visible.push(chunk);
          }
        }
      }
    }

    // Cleanup & Visibility Check
    // We want to:
    // 1. Unload chunks > cacheRadius
    // 2. Keep visible chunks <= renderRadius
    // 3. Keep visible chunks <= cacheRadius IF they already have a mesh (Persistence)

    const toDelete = [];

    // Reset visible list? No, we pushed generated chunks already.
    // But we need to check existing chunks that WEREN'T generated this frame (buffer zone)

    for (const [key, chunk] of this.chunks) {
      const dx = Math.abs(chunk.chunkX - playerChunkX);
      const dz = Math.abs(chunk.chunkZ - playerChunkZ);

      if (dx > this.cacheRadius || dz > this.cacheRadius) {
        // UNLOAD: Outside persistence zone
        if (gl && deleteChunkMesh) {
          deleteChunkMesh(gl, chunk);
        }
        toDelete.push(key);
      } else {
        // PERSIST: Inside persistence zone
        // If it was already pushed to 'visible' (inside renderRadius loop), don't double push
        // But the loop above only pushes NEW or updated chunks?
        // Actually, the loop above iterates the spiral coordinates and does getOrCreate.
        // So 'visible' contains everything in renderRadius.

        // We just need to add chunks that are > renderRadius but <= cacheRadius AND have a mesh
        if (
          (dx > this.renderRadius || dz > this.renderRadius) &&
          chunk.generated
        ) {
          visible.push(chunk);
        }
      }
    }

    for (const key of toDelete) {
      this.chunks.delete(key);
    }

    // Return sorted by distance (nearest first for meshing priority)
    return visible.sort((a, b) => {
      const distA =
        Math.abs(a.chunkX - playerChunkX) + Math.abs(a.chunkZ - playerChunkZ);
      const distB =
        Math.abs(b.chunkX - playerChunkX) + Math.abs(b.chunkZ - playerChunkZ);

      return distA - distB;
    });
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

import {
  Chunk,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Y,
  CHUNK_SIZE_Z,
  worldToChunk,
} from "../util/chunk.mjs";

import { GravityQueue } from "../update/gravity.mjs";
import { gameConfig } from "./config/index.mjs";
import { getBlockById } from "./config/blocks.mjs";

/**
 * ChunkManager - Manages chunk lifecycle and world access.
 *
 * Provides a unified interface for block access across chunks,
 * handles chunk loading/unloading, along with Map-based world storage.
 *
 * @class ChunkManager
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

    /** @type {GravityQueue} Queue for gravity block processing */
    this.gravityQueue = new GravityQueue();

    /** @type {import('../state/config/blocks.mjs').BlockDefinition[]|null} Block definitions */
    this.blockTypes = null;

    /** @type {Map<string, Map<number, number>>} Stored player modifications for unloaded chunks */
    this.storedChunks = new Map();

    /** @type {Map<string, {timers: Object, structures: Object}>} Stored plant states for unloaded chunks */
    this.storedPlantStates = new Map();

    /** @type {Map<string, Map<number, Object>>} Stored metadata (link config, etc.) for unloaded chunks */
    this.storedMetadata = new Map();

    /** @type {Worker[]} Terrain generation worker pool */
    this.workers = [];

    const workerCount = globalThis.navigator?.hardwareConcurrency || 4;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(
        new URL("../generate/terrain.worker.mjs", import.meta.url),
        { type: "module" },
      );

      worker.onmessage = this.handleWorkerMessage.bind(this);

      this.workers.push(worker);
    }

    /** @type {number} Index of next worker to use (round-robin) */
    this.nextWorkerIndex = 0;
  }

  /**
   * Handle message from terrain worker.
   *
   * @param {MessageEvent} e
   */
  handleWorkerMessage(e) {
    const { chunkX, chunkZ, blocks } = e.data;
    const key = this.getChunkKey(chunkX, chunkZ);
    const chunk = this.chunks.get(key);

    if (chunk) {
      // Apply generated blocks
      chunk.blocks.set(new Uint8Array(blocks));
      chunk.generated = true;

      // Re-apply any modifications that happened before generation finished
      const mods = chunk.getModifications();
      const metadata = chunk.metadata;
      if (mods.size > 0) {
        chunk.applyModifications(mods, metadata);
      }

      chunk.dirty = true;
    }
  }

  /**
   * Restore persisted data (modifications, plants) for a newly generated chunk.
   *
   * @param {Chunk} chunk
   * @param {Object} [growthTimers]
   * @param {Object} [plantStructures]
   * @param {function} [onPlantsRestored]
   */
  restoreChunkPersistence(
    chunk,
    growthTimers = null,
    plantStructures = null,
    onPlantsRestored = null,
  ) {
    const key = this.getChunkKey(chunk.chunkX, chunk.chunkZ);

    // Restore player modifications
    const storedMods = this.storedChunks.get(key);
    const storedMetadata = this.storedMetadata.get(key);
    if (storedMods) {
      chunk.applyModifications(storedMods, storedMetadata);

      this.storedChunks.delete(key);
      this.storedMetadata.delete(key);
    }

    // Restore Plant States
    if (this.storedPlantStates.has(key)) {
      console.log(`[Persistence] Restoring plant state for chunk ${key}`);

      const { timers, structures } = this.storedPlantStates.get(key);

      if (growthTimers) {
        Object.assign(growthTimers, timers);
      }

      if (plantStructures) {
        for (const [structureKey, structure] of Object.entries(structures)) {
          plantStructures[structureKey] = structure;
        }
      }

      this.storedPlantStates.delete(key);

      if (onPlantsRestored && plantStructures) {
        const validStructures = Object.keys(structures).filter(
          (key) => plantStructures[key],
        );

        onPlantsRestored(validStructures);
      }
    }

    chunk.restored = true;
    chunk.dirty = true;
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
   * @param {boolean} [isPlayerChange=false] - Whether this is a player modification
   * @param {Object} [metadata=null] - Optional metadata for the block
   *
   * @returns {boolean} True if block was set
   */
  setBlock(x, y, z, type, isPlayerChange = false, metadata = null) {
    if (y <= 0 || y >= CHUNK_SIZE_Y) {
      return false;
    }

    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const floorZ = Math.floor(z);

    const { chunkX, chunkZ, localX, localZ } = worldToChunk(floorX, floorZ);
    const chunk = this.getOrCreateChunk(chunkX, chunkZ);

    const result = chunk.setBlock(localX, floorY, localZ, type);

    if (result) {
      this.markNeighborsDirty(chunkX, chunkZ, localX, localZ);

      if (isPlayerChange) {
        chunk.markModified(localX, floorY, localZ, type, metadata);
      }

      if (this.blockTypes && type !== 0) {
        const blockDef = getBlockById(type);
        if (blockDef && blockDef.gravity) {
          this.gravityQueue.enqueue(floorX, floorY, floorZ);
        }
      }
    }

    return result;
  }

  /**
   * Mark neighboring chunks as dirty if block is at chunk edge.
   */
  markNeighborsDirty(chunkX, chunkZ, localX, localZ) {
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
   */
  hasBlock(x, y, z) {
    return this.getBlock(x, y, z) !== 0;
  }

  /**
   * Delete block at world coordinates (set to air).
   */
  deleteBlock(x, y, z, isPlayerChange = false) {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const floorZ = Math.floor(z);

    const result = this.setBlock(floorX, floorY, floorZ, 0, isPlayerChange);

    if (result && this.blockTypes) {
      const aboveType = this.getBlock(floorX, floorY + 1, floorZ);
      if (aboveType !== 0) {
        const blockDef = getBlockById(aboveType);
        if (blockDef && blockDef.gravity) {
          this.gravityQueue.enqueue(floorX, floorY + 1, floorZ);
        }
      }
    }

    return result;
  }

  /**
   * Clear all chunks and stored modifications.
   */
  clear() {
    this.chunks.clear();
    this.storedChunks.clear();
    this.storedPlantStates.clear();
  }

  /**
   * Get all loaded chunks.
   */
  getAllChunks() {
    return this.chunks.values();
  }

  /**
   * Get chunks within load radius of player.
   */
  getVisibleChunks(playerX, playerZ) {
    const { chunkX: playerChunkX, chunkZ: playerChunkZ } = worldToChunk(
      playerX,
      playerZ,
    );

    const visible = [];
    const renderRadius = gameConfig.renderRadius.get();

    for (const chunk of this.chunks.values()) {
      const dx = Math.abs(chunk.chunkX - playerChunkX);
      const dz = Math.abs(chunk.chunkZ - playerChunkZ);

      if (dx <= renderRadius && dz <= renderRadius) {
        visible.push(chunk);
      }
    }

    return visible;
  }

  /**
   * Update visible chunks around player position.
   * Generates terrain for new chunks (ASYNC via Worker), unloads distant chunks.
   * Returns chunks sorted by distance (nearest first).
   */
  updateVisibleChunks(
    playerX,
    playerZ,
    seed,
    gl,
    deleteChunkMesh,
    growthTimers = null,
    plantStructures = null,
    onPlantsRestored = null,
  ) {
    const { chunkX: playerChunkX, chunkZ: playerChunkZ } = worldToChunk(
      playerX,
      playerZ,
    );

    const visible = [];
    const cachedRadius = gameConfig.cacheRadius.get();
    const currentWorldRadius = gameConfig.worldRadius.get();
    const renderRadius = gameConfig.renderRadius.get();

    const processChunk = (chunk) => {
      // If not generated and not generating, request it
      if (!chunk.generated && !chunk.generating) {
        chunk.generating = true;

        const worker = this.workers[this.nextWorkerIndex];

        this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;

        worker.postMessage({
          chunkX: chunk.chunkX,
          chunkZ: chunk.chunkZ,
          seed,
          settings: {
            terrainOctaves: gameConfig.terrainOctaves.get(),
            mountainScale: gameConfig.mountainScale.get(),
            decorationDensity: gameConfig.decorationDensity.get(),
            caveThreshold: gameConfig.caveThreshold.get(),
            useCaves: gameConfig.useCaves.get(),
            cloudDensity: gameConfig.cloudDensity.get(),
          },
        });

        return;
      }

      // If generated but not restored, restore persistence
      if (chunk.generated && !chunk.restored) {
        this.restoreChunkPersistence(
          chunk,
          growthTimers,
          plantStructures,
          onPlantsRestored,
        );
      }
    };

    // Generate chunks in spiral
    for (let r = 0; r <= renderRadius; r++) {
      if (r === 0) {
        const chunk = this.getOrCreateChunk(playerChunkX, playerChunkZ);

        processChunk(chunk);

        if (chunk.generated) {
          visible.push(chunk);
        }
      } else {
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) !== r && Math.abs(dz) !== r) {
              continue;
            }

            const cx = playerChunkX + dx;
            const cz = playerChunkZ + dz;

            // handle null for world radius (infinite)
            const WORLD_RADIUS =
              currentWorldRadius > 2048 ? null : currentWorldRadius;
            if (WORLD_RADIUS !== null) {
              const maxChunk = Math.floor(WORLD_RADIUS / CHUNK_SIZE_X);

              if (Math.abs(cx) > maxChunk || Math.abs(cz) > maxChunk) {
                continue;
              }
            }

            const chunk = this.getOrCreateChunk(cx, cz);

            processChunk(chunk);

            if (chunk.generated) {
              visible.push(chunk);
            }
          }
        }
      }
    }

    // Unload chunks outside cache radius
    const toDelete = [];

    for (const [key, chunk] of this.chunks) {
      const dx = Math.abs(chunk.chunkX - playerChunkX);
      const dz = Math.abs(chunk.chunkZ - playerChunkZ);

      if (dx > cachedRadius || dz > cachedRadius) {
        // Store player modifications if chunk has any
        const mods = chunk.getModifications();
        if (mods.size > 0 && this.storedChunks) {
          this.storedChunks.set(key, new Map(mods));
          if (chunk.metadata?.size > 0 && this.storedMetadata) {
            this.storedMetadata.set(key, new Map(chunk.metadata));
          }
        }

        if (gl && deleteChunkMesh) {
          deleteChunkMesh(gl, chunk);
        }

        // Store plant states before unloading
        if (growthTimers && plantStructures) {
          const chunkTimers = {};
          const chunkStructures = {};
          let hasPlantData = false;

          for (const timerKey of Object.keys(growthTimers)) {
            const [x, y, z] = timerKey.split(",").map(Number);
            const { chunkX, chunkZ } = worldToChunk(x, z);

            if (chunkX === chunk.chunkX && chunkZ === chunk.chunkZ) {
              chunkTimers[timerKey] = growthTimers[timerKey];
              delete growthTimers[timerKey];
              hasPlantData = true;
            }
          }

          for (const structKey of Object.keys(plantStructures)) {
            const [x, y, z] = structKey.split(",").map(Number);
            const { chunkX, chunkZ } = worldToChunk(x, z);

            if (chunkX === chunk.chunkX && chunkZ === chunk.chunkZ) {
              chunkStructures[structKey] = plantStructures[structKey];

              delete plantStructures[structKey];

              hasPlantData = true;
            }
          }

          if (hasPlantData) {
            console.log(`[Persistence] Storing plant state for chunk ${key}`);

            this.storedPlantStates.set(key, {
              timers: chunkTimers,
              structures: chunkStructures,
            });
          }
        }

        toDelete.push(key);
      } else {
        // Chunk is within cache radius but outside render radius
        if ((dx > renderRadius || dz > renderRadius) && chunk.generated) {
          visible.push(chunk);
        }
      }
    }

    for (const key of toDelete) {
      this.chunks.delete(key);
    }

    // Sort by distance (nearest first)
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
   * Check if block exists at key.
   */
  has(key) {
    const [x, y, z] = key.split(",").map(Number);

    return this.hasBlock(x, y, z);
  }

  /**
   * Get block at key.
   */
  get(key) {
    const [x, y, z] = key.split(",").map(Number);
    const type = this.getBlock(x, y, z);

    return type === 0 ? undefined : type;
  }

  /**
   * Set block at key.
   */
  set(key, type, isPlayerChange = false, metadata = null) {
    const [x, y, z] = key.split(",").map(Number);

    this.setBlock(x, y, z, type, isPlayerChange, metadata);

    return this;
  }

  /**
   * Delete block at key.
   */
  delete(key, isPlayerChange = false) {
    const [x, y, z] = key.split(",").map(Number);

    return this.deleteBlock(x, y, z, isPlayerChange);
  }
}

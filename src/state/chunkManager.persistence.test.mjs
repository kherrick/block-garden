/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock dependencies
jest.unstable_mockModule("../util/chunk.mjs", () => {
  const CHUNK_SIZE_X = 16;
  const CHUNK_SIZE_Y = 128;
  const CHUNK_SIZE_Z = 16;
  const CHUNK_VOLUME = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

  class MockChunk {
    constructor(chunkX, chunkZ) {
      this.chunkX = chunkX;
      this.chunkZ = chunkZ;
      this.blocks = new Uint8Array(CHUNK_VOLUME);
      this.dirty = true;
      this.generated = false;
      this.mesh = null;
      this.modifiedBlocks = new Map();
    }

    index(x, y, z) {
      return x + z * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
    }

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

    getBlock(x, y, z) {
      if (!this.inBounds(x, y, z)) return 0;
      return this.blocks[this.index(x, y, z)];
    }

    setBlock(x, y, z, type) {
      if (!this.inBounds(x, y, z)) return false;
      this.blocks[this.index(x, y, z)] = type;
      this.dirty = true;
      return true;
    }

    markModified(x, y, z, type) {
      if (!this.inBounds(x, y, z)) return;
      this.modifiedBlocks.set(this.index(x, y, z), type);
    }

    getModifications() {
      return this.modifiedBlocks;
    }

    applyModifications(mods) {
      for (const [idx, type] of mods) {
        this.blocks[idx] = type;
      }
      this.modifiedBlocks = new Map(mods);
      this.dirty = true;
    }
  }

  return {
    Chunk: MockChunk,
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,
    worldToChunk: (worldX, worldZ) => {
      const chunkX = Math.floor(worldX / CHUNK_SIZE_X);
      const chunkZ = Math.floor(worldZ / CHUNK_SIZE_Z);
      const localX = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
      const localZ = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
      return { chunkX, chunkZ, localX, localZ };
    },
  };
});

const { ChunkManager } = await import("./chunkManager.mjs");
const { gameConfig } = await import("./config/index.mjs");

describe("ChunkManager Persistence", () => {
  let manager;
  const generateChunk = jest.fn((chunk) => {
    chunk.generated = true;
    // Simulate some procedural generation
    chunk.setBlock(0, 10, 0, 1); // Helper block
  });
  const deleteChunkMesh = jest.fn();

  beforeEach(() => {
    manager = new ChunkManager();
    gameConfig.renderRadius.set(1); // Small radius for easy testing
    gameConfig.cacheRadius.set(2);
    generateChunk.mockClear();
    deleteChunkMesh.mockClear();
  });

  test("should persist player modifications when chunk is unloaded and reloaded", () => {
    // 1. Load initial chunks
    manager.updateVisibleChunks(
      0,
      0,
      123,
      [],
      {},
      generateChunk,
      {},
      deleteChunkMesh,
    );

    // 2. Modify a block in chunk (1, 0)
    // World coordinates: 16 (first block of chunk 1), 50, 0
    const worldX = 16;
    const worldY = 50;
    const worldZ = 0;

    // Set a block as a player modification
    manager.setBlock(worldX, worldY, worldZ, 5, true);

    // Verify it's set
    expect(manager.getBlock(worldX, worldY, worldZ)).toBe(5);

    // Verify modification is tracked in the chunk
    const chunk = manager.getChunk(1, 0);
    expect(chunk.getModifications().size).toBe(1);

    // 3. Move player far away to unload chunk (1, 0)
    // Move to -100, 0. Distance to (1, 0) is huge.
    manager.updateVisibleChunks(
      -100,
      0,
      123,
      [],
      {},
      generateChunk,
      {},
      deleteChunkMesh,
    );

    // Verify chunk is unloaded
    expect(manager.getChunk(1, 0)).toBeUndefined();

    // Verify modification is stored in ChunkManager
    const storedKey = "1,0";
    expect(manager.storedChunks.has(storedKey)).toBe(true);
    const cachedMods = manager.storedChunks.get(storedKey);
    expect(cachedMods.size).toBe(1);

    // 4. Move player back to reload chunk
    manager.updateVisibleChunks(
      0,
      0,
      123,
      [],
      {},
      generateChunk,
      {},
      deleteChunkMesh,
    );

    // Verify chunk is reloaded and modification is restored
    const reloadedChunk = manager.getChunk(1, 0);
    expect(reloadedChunk).toBeDefined();

    // Check block value - should be 5 (restored), not 0 (air) or 1 (procedural)
    expect(manager.getBlock(worldX, worldY, worldZ)).toBe(5);
  });

  test("should NOT persist non-player modifications", () => {
    // 1. Load initial chunks
    manager.updateVisibleChunks(
      0,
      0,
      123,
      [],
      {},
      generateChunk,
      {},
      deleteChunkMesh,
    );

    // 2. Modify a block WITHOUT player flag in chunk (1, 0)
    const worldX = 16;
    const worldY = 51;
    const worldZ = 0;
    manager.setBlock(worldX, worldY, worldZ, 6, false);

    // Verify it's set
    expect(manager.getBlock(worldX, worldY, worldZ)).toBe(6);

    // Verify modification is NOT tracked
    const chunk = manager.getChunk(1, 0);
    // Note: Previous test might have lefover state if not careful, but new ChunkManager per test.
    // However, we used the same mock class. MockChunk implements modification tracking.
    // getModifications() returns the map.
    // setBlock(..., false) should NOT call markModified.
    // We need to ensure MockChunk.setBlock helps us verify this, or rely on implementation detail
    // passed to ChunkManager.

    // Actually, ChunkManager calling chunk.markModified is what matters.
    // If we passed false, chunk.modifiedBlocks should be empty (assuming no other mods).
    expect(chunk.getModifications().size).toBe(0);

    // 3. Unload
    manager.updateVisibleChunks(
      -100,
      0,
      123,
      [],
      {},
      generateChunk,
      {},
      deleteChunkMesh,
    );

    // 4. Reload
    manager.updateVisibleChunks(
      0,
      0,
      123,
      [],
      {},
      generateChunk,
      {},
      deleteChunkMesh,
    );

    // Verify block is gone (reset to procedural state - air)
    // Procedural gen sets (0, 10, 0) to 1. (16, 51, 0) should be air.
    expect(manager.getBlock(worldX, worldY, worldZ)).toBe(0);
  });
});

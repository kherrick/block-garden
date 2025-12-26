/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock the chunk module before importing ChunkManager
jest.unstable_mockModule("../util/chunk.mjs", () => {
  const CHUNK_SIZE_X = 16;
  const CHUNK_SIZE_Y = 128;
  const CHUNK_SIZE_Z = 16;

  /**
   * Mock Chunk class for testing
   */
  class MockChunk {
    constructor(chunkX, chunkZ) {
      this.chunkX = chunkX;
      this.chunkZ = chunkZ;
      this.blocks = new Map();
      this.dirty = true;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {number}
     */
    getBlock(x, y, z) {
      const key = `${x},${y},${z}`;
      return this.blocks.get(key) || 0;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} type
     * @returns {boolean}
     */
    setBlock(x, y, z, type) {
      const key = `${x},${y},${z}`;

      if (type === 0) {
        this.blocks.delete(key);
      } else {
        this.blocks.set(key, type);
      }

      this.dirty = true;
      return true;
    }

    get worldX() {
      return this.chunkX * CHUNK_SIZE_X;
    }

    get worldZ() {
      return this.chunkZ * CHUNK_SIZE_Z;
    }
  }

  return {
    Chunk: MockChunk,
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,
    worldToChunk: jest.fn((worldX, worldZ) => {
      const chunkX = Math.floor(worldX / CHUNK_SIZE_X);
      const chunkZ = Math.floor(worldZ / CHUNK_SIZE_Z);
      const localX = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
      const localZ = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

      return { chunkX, chunkZ, localX, localZ };
    }),
  };
});

// Dynamic import after mocking
const { ChunkManager } = await import("./chunkManager.mjs");
const { CHUNK_SIZE_X, CHUNK_SIZE_Y } = await import("../util/chunk.mjs");

describe("ChunkManager", () => {
  /** @type {import('./chunkManager.mjs').ChunkManager} */
  let manager;

  beforeEach(() => {
    manager = new ChunkManager();
  });

  describe("constructor", () => {
    test("initializes with empty chunks map", () => {
      expect(manager.chunks.size).toBe(0);
    });

    test("sets default load radius", () => {
      expect(manager.loadRadius).toBe(4);
    });
  });

  describe("getChunkKey", () => {
    test("returns comma-separated chunk coordinates", () => {
      expect(manager.getChunkKey(0, 0)).toBe("0,0");
      expect(manager.getChunkKey(1, 2)).toBe("1,2");
      expect(manager.getChunkKey(-1, -2)).toBe("-1,-2");
    });
  });

  describe("getOrCreateChunk", () => {
    test("creates new chunk if not exists", () => {
      const chunk = manager.getOrCreateChunk(0, 0);

      expect(chunk).toBeDefined();
      expect(chunk.chunkX).toBe(0);
      expect(chunk.chunkZ).toBe(0);
      expect(manager.chunks.size).toBe(1);
    });

    test("returns existing chunk if already loaded", () => {
      const chunk1 = manager.getOrCreateChunk(0, 0);
      const chunk2 = manager.getOrCreateChunk(0, 0);

      expect(chunk1).toBe(chunk2);
      expect(manager.chunks.size).toBe(1);
    });
  });

  describe("getChunk", () => {
    test("returns undefined for unloaded chunk", () => {
      expect(manager.getChunk(0, 0)).toBeUndefined();
    });

    test("returns chunk if loaded", () => {
      const created = manager.getOrCreateChunk(1, 2);
      const retrieved = manager.getChunk(1, 2);

      expect(retrieved).toBe(created);
    });
  });

  describe("getBlock", () => {
    test("returns 1 (solid) for y <= 0 (bottom boundary)", () => {
      expect(manager.getBlock(0, 0, 0)).toBe(1);
      expect(manager.getBlock(5, -1, 5)).toBe(1);
    });

    test("returns 0 (air) for y >= CHUNK_SIZE_Y", () => {
      expect(manager.getBlock(0, CHUNK_SIZE_Y, 0)).toBe(0);
      expect(manager.getBlock(0, CHUNK_SIZE_Y + 10, 0)).toBe(0);
    });

    test("returns 0 (air) for unloaded chunk", () => {
      expect(manager.getBlock(100, 50, 100)).toBe(0);
    });

    test("returns block from chunk when loaded", () => {
      manager.setBlock(5, 10, 5, 3);

      expect(manager.getBlock(5, 10, 5)).toBe(3);
    });

    test("handles negative world coordinates", () => {
      manager.setBlock(-5, 10, -5, 4);

      expect(manager.getBlock(-5, 10, -5)).toBe(4);
    });
  });

  describe("setBlock", () => {
    test("returns false for y <= 0", () => {
      expect(manager.setBlock(0, 0, 0, 1)).toBe(false);
      expect(manager.setBlock(0, -1, 0, 1)).toBe(false);
    });

    test("returns false for y >= CHUNK_SIZE_Y", () => {
      expect(manager.setBlock(0, CHUNK_SIZE_Y, 0, 1)).toBe(false);
    });

    test("creates chunk and sets block", () => {
      const result = manager.setBlock(5, 10, 5, 2);

      expect(result).toBe(true);
      expect(manager.chunks.size).toBe(1);
      expect(manager.getBlock(5, 10, 5)).toBe(2);
    });

    test("floors floating point coordinates", () => {
      manager.setBlock(5.7, 10.3, 5.9, 2);

      expect(manager.getBlock(5, 10, 5)).toBe(2);
    });
  });

  describe("markNeighborsDirty", () => {
    test("marks left neighbor dirty when block at localX = 0", () => {
      const neighbor = manager.getOrCreateChunk(-1, 0);
      neighbor.dirty = false;

      manager.markNeighborsDirty(0, 0, 0, 8);

      expect(neighbor.dirty).toBe(true);
    });

    test("marks right neighbor dirty when block at localX = CHUNK_SIZE_X - 1", () => {
      const neighbor = manager.getOrCreateChunk(1, 0);
      neighbor.dirty = false;

      manager.markNeighborsDirty(0, 0, CHUNK_SIZE_X - 1, 8);

      expect(neighbor.dirty).toBe(true);
    });

    test("marks back neighbor dirty when block at localZ = 0", () => {
      const neighbor = manager.getOrCreateChunk(0, -1);
      neighbor.dirty = false;

      manager.markNeighborsDirty(0, 0, 8, 0);

      expect(neighbor.dirty).toBe(true);
    });

    test("marks front neighbor dirty when block at localZ = CHUNK_SIZE_Z - 1", () => {
      const neighbor = manager.getOrCreateChunk(0, 1);
      neighbor.dirty = false;

      manager.markNeighborsDirty(0, 0, 8, CHUNK_SIZE_X - 1);

      expect(neighbor.dirty).toBe(true);
    });

    test("does not fail if neighbor is not loaded", () => {
      expect(() => {
        manager.markNeighborsDirty(0, 0, 0, 0);
      }).not.toThrow();
    });
  });

  describe("hasBlock", () => {
    test("returns false for air", () => {
      expect(manager.hasBlock(5, 50, 5)).toBe(false);
    });

    test("returns true for solid block", () => {
      manager.setBlock(5, 50, 5, 1);

      expect(manager.hasBlock(5, 50, 5)).toBe(true);
    });

    test("returns true for bottom boundary", () => {
      expect(manager.hasBlock(0, 0, 0)).toBe(true);
    });
  });

  describe("deleteBlock", () => {
    test("removes block by setting to air", () => {
      manager.setBlock(5, 10, 5, 2);
      expect(manager.getBlock(5, 10, 5)).toBe(2);

      manager.deleteBlock(5, 10, 5);
      expect(manager.getBlock(5, 10, 5)).toBe(0);
    });
  });

  describe("clear", () => {
    test("removes all chunks", () => {
      manager.getOrCreateChunk(0, 0);
      manager.getOrCreateChunk(1, 1);
      expect(manager.chunks.size).toBe(2);

      manager.clear();
      expect(manager.chunks.size).toBe(0);
    });
  });

  describe("getAllChunks", () => {
    test("returns iterator of all chunks", () => {
      manager.getOrCreateChunk(0, 0);
      manager.getOrCreateChunk(1, 1);

      const chunks = [...manager.getAllChunks()];
      expect(chunks.length).toBe(2);
    });
  });

  describe("getVisibleChunks", () => {
    test("returns chunks within load radius", () => {
      // Create chunks at various positions
      manager.getOrCreateChunk(0, 0);
      manager.getOrCreateChunk(1, 0);
      manager.getOrCreateChunk(10, 10); // Far away

      // Player at origin
      const visible = manager.getVisibleChunks(8, 8);

      expect(visible.length).toBe(2);
      expect(visible.some((c) => c.chunkX === 0 && c.chunkZ === 0)).toBe(true);
      expect(visible.some((c) => c.chunkX === 1 && c.chunkZ === 0)).toBe(true);
    });
  });

  describe("forEach (Map compatibility)", () => {
    test("iterates over all non-air blocks", () => {
      manager.setBlock(5, 10, 5, 2);
      manager.setBlock(6, 11, 6, 3);

      const blocks = [];
      manager.forEach((type, key) => {
        blocks.push({ type, key });
      });

      expect(blocks.length).toBe(2);
    });
  });

  describe("entries (Map compatibility)", () => {
    test("yields [key, type] pairs for non-air blocks", () => {
      manager.setBlock(5, 10, 5, 2);

      const entries = [...manager.entries()];
      expect(entries.length).toBe(1);
      expect(entries[0][0]).toBe("5,10,5");
      expect(entries[0][1]).toBe(2);
    });
  });

  describe("has (Map compatibility)", () => {
    test("returns false for air block", () => {
      expect(manager.has("5,50,5")).toBe(false);
    });

    test("returns true for solid block", () => {
      manager.setBlock(5, 50, 5, 1);

      expect(manager.has("5,50,5")).toBe(true);
    });
  });

  describe("get (Map compatibility)", () => {
    test("returns undefined for air block", () => {
      expect(manager.get("5,50,5")).toBeUndefined();
    });

    test("returns block type for solid block", () => {
      manager.setBlock(5, 50, 5, 3);

      expect(manager.get("5,50,5")).toBe(3);
    });
  });

  describe("set (Map compatibility)", () => {
    test("sets block and returns this for chaining", () => {
      const result = manager.set("5,50,5", 2);

      expect(result).toBe(manager);
      expect(manager.getBlock(5, 50, 5)).toBe(2);
    });
  });

  describe("delete (Map compatibility)", () => {
    test("deletes block at key", () => {
      manager.set("5,50,5", 2);
      expect(manager.has("5,50,5")).toBe(true);

      manager.delete("5,50,5");
      expect(manager.has("5,50,5")).toBe(false);
    });
  });
});

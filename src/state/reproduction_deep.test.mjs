/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock global Worker
global.Worker = class {
  constructor() {}
  postMessage(data) {
    // Echo back immediate success (async simulation)
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            chunkX: data.chunkX,
            chunkZ: data.chunkZ,
            blocks: new Uint8Array(16 * 128 * 16),
          },
        });
      }
    }, 10);
  }
  terminate() {}
  onmessage() {}
};

// Mock config with real-ish values
jest.unstable_mockModule("./config/index.mjs", () => ({
  gameConfig: {
    renderRadius: { get: () => 1 },
    cacheRadius: { get: () => 2 },
    worldRadius: { get: () => 1000 },
  },
}));

// Real imports
const { ChunkManager } = await import("./chunkManager.mjs");
const { Chunk } = await import("../util/chunk.mjs");
const { updateStructure } = await import("../update/plantGrowth.mjs");

describe("Deep Reproduction: Plant Restoration", () => {
  let manager;
  let gameState;

  beforeEach(() => {
    manager = new ChunkManager();
    // Setup minimal game state
    gameState = {
      world: manager,
      plantStructures: {},
      growthTimers: {},
      fastGrowth: true,
    };
  });

  test("should restore a full plant structure after unload/reload", async () => {
    const onPlantsRestored = (keys) => {
      keys.forEach((key) => {
        const structure = gameState.plantStructures[key];
        updateStructure(gameState, key, 1.0, structure.type);
      });
    };

    const key = "8,10,8";
    gameState.plantStructures[key] = {
      type: "Sunflower",
      blocks: [
        { x: 8, y: 10, z: 8, blockId: 55 }, // Stem
        { x: 8, y: 11, z: 8, blockId: 37 }, // Sunflower
      ],
    };

    // Load chunk
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      () => {},
      gameState.growthTimers,
      gameState.plantStructures,
    );
    await new Promise((r) => setTimeout(r, 20)); // Wait for worker
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      () => {},
      gameState.growthTimers,
      gameState.plantStructures,
    ); // Restore

    // Player places seed
    manager.setBlock(8, 10, 8, 37, true); // 37 = Sunflower Seed

    // Unload the chunk
    manager.updateVisibleChunks(
      100,
      100,
      123,
      {},
      () => {},
      gameState.growthTimers,
      gameState.plantStructures,
    );

    // Reload the chunk
    const setBlockSpy = jest.spyOn(manager, "setBlock");
    const chunkSetBlockSpy = jest.spyOn(Chunk.prototype, "setBlock");

    // Call update loop
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      () => {},
      gameState.growthTimers,
      gameState.plantStructures,
      onPlantsRestored,
    );

    // Wait for worker
    await new Promise((r) => setTimeout(r, 20));

    // Call update loop again to trigger restoration
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      () => {},
      gameState.growthTimers,
      gameState.plantStructures,
      onPlantsRestored,
    );

    console.log("manager.setBlock calls:", setBlockSpy.mock.calls);
    console.log(
      "Chunk.prototype.setBlock calls:",
      chunkSetBlockSpy.mock.calls.length,
    );

    const chunk00 = manager.chunks.get("0,0");
    if (chunk00) {
      // Check if ANY call was on this instance
      const callsOnThisChunk = chunkSetBlockSpy.mock.instances.filter(
        (i) => i === chunk00,
      ).length;
      console.log("Calls on Chunk 0,0 instance:", callsOnThisChunk);
      console.log(
        "Total chunks created:",
        chunkSetBlockSpy.mock.instances.length,
      ); // Rough proxy if one call per chunk? No.
    }

    console.log("Block at local 8,11,8 (direct):", chunk00.getBlock(8, 11, 8));

    expect(manager.getBlock(8, 11, 8)).not.toBe(0);
  });

  test("should restore a full plant structure after loadSaveState", async () => {
    const { loadSaveState } = await import("./loadSave.mjs");
    const { createSaveState } = await import("./createSave.mjs");

    const onPlantsRestored = (keys) => {
      keys.forEach((key) => {
        const structure = gameState.plantStructures[key];
        updateStructure(gameState, key, 1.0, structure.type);
      });
    };

    const key = "8,10,8";
    // 1. Setup a grown plant
    gameState.plantStructures[key] = {
      type: "Sunflower",
      blocks: [
        { x: 8, y: 10, z: 8, blockId: 55 },
        { x: 8, y: 11, z: 8, blockId: 37 },
      ],
    };
    manager.setBlock(8, 10, 8, 55, true);
    manager.setBlock(8, 11, 8, 37, false);

    // 2. Create save state
    const save = createSaveState(manager, {
      blockGarden: { state: gameState, config: { seed: 123 } },
    });

    // 3. Reset manager/state
    manager.clear();
    gameState.plantStructures = {};
    gameState.growthTimers = {};

    // Mock shadow for reset event
    const shadow = { dispatchEvent: jest.fn() };
    const gThis = {
      blockGarden: { state: gameState },
      document: { createElement: () => ({ style: {} }) },
    };

    // 4. Load save state
    await loadSaveState(gThis, shadow, save);

    // Verify it was put in storedPlantStates, NOT active state
    expect(gameState.plantStructures[key]).toBeUndefined();
    expect(manager.storedPlantStates.has("0,0")).toBe(true);

    // 5. Trigger chunk loading (Reload the chunk)
    const setBlockSpy = jest.spyOn(manager, "setBlock");

    // Call update loop (Requests generation)
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      () => {},
      gameState.growthTimers,
      gameState.plantStructures,
      onPlantsRestored,
    );

    // Wait for worker
    await new Promise((r) => setTimeout(r, 20));

    // Call update loop again (Restores persistence)
    manager.updateVisibleChunks(
      0,
      0,
      123,
      {},
      () => {},
      gameState.growthTimers,
      gameState.plantStructures,
      onPlantsRestored,
    );

    console.log(
      "loadSave restore setBlock calls:",
      setBlockSpy.mock.calls.length,
    );

    // 6. Verification
    expect(manager.getBlock(8, 11, 8)).not.toBe(0);
    expect(gameState.plantStructures[key]).toBeDefined();
  });
});

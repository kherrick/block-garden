/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock dependencies
jest.unstable_mockModule("../core/systems/game/state.mjs", () => ({
  getMaterialCount: jest.fn(),
  getSeedCount: jest.fn(() => 0),
  removeMaterial: jest.fn(),
  removeSeed: jest.fn(),
  toInventoryKey: jest.fn((name) => name.toUpperCase().replace(/ /g, "_")),
}));

jest.unstable_mockModule("../core/world/config/index.mjs", () => ({
  gameConfig: {
    useCreativeMode: { get: jest.fn(() => false) },
  },
  FAST_GROWTH_TIME: 15,
}));

jest.unstable_mockModule("./collectDrop.mjs", () => ({
  collectDrop: jest.fn(),
}));

// Import after mocks
const { placeBlock, removeBlock } = await import("./interaction.mjs");
const { blocks } = await import("../core/world/config/blocks.mjs");
const { getMaterialCount, removeMaterial } =
  await import("../core/systems/game/state.mjs");
const { gameConfig } = await import("../core/world/config/index.mjs");

describe("Lava Inventory Behavior", () => {
  let gameState;

  beforeEach(() => {
    jest.clearAllMocks();
    gameState = {
      world: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
      },
      hit: {
        x: 10,
        y: 20,
        z: 30,
        face: { x: 0, y: 1, z: 0 },
      },
      curBlock: { get: jest.fn() },
      x: 0,
      y: 0,
      z: 0,
      playerWidth: 0.6,
      playerHeight: 1.8,
      plantStructures: {},
      growthTimers: {},
    };

    // Default to non-creative mode
    gameConfig.useCreativeMode.get.mockReturnValue(false);
  });

  test("placing Lava should consume 1 item in non-creative mode", () => {
    const lavaId = blocks.getIdByName("Lava");
    gameState.curBlock.get.mockReturnValue(lavaId);
    getMaterialCount.mockReturnValue(10);

    const result = placeBlock(gameState);

    expect(result).toBe("placed");
    expect(removeMaterial).toHaveBeenCalledWith("LAVA", 1);
  });

  test("placing Torch should NOT consume items in non-creative mode", () => {
    const torchId = blocks.getIdByName("Torch");
    gameState.curBlock.get.mockReturnValue(torchId);
    getMaterialCount.mockReturnValue(10);

    const result = placeBlock(gameState);

    expect(result).toBe("placed");
    expect(removeMaterial).not.toHaveBeenCalled();
  });

  test("placing Lava should NOT consume items in creative mode", () => {
    gameConfig.useCreativeMode.get.mockReturnValue(true);
    const lavaId = blocks.getIdByName("Lava");
    gameState.curBlock.get.mockReturnValue(lavaId);

    const result = placeBlock(gameState);

    expect(result).toBe("placed");
    expect(removeMaterial).not.toHaveBeenCalled();
  });

  test("breaking Lava should be handled by collectDrop (which now has drops: LAVA)", async () => {
    const { collectDrop } = await import("./collectDrop.mjs");
    const lavaId = blocks.getIdByName("Lava");
    gameState.world.get.mockReturnValue(lavaId);

    removeBlock(gameState);

    expect(collectDrop).toHaveBeenCalledWith(lavaId, expect.any(Object));
  });
});

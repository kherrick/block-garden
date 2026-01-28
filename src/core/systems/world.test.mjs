/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock the blocks module
jest.unstable_mockModule("../../world/config/blocks.mjs", () => ({
  getBlockById: jest.fn((type) => {
    if (type === 5) {
      // Sand has gravity
      return { gravity: true };
    }

    if (type === 2) {
      // Dirt doesn't have gravity
      return { gravity: false };
    }

    return null;
  }),
}));

const { updateWorld } = await import("./world.mjs");

describe("updateWorld", () => {
  let mockState;
  let mockWorld;
  let mockGravityQueue;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGravityQueue = {
      size: 3,
      dequeue: jest.fn((count) => [
        { x: 10, y: 20, z: 30 },
        { x: 20, y: 30, z: 40 },
        { x: 30, y: 40, z: 50 },
      ]),
      enqueue: jest.fn(),
    };

    mockWorld = {
      gravityQueue: mockGravityQueue,
      getBlock: jest.fn(),
      setBlock: jest.fn(),
    };

    mockState = {
      world: mockWorld,
      x: 0,
      z: 0,
    };
  });

  test("should return early if no gravity queue", () => {
    mockState.world.gravityQueue = null;

    updateWorld(mockState);
    expect(mockWorld.getBlock).not.toHaveBeenCalled();
  });

  test("should return early if gravity queue is empty", () => {
    mockGravityQueue.size = 0;

    updateWorld(mockState);
    expect(mockWorld.getBlock).not.toHaveBeenCalled();
  });

  test("should dequeue candidates from gravity queue", () => {
    updateWorld(mockState);
    expect(mockGravityQueue.dequeue).toHaveBeenCalledWith(200);
  });

  test("should re-enqueue blocks outside active region", () => {
    // Set player far away
    mockState.x = 1000;
    mockState.z = 1000;

    updateWorld(mockState);

    // All blocks should be re-enqueued since they're far from player
    expect(mockGravityQueue.enqueue).toHaveBeenCalledTimes(3);
  });

  test("should skip blocks that no longer exist", () => {
    mockWorld.getBlock.mockImplementation((x, y, z) => 0); // All blocks are air

    updateWorld(mockState);

    expect(mockWorld.setBlock).not.toHaveBeenCalled();
  });

  test("should skip blocks without gravity", () => {
    mockWorld.getBlock.mockImplementation((x, y, z) => 2); // Dirt (no gravity)

    updateWorld(mockState);

    expect(mockWorld.setBlock).not.toHaveBeenCalled();
  });

  test("should move sand blocks when space below is air", () => {
    // First candidate: sand at (10, 20, 30) with air below
    // Second candidate: sand at (20, 30, 40) with dirt below
    // Third candidate: sand at (30, 40, 50) with air below
    mockWorld.getBlock.mockImplementation((x, y, z) => {
      if (x === 10 && y === 20 && z === 30) {
        return 5; // Sand
      }

      if (x === 10 && y === 19 && z === 30) {
        return 0; // Air below
      }

      if (x === 20 && y === 30 && z === 40) {
        return 5; // Sand
      }

      if (x === 20 && y === 29 && z === 40) {
        return 2; // Dirt below
      }

      if (x === 30 && y === 40 && z === 50) {
        return 5; // Sand
      }

      if (x === 30 && y === 39 && z === 50) {
        return 0; // Air below
      }

      return 0;
    });

    updateWorld(mockState);

    // Should move first and third blocks
    expect(mockWorld.setBlock).toHaveBeenCalledWith(10, 20, 30, 0); // Delete
    expect(mockWorld.setBlock).toHaveBeenCalledWith(10, 19, 30, 5); // Set below
    expect(mockWorld.setBlock).toHaveBeenCalledWith(30, 40, 50, 0); // Delete
    expect(mockWorld.setBlock).toHaveBeenCalledWith(30, 39, 50, 5); // Set below

    // Should re-enqueue moved blocks
    expect(mockGravityQueue.enqueue).toHaveBeenCalledWith(10, 19, 30);
    expect(mockGravityQueue.enqueue).toHaveBeenCalledWith(30, 39, 50);
  });

  test("should re-enqueue blocks above fallen blocks", () => {
    // Sand at (10, 20, 30) with air below and sand above
    mockWorld.getBlock.mockImplementation((x, y, z) => {
      if (x === 10 && y === 20 && z === 30) {
        return 5; // Sand (will fall)
      }

      if (x === 10 && y === 19 && z === 30) {
        return 0; // Air below
      }

      if (x === 10 && y === 21 && z === 30) {
        return 5; // Sand above
      }

      return 0;
    });

    updateWorld(mockState);

    // Should re-enqueue the moved block and the block above
    expect(mockGravityQueue.enqueue).toHaveBeenCalledWith(10, 19, 30); // Moved block
    expect(mockGravityQueue.enqueue).toHaveBeenCalledWith(10, 21, 30); // Block above
  });

  test("should not re-enqueue blocks above if not gravity blocks", () => {
    // Sand at (10, 20, 30) with air below and dirt above
    mockWorld.getBlock.mockImplementation((x, y, z) => {
      if (x === 10 && y === 20 && z === 30) {
        return 5; // Sand (will fall)
      }

      if (x === 10 && y === 19 && z === 30) {
        return 0; // Air below
      }

      if (x === 10 && y === 21 && z === 30) {
        return 2; // Dirt above (no gravity)
      }

      return 0;
    });

    updateWorld(mockState);

    // Should re-enqueue the moved block but not the dirt above
    expect(mockGravityQueue.enqueue).toHaveBeenCalledWith(10, 19, 30); // Moved block
    expect(mockGravityQueue.enqueue).not.toHaveBeenCalledWith(10, 21, 30); // Dirt above
  });
});

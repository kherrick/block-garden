import { jest } from "@jest/globals";

// Mock dependencies
jest.unstable_mockModule("../../../utils/noise.mjs", () => ({
  initNoise: jest.fn(),
}));

jest.unstable_mockModule("./chunk.mjs", () => ({
  CLOUD_HEIGHT_MIN: 100,
}));

describe("World Generation", () => {
  let worldModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set up mock globalThis
    globalThis.blockGarden = {
      state: {
        world: {
          clear: jest.fn(),
        },
        seed: null,
        plantStructures: null,
        growthTimers: null,
        y: null,
        x: null,
        z: null,
        dy: null,
        onGround: null,
      },
      gameTime: 0,
    };

    // Import after mocks
    worldModule = await import("./world.mjs");
  });

  describe("generateWorld", () => {
    test("should be a function", () => {
      expect(typeof worldModule.generateWorld).toBe("function");
    });

    test("should initialize noise with seed", async () => {
      const { initNoise } = await import("../../../utils/noise.mjs");
      const seed = 12345;
      const gameState = globalThis.blockGarden.state;

      worldModule.generateWorld(seed, gameState);

      expect(initNoise).toHaveBeenCalledWith(seed);
    });

    test("should store seed in gameState", () => {
      const seed = 12345;
      const gameState = globalThis.blockGarden.state;

      worldModule.generateWorld(seed, gameState);

      expect(gameState.seed).toBe(seed);
    });

    test("should clear existing world", () => {
      const gameState = globalThis.blockGarden.state;

      worldModule.generateWorld(12345, gameState);

      expect(gameState.world.clear).toHaveBeenCalled();
    });

    test("should clear plant structures and growth timers", () => {
      const gameState = globalThis.blockGarden.state;

      worldModule.generateWorld(12345, gameState);

      expect(gameState.plantStructures).toEqual({});
      expect(gameState.growthTimers).toEqual({});
    });

    test("should set spawn position in sky", () => {
      const gameState = globalThis.blockGarden.state;

      worldModule.generateWorld(12345, gameState);

      expect(gameState.y).toBe(99); // CLOUD_HEIGHT_MIN - 1
      expect(gameState.x).toBe(0);
      expect(gameState.z).toBe(0);
      expect(gameState.dy).toBe(0);
      expect(gameState.onGround).toBe(false);
    });
  });

  describe("initNewWorld", () => {
    test("should be a function", () => {
      expect(typeof worldModule.initNewWorld).toBe("function");
    });

    test("should reset gameTime", () => {
      globalThis.blockGarden.gameTime = 1000;

      worldModule.initNewWorld(12345);

      expect(globalThis.blockGarden.state.gameTime).toBe(0);
    });

    test("should call generateWorld with seed", () => {
      // Test the side effects of initNewWorld calling generateWorld
      // We can't use jest.spyOn with ESM named exports, so we test the observable behavior
      const seed = 12345;
      const gameState = globalThis.blockGarden.state;

      worldModule.initNewWorld(seed);

      // Verify generateWorld was called by checking its side effects on gameState
      expect(gameState.seed).toBe(seed);
      expect(gameState.y).toBe(99);
      expect(gameState.x).toBe(0);
      expect(gameState.z).toBe(0);
      expect(gameState.dy).toBe(0);
      expect(gameState.onGround).toBe(false);
    });

    test("should use newSeed if provided", () => {
      const originalSeed = 12345;
      const newSeed = 54321;
      const gameState = globalThis.blockGarden.state;

      worldModule.initNewWorld(originalSeed, newSeed);

      // Verify that newSeed was used (not originalSeed)
      expect(gameState.seed).toBe(newSeed);
    });

    test("should use original seed if newSeed is null", () => {
      const seed = 12345;
      const gameState = globalThis.blockGarden.state;

      worldModule.initNewWorld(seed, null);

      // Verify that the original seed was used
      expect(gameState.seed).toBe(seed);
    });
  });
});

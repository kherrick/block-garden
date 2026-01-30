import { jest } from "@jest/globals";

// Mock dependencies
jest.unstable_mockModule("../../utils/isSolid.mjs", () => ({
  isSolid: jest.fn(),
}));

jest.unstable_mockModule("../../world/config/index.mjs", () => ({
  gameConfig: {
    useAutoJump: { get: () => true },
    worldRadius: { get: () => 10000 },
  },
}));

jest.unstable_mockModule("../../utils/isKeyPressed.mjs", () => ({
  isKeyPressed: () => false,
}));

// Dynamic import
const { updatePhysics } = await import("./physics.mjs");

// We mock isSolid module, so we need to grab the mock to control it
const { isSolid } = await import("../../utils/isSolid.mjs");

describe("Auto Jump Reproduction", () => {
  let state;
  let shadow;
  let ui;

  beforeEach(() => {
    state = {
      x: 0.5,
      y: 1.91, // Standing on block at 0 (Height 1). 1.91 ensures feet > 1.0.
      z: 0.5,
      dx: 0,
      dy: 0,
      dz: 0,
      playerWidth: 0.6,
      playerHeight: 1.8,
      onGround: true,
      flying: { get: () => false, set: jest.fn() },
      spacePressed: false,
      lastSpacePressTime: 0,
      world: {
        getBlock: jest.fn(),
      },
    };

    shadow = {};
    ui = {};

    // Reset isSolid mock
    isSolid.mockReset();

    // Default local behavior if we used it, but we override below
    isSolid.mockReturnValue(false);
  });

  test("should auto-jump over 1-block high obstacle", () => {
    // 3.0 isn't enough to hit wall in one frame if wall is at 1.0 (Dist 0.2).
    // dx=3 * 0.016 = 0.048. Pos -> 0.548.
    // Player Width 0.6. Front Edge = 0.548 + 0.3 = 0.848.
    // Obstacle at 1.0.
    // 0.848 < 1.0. No collision.
    // Needs much higher speed or closer position.

    // Move player closer: X=0.6. Front=0.9.
    // Move 0.1 -> Front=1.0. 0.1 / 0.016 = 6.25.
    state.x = 0.6;
    state.dx = 8.0;

    const dt = 0.016;

    // Logic for isSolid
    // We mock the module isSolid directly now to avoid confusion with internal imports
    isSolid.mockImplementation((world, x, y, z) => {
      // Ground (y < 1)
      if (y === 0) {
        return true;
      }

      // Obstacle at x=1, y=1
      if (x === 1 && y === 1 && z === 0) {
        return true;
      }

      return false;
    });

    updatePhysics(shadow, ui, state, dt);

    expect(state.dy).toBe(12);
  });

  test("fails to auto-jump if sliding along a tall wall (Touching Z-neighbor)", () => {
    state.x = 0.6;
    state.dx = 8.0;

    // Player at Z=0.7. Radius 0.3. MaxZ = 1.0.
    // Touches Z=1 wall.
    state.z = 0.7;

    const dt = 0.016;

    isSolid.mockImplementation((world, x, y, z) => {
      // Ground
      if (y === 0) {
        return true;
      }

      // Obstacle
      if (x === 1 && y === 1 && z === 0) {
        return true;
      }

      // Tall Wall at Z=1.
      if (z === 1 && (y === 1 || y === 2)) {
        return true;
      }

      return false;
    });

    updatePhysics(shadow, ui, state, dt);

    expect(state.dy).toBe(0);
  });
});

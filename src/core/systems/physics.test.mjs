/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

import { Signal } from "signal-polyfill";

/**
 * @typedef {import('./physics.mjs').AABB} AABB
 */

/**
 * Helper to quickly create AABB boxes.
 *
 * @param {number} minX
 * @param {number} minY
 * @param {number} minZ
 * @param {number} maxX
 * @param {number} maxY
 * @param {number} maxZ
 *
 * @returns {AABB}
 */
function A(minX, minY, minZ, maxX, maxY, maxZ) {
  return { minX, minY, minZ, maxX, maxY, maxZ };
}

// Mock modules before importing
jest.unstable_mockModule("../../utils/isSolid.mjs", () => ({
  isSolid: jest.fn(() => false),
}));

jest.unstable_mockModule("../../utils/isKeyPressed.mjs", () => ({
  isKeyPressed: jest.fn(() => false),
}));

jest.unstable_mockModule("../../world/config/index.mjs", () => ({
  gameConfig: {
    worldRadius: {
      get: jest.fn(() => 2072), // Default infinity
    },
  },
}));

// Dynamic imports after mocking
const { intersects, updatePhysics } = await import("./physics.mjs");
const { isKeyPressed } = await import("../../utils/isKeyPressed.mjs");
const { isSolid } = await import("../../utils/isSolid.mjs");
const { gameConfig } = await import("../../world/config/index.mjs");

// Mocks for dependencies
const makeState = (overrides = {}) => ({
  x: 0,
  y: 10,
  z: 0,
  dx: 0,
  dy: 0,
  dz: 0,
  playerWidth: 1,
  playerHeight: 2,
  onGround: false,
  flying: new Signal.State(false),
  flySpeed: 10,
  spacePressed: false,
  lastSpacePressTime: 0,
  world: { getBlock: jest.fn(() => 0) },
  ...overrides,
});

const makeUI = () => ({
  descendButton: {
    hasAttribute: jest.fn(() => true),
    removeAttribute: jest.fn(),
    setAttribute: jest.fn(),
  },
  flyButton: {
    hasAttribute: jest.fn(() => true),
    removeAttribute: jest.fn(),
    setAttribute: jest.fn(),
  },
});

global.performance = { now: () => 1000 };

describe("updatePhysics", () => {
  let shadow, ui, state;

  beforeEach(() => {
    shadow = {};
    ui = makeUI();
    state = makeState();

    isKeyPressed.mockReset();
    isKeyPressed.mockReturnValue(false);

    isSolid.mockReset();
    isSolid.mockReturnValue(false);

    gameConfig.worldRadius.get.mockReset();
    // Default infinity
    gameConfig.worldRadius.get.mockReturnValue(2072);
  });

  test("applies gravity when not flying", () => {
    state.dy = 0;

    updatePhysics(shadow, ui, state, 0.1);

    expect(state.dy).toBeCloseTo(-4.5);
  });

  test("sets dy to flySpeed when flying and space pressed", () => {
    state.flying.set(true);

    isKeyPressed.mockImplementation((_, key) => key === " ");

    updatePhysics(shadow, ui, state, 0.1);

    expect(state.dy).toBe(state.flySpeed);
  });

  test("sets dy to -flySpeed when flying and shift pressed", () => {
    state.flying.set(true);

    isKeyPressed.mockImplementation((_, key) => key === "shift");

    updatePhysics(shadow, ui, state, 0.1);

    expect(state.dy).toBe(-state.flySpeed);
  });

  test("sets dy to 0 when flying and no vertical input", () => {
    state.flying.set(true);

    isKeyPressed.mockReturnValue(false);

    updatePhysics(shadow, ui, state, 0.1);

    expect(state.dy).toBe(0);
  });

  test("jumps if space pressed and on ground", () => {
    state.onGround = true;

    isKeyPressed.mockImplementation((_, key) => key === " ");
    updatePhysics(shadow, ui, state, 0.1);

    // Jump sets dy=12, then gravity subtracts 45*0.1=4.5, so dy=7.5
    expect(state.dy).toBe(7.5);
  });

  test("toggles flying on double space tap", () => {
    state.lastSpacePressTime = 800;

    isKeyPressed.mockImplementation((_, key) => key === " ");

    updatePhysics(shadow, ui, state, 0.1);

    expect(state.flying.get()).toBe(true);
  });

  test("updates position if no collision", () => {
    state.flying.set(true);

    state.dx = 1;
    state.dy = 2;
    state.dz = 3;

    // When flying with no key pressed, dy becomes 0
    isKeyPressed.mockReturnValue(false);

    const result = updatePhysics(shadow, ui, state, 1);

    expect(result.x).toBe(1);
    // y stays same since dy becomes 0 when flying with no input
    expect(result.y).toBe(10);
    expect(result.z).toBe(3);
  });

  test("sets onGround true if collision while falling", () => {
    state.dy = -1;

    // Mock isSolid to return true, which triggers collision check
    isSolid.mockReturnValue(true);

    updatePhysics({}, ui, state, 1);

    expect(state.onGround).toBe(true);
  });

  test("clamps position to world boundaries", () => {
    // Small world test
    gameConfig.worldRadius.get.mockReturnValue(16);

    state.x = 15;
    state.dx = 10; // Moving outside
    state.z = 15;
    state.dz = 10; // Moving outside
    state.flying.set(true); // Easier to test movement

    const result = updatePhysics(shadow, ui, state, 1);

    expect(result.x).toBe(16); // Clamped
    expect(result.z).toBe(16); // Clamped
    expect(state.dx).toBe(0); // Velocity halted
    expect(state.dz).toBe(0); // Velocity halted
  });
});

describe("intersects", () => {
  test("two identical boxes intersect (overlapping)", () => {
    const a = A(0, 0, 0, 2, 2, 2);
    const b = A(0, 0, 0, 2, 2, 2);

    expect(intersects(a, b)).toBe(true);
  });

  test("boxes overlap along all axes", () => {
    const a = A(0, 0, 0, 2, 2, 2);
    const b = A(1, 1, 1, 3, 3, 3);

    expect(intersects(a, b)).toBe(true);
  });

  test("no intersection when separated along X", () => {
    const a = A(0, 0, 0, 1, 2, 2);
    const b = A(2.1, 0, 0, 3, 2, 2);

    expect(intersects(a, b)).toBe(false);
  });

  test("no intersection when separated along Y", () => {
    const a = A(0, 0, 0, 2, 1, 2);
    const b = A(0, 1.5, 0, 2, 3, 2);

    expect(intersects(a, b)).toBe(false);
  });

  test("no intersection when separated along Z", () => {
    const a = A(0, 0, 0, 2, 2, 1);
    const b = A(0, 0, 1.5, 2, 2, 3);

    expect(intersects(a, b)).toBe(false);
  });

  test("boxes touching at faces intersect", () => {
    const a = A(0, 0, 0, 1, 1, 1);
    // touching at x = 1
    const b = A(1, 0, 0, 2, 1, 1);

    expect(intersects(a, b)).toBe(true);
  });

  test("one box entirely inside another", () => {
    const outer = A(-1, -1, -1, 5, 5, 5);
    const inner = A(0, 0, 0, 2, 2, 2);

    expect(intersects(outer, inner)).toBe(true);
    expect(intersects(inner, outer)).toBe(true);
  });

  test("degenerate box (zero volume) intersects when on surface", () => {
    const a = A(0, 0, 0, 0, 0, 0);
    const b = A(0, 0, 0, 1, 1, 1);

    expect(intersects(a, b)).toBe(true);
  });

  test("degenerate box does not intersect when disjoint", () => {
    const a = A(0, 0, 0, 0, 0, 0);
    const b = A(1, 1, 1, 2, 2, 2);

    expect(intersects(a, b)).toBe(false);
  });

  test("intersects is symmetric", () => {
    const a = A(-2, -2, -2, 2, 2, 2);
    const b = A(-1, -1, -1, 1, 1, 1);

    expect(intersects(a, b)).toBe(true);
    expect(intersects(b, a)).toBe(true);
  });

  test("very large boxes intersect", () => {
    const a = A(-1e9, -1e9, -1e9, 1e9, 1e9, 1e9);
    const b = A(-5e8, -5e8, -5e8, 5e8, 5e8, 5e8);

    expect(intersects(a, b)).toBe(true);
  });

  test("non-number inputs return false", () => {
    const a = A(0, 0, 0, 1, 1, 1);
    const bad = { minX: "a", minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 };

    expect(intersects(a, bad)).toBe(false);
  });
});

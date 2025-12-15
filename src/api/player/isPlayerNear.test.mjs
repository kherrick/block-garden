/**
 * @jest-environment jsdom
 */
import { isPlayerNear } from "./isPlayerNear.mjs";

describe("isPlayerNear", () => {
  const playerPos = {
    pixel: { x: 160, y: 160 },
    tile: { x: 10, y: 10 },
    normalized: { x: 0.1, y: 0.1 },
    location: { horizontal: "left", vertical: "top" },
    bounds: {
      isAtLeft: false,
      isAtRight: false,
      isAtTop: false,
      isAtBottom: false,
    },
  };

  test("should return true when player is within the radius", () => {
    expect(isPlayerNear(12, 12, 3, playerPos)).toBe(true);
  });

  test("should return true when player is at the edge of the radius", () => {
    expect(isPlayerNear(15, 10, 5, playerPos)).toBe(true);
    expect(isPlayerNear(10, 15, 5, playerPos)).toBe(true);
  });

  test("should return false when player is outside the radius", () => {
    expect(isPlayerNear(16, 10, 5, playerPos)).toBe(false);
    expect(isPlayerNear(10, 16, 5, playerPos)).toBe(false);
  });

  test("should use a default radius of 5", () => {
    // Inside default radius
    expect(isPlayerNear(14, 14, undefined, playerPos)).toBe(true);
    // Exactly at default radius edge
    expect(isPlayerNear(15, 15, undefined, playerPos)).toBe(true);
    // Outside default radius
    expect(isPlayerNear(16, 15, undefined, playerPos)).toBe(false);
  });

  test("should return false if player position is not provided", () => {
    expect(isPlayerNear(10, 10, 5, null)).toBe(false);
    expect(isPlayerNear(10, 10, 5, undefined)).toBe(false);
    expect(isPlayerNear(10, 10)).toBe(false);
  });

  test("should handle negative coordinates correctly", () => {
    const negPlayerPos = { ...playerPos, tile: { x: -10, y: -10 } };

    expect(isPlayerNear(-12, -12, 3, negPlayerPos)).toBe(true);
    expect(isPlayerNear(-16, -10, 5, negPlayerPos)).toBe(false);
  });
});

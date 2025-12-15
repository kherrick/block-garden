/**
 * @jest-environment jsdom
 */
import { getDistanceFromPlayer } from "./getDistanceFromPlayer.mjs";

describe("getDistanceFromPlayer", () => {
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

  test("should calculate distances correctly for a given position", () => {
    const targetX = 13;
    const targetY = 14;
    const distance = getDistanceFromPlayer(targetX, targetY, playerPos);

    expect(distance.manhattan).toBe(7); // |10-13| + |10-14| = 3 + 4 = 7
    expect(distance.euclidean).toBe(5); // sqrt((-3)^2 + (-4)^2) = sqrt(9 + 16) = 5
    expect(distance.tiles).toEqual({ x: -3, y: -4 }); // 10-13, 10-14
  });

  test("should return an empty object if player position is not provided", () => {
    expect(getDistanceFromPlayer(10, 10, null)).toEqual({});
    expect(getDistanceFromPlayer(10, 10, undefined)).toEqual({});
    expect(getDistanceFromPlayer(10, 10)).toEqual({});
  });

  test("should handle cases where the player is at the target location", () => {
    const distance = getDistanceFromPlayer(10, 10, playerPos);
    expect(distance.manhattan).toBe(0);
    expect(distance.euclidean).toBe(0);
    expect(distance.tiles).toEqual({ x: 0, y: 0 });
  });

  test("should work with negative coordinates", () => {
    const negPlayerPos = { ...playerPos, tile: { x: -5, y: -5 } };
    const targetX = -2;
    const targetY = -1;
    const distance = getDistanceFromPlayer(targetX, targetY, negPlayerPos);

    expect(distance.manhattan).toBe(7); // |-5 - (-2)| + |-5 - (-1)| = 3 + 4 = 7
    expect(distance.euclidean).toBe(5); // sqrt((-3)^2 + (-4)^2) = 5
    expect(distance.tiles).toEqual({ x: -3, y: -4 });
  });
});

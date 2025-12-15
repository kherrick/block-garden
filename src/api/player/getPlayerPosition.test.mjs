/**
 * @jest-environment jsdom
 */
import { getPlayerPosition } from "./getPlayerPosition.mjs";

describe("getPlayerPosition", () => {
  const player = { x: 100, y: 200, width: 16, height: 16 };
  const tileSize = 16;
  const worldHeight = 100;
  const worldWidth = 100;

  test("should return a player position object", () => {
    expect(
      typeof getPlayerPosition(player, tileSize, worldHeight, worldWidth),
    ).toBe("object");
  });

  test("should calculate pixel position correctly", () => {
    const position = getPlayerPosition(
      player,
      tileSize,
      worldHeight,
      worldWidth,
    );

    expect(position.pixel).toEqual({ x: 100, y: 200 });
  });

  test("should calculate tile position correctly", () => {
    const position = getPlayerPosition(
      player,
      tileSize,
      worldHeight,
      worldWidth,
    );

    // (100 + 8) / 16 = 6.75 -> 6
    // (200 + 8) / 16 = 13 -> 13
    expect(position.tile).toEqual({ x: 6, y: 13 });
  });

  test("should calculate normalized position correctly", () => {
    const position = getPlayerPosition(
      player,
      tileSize,
      worldHeight,
      worldWidth,
    );

    expect(position.normalized).toEqual({ x: 0.06, y: 0.13 });
  });

  test("should determine location correctly", () => {
    let position = getPlayerPosition(
      { ...player, x: 10 * 16, y: 10 * 16 },
      tileSize,
      worldHeight,
      worldWidth,
    );

    expect(position.location).toEqual({
      horizontal: "left",
      vertical: "top",
    });

    position = getPlayerPosition(
      { ...player, x: 50 * 16, y: 50 * 16 },
      tileSize,
      worldHeight,
      worldWidth,
    );

    expect(position.location).toEqual({
      horizontal: "center",
      vertical: "middle",
    });

    position = getPlayerPosition(
      { ...player, x: 80 * 16, y: 80 * 16 },
      tileSize,
      worldHeight,
      worldWidth,
    );

    expect(position.location).toEqual({
      horizontal: "right",
      vertical: "bottom",
    });
  });

  test("should determine bounds correctly", () => {
    let position = getPlayerPosition(
      { ...player, x: 2 * 16, y: 2 * 16 },
      tileSize,
      worldHeight,
      worldWidth,
    );

    expect(position.bounds).toEqual({
      isAtLeft: true,
      isAtRight: false,
      isAtTop: true,
      isAtBottom: false,
    });

    position = getPlayerPosition(
      { ...player, x: 98 * 16, y: 98 * 16 },
      tileSize,
      worldHeight,
      worldWidth,
    );

    expect(position.bounds).toEqual({
      isAtLeft: false,
      isAtRight: true,
      isAtTop: false,
      isAtBottom: true,
    });
  });
});

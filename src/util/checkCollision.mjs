import { isSolid } from "./isSolid.mjs";

/**
 * Detects collision between an axis-aligned bounding box and solid world tiles.
 *
 * Tests multiple points around the bounding box perimeter for collision.
 *
 * @param {number} height - Height of the bounding box in pixels
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} width - Width of the bounding box in pixels
 * @param {Object} world - World object with getTile method
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {number} x - X-coordinate of bounding box in pixels
 * @param {number} y - Y-coordinate of bounding box in pixels
 *
 * @returns {boolean} True if collision detected, false otherwise
 */
export function checkCollision(
  height,
  tileSize,
  width,
  world,
  worldHeight,
  worldWidth,
  x,
  y,
) {
  const points = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
    [x + width / 2, y],
    [x + width / 2, y + height],
    [x, y + height / 2],
    [x + width, y + height / 2],
  ];

  return points.some((point) =>
    isSolid(tileSize, world, worldHeight, worldWidth, point[0], point[1]),
  );
}

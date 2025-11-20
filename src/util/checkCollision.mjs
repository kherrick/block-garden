import { isSolid } from "./isSolid.mjs";

/**
 * Check collision with world
 *
 * @param {any} height
 * @param {any} tileSize
 * @param {any} width
 * @param {any} world
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} x
 * @param {any} y
 *
 * @returns {boolean}
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

/**
 * Track water changes during gameplay
 *
 * @param {any} x
 * @param {any} y
 * @param {any} queue
 * @param {any} worldWidth
 * @param {any} worldHeight
 * @param {number} [radius=5]
 *
 * @returns {void}
 */
export function markWaterRegionDirty(
  x,
  y,
  queue,
  worldWidth,
  worldHeight,
  radius = 5,
) {
  const currentQueue = queue.get();

  // Add all tiles in radius to the dirty queue
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const checkX = x + dx;
      const checkY = y + dy;

      if (
        checkX >= 0 &&
        checkX < worldWidth &&
        checkY >= 0 &&
        checkY < worldHeight
      ) {
        currentQueue.add(`${checkX},${checkY}`);
      }
    }
  }
}

/**
 * Marks a region of tiles for water physics updates.
 *
 * Adds all tiles within a radius to a dirty queue for processing in the next physics step.
 * Used to efficiently track only changed areas rather than entire world.
 *
 * @param {number} x - Center X coordinate in tiles
 * @param {number} y - Center Y coordinate in tiles
 * @param {Object} queue - State Signal containing Set of dirty region keys
 * @param {number} worldWidth - Total world width in tiles
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} [radius=5] - Search radius in tiles
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

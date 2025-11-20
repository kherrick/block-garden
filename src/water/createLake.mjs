/**
 * @param {any} world
 * @param {any} centerX
 * @param {any} surfaceY
 * @param {any} size
 * @param {any} worldWidth
 * @param {any} worldHeight
 * @param {any} tiles
 *
 * @returns {void}
 */
export function createLake(
  world,
  centerX,
  surfaceY,
  size,
  worldWidth,
  worldHeight,
  tiles,
) {
  const radius = Math.floor(size / 2);

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = 0; dy <= Math.floor(size * 0.3); dy++) {
      const x = centerX + dx;
      const y = surfaceY + dy + 1;

      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        // Flatten vertically
        const distance = Math.sqrt(dx * dx + dy * dy * 2);

        if (distance <= radius) {
          // Clear out space for lake
          if (world.getTile(x, y).id !== tiles.SAND.id) {
            world.setTile(x, y, tiles.WATER);
          }
        }
      }
    }
  }
}

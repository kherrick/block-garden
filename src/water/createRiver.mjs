/**
 * @param {any} world
 * @param {any} x
 * @param {any} surfaceY
 * @param {any} worldWidth
 * @param {any} worldHeight
 * @param {any} tiles
 *
 * @returns {void}
 */
export function createRiver(
  world,
  x,
  surfaceY,
  worldWidth,
  worldHeight,
  tiles,
) {
  // Create a shallow river
  const riverY = surfaceY + 1;

  if (x >= 0 && x < worldWidth && riverY >= 0 && riverY < worldHeight) {
    if (world.getTile(x, riverY).id !== tiles.SAND.id) {
      world.setTile(x, riverY, tiles.WATER);
    }

    // Add a bit of depth
    const riverY2 = surfaceY + 2;

    if (riverY2 < worldHeight && Math.random() < 0.7) {
      if (world.getTile(x, riverY2).id !== tiles.SAND.id) {
        world.setTile(x, riverY2, tiles.WATER);
      }
    }
  }
}

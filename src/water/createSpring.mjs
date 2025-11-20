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
export function createSpring(
  world,
  x,
  surfaceY,
  worldWidth,
  worldHeight,
  tiles,
) {
  // Create a small water source
  const y = surfaceY;

  if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
    const tile = world.getTile(x, y);

    if (tile === tiles.AIR && tile.id !== tiles.SAND.id) {
      world.setTile(x, y, tiles.WATER);
    }
  }
}

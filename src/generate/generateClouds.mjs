import { cloudNoise, initNoise } from "../util/noise.mjs";

/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {WorldMap} world
 * @param {number} worldWidth
 * @param {number} surfaceLevel
 * @param {TileMap} tiles
 * @param {number} seed
 *
 * @returns {void}
 */
export function generateClouds(world, worldWidth, surfaceLevel, tiles, seed) {
  initNoise(seed);

  const minCloudY = 5; // Start clouds a bit below the top
  const maxCloudY = Math.max(surfaceLevel - 30, 60); // Keep clouds above surface

  // Generate clouds using noise for natural distribution
  for (let x = 0; x < worldWidth; x++) {
    // Use noise to determine if we should place a cloud
    if (cloudNoise(seed) > 0.2) {
      // Determine cloud size and position
      const cloudWidth = Math.floor(6 + Math.random() * 10);
      const cloudHeight = Math.floor(4 + Math.random() * 6);
      const cloudY =
        minCloudY + Math.floor(Math.random() * (maxCloudY - minCloudY));

      // Create a fluffy cloud shape
      for (let dx = 0; dx < cloudWidth; dx++) {
        for (let dy = 0; dy < cloudHeight; dy++) {
          const cloudX = x + dx;

          // Skip if out of bounds
          if (cloudX >= worldWidth || cloudY + dy >= surfaceLevel) continue;
          // Create rounded cloud edges
          const isEdge =
            dx === 0 ||
            dx === cloudWidth - 1 ||
            dy === 0 ||
            dy === cloudHeight - 1;

          const shouldPlace = !isEdge || Math.random() > 0.3;

          if (shouldPlace) {
            const currentTile = world.getTile(cloudX, cloudY + dy);

            if (currentTile === tiles.AIR) {
              world.setTile(cloudX, cloudY + dy, tiles.CLOUD);
            }
          }
        }
      }

      // Skip ahead to avoid overlapping clouds
      x += cloudWidth + Math.floor(Math.random() * 10);
    }
  }
}

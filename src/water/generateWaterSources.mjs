import { createLake } from "./createLake.mjs";
import { createRiver } from "./createRiver.mjs";
import { createSpring } from "./createSpring.mjs";

import { initNoise, waterNoise } from "../util/noise.mjs";

/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {WorldMap} world - Signal State with world tile data
 * @param {Array<number>} heights - Array of height values for terrain
 * @param {number} worldWidth - Total world width in tiles
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} surfaceLevel - Y coordinate of the surface level
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} seed - Random seed for water placement
 *
 * @returns {void}
 */
export function generateWaterSources(
  world,
  heights,
  worldWidth,
  worldHeight,
  surfaceLevel,
  tiles,
  seed,
) {
  if (!world || typeof world.getTile !== "function") {
    console.error("generateWaterSources: Invalid world object at entry", {
      hasWorld: !!world,
      worldType: typeof world,
      worldWidth,
      worldHeight,
    });

    return;
  }

  initNoise(seed);

  for (let x = 0; x < worldWidth; x++) {
    const surfaceHeight = heights[x];
    const waterNoiseValue = waterNoise(x, parseInt(String(seed)) + 2000);

    // Create springs
    if (surfaceHeight > surfaceLevel) {
      createSpring(world, x, surfaceHeight, worldWidth, worldHeight, tiles);
    }

    // Create lakes
    if (waterNoiseValue > 0.5 && surfaceHeight < surfaceLevel + 5) {
      const lakeSize = Math.floor((waterNoiseValue - 0.4) * 15) + 5;

      createLake(
        world,
        x,
        surfaceHeight,
        lakeSize,
        worldWidth,
        worldHeight,
        tiles,
      );
    }

    // Generate rivers
    const riverNoise = waterNoise(x, parseInt(String(seed)) + 2500);

    if (riverNoise > 0.5) {
      createRiver(world, x, surfaceHeight, worldWidth, worldHeight, tiles);
    }
  }
}

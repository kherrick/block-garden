import { createLake } from "./createLake.mjs";
import { createRiver } from "./createRiver.mjs";
import { createSpring } from "./createSpring.mjs";

import { initNoise, waterNoise } from "../util/noise.mjs";

/**
 * @param {any} world
 * @param {any} heights
 * @param {any} worldWidth
 * @param {any} worldHeight
 * @param {any} surfaceLevel
 * @param {any} tiles
 * @param {any} seed
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
    const waterNoiseValue = waterNoise(x, parseInt(seed) + 2000);

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
    const riverNoise = waterNoise(x, parseInt(seed) + 2500);

    if (riverNoise > 0.5) {
      createRiver(world, x, surfaceHeight, worldWidth, worldHeight, tiles);
    }
  }
}

import { generatePlantStructure } from "../generate/plants/index.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {Signal.State} growthTimers
 * @param {Signal.State} plantStructures
 * @param {TileMap} tiles
 * @param {Signal.State} world
 * @param {number} worldHeight
 * @param {number} worldWidth
 *
 * @returns {void}
 */
export function updateCrops(
  growthTimers,
  plantStructures,
  tiles,
  world,
  worldHeight,
  worldWidth,
) {
  let timersChanged = false;
  let structuresChanged = false;

  const currentWorld = world.get();
  const updatedTimers = { ...growthTimers.get() };
  const updatedStructures = { ...plantStructures.get() };

  // Update crop growth
  for (const [key, timer] of Object.entries(updatedTimers)) {
    timer.timeLeft -= 1 / 60; // Decrement by frame time

    // Update plant structure growth if structure exists
    if (updatedStructures[key]) {
      const structure = updatedStructures[key];
      const growthProgress = Math.max(
        0,
        Math.min(1, 1 - timer.timeLeft / tiles[timer.seedType].growthTime),
      );

      // Clear old plant blocks from the world
      if (structure.blocks) {
        structure.blocks.forEach((block) => {
          if (
            block.x >= 0 &&
            block.x < worldWidth &&
            block.y >= 0 &&
            block.y < worldHeight &&
            currentWorld.getTile(block.x, block.y) !== tiles.AIR
          ) {
            currentWorld.setTile(block.x, block.y, tiles.AIR);
          }
        });
      }

      // Generate new plant structure based on type and growth
      const [x, y] = key.split(",").map(Number);
      structure.blocks = generatePlantStructure(
        x,
        y,
        timer.seedType,
        growthProgress,
        tiles,
      );

      // Place the new plant blocks in the world
      structure.blocks.forEach((block) => {
        if (
          block.x >= 0 &&
          block.x < worldWidth &&
          block.y >= 0 &&
          block.y < worldHeight
        ) {
          currentWorld.setTile(block.x, block.y, block.tile);
        }
      });

      structuresChanged = true;
    }

    // Complete growth if timer has expired
    if (timer.timeLeft <= 0) {
      if (updatedStructures[key]) {
        updatedStructures[key].mature = true;
        updatedStructures[key].seedType = timer.seedType;
      }

      delete updatedTimers[key];

      timersChanged = true;
    }
  }

  // Update state if anything changed
  if (timersChanged) {
    growthTimers.set(updatedTimers);
  }

  if (structuresChanged) {
    plantStructures.set(updatedStructures);
  }
}

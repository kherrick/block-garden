import { extractSeeds, mapValuesToProvided } from "../misc/selectSeed.mjs";
import { generateWorld } from "../generate/world.mjs";
import { registerTreeStructures } from "../misc/registerTreeStructures.mjs";
import { WorldMap } from "../map/world.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import("../state/config/index.mjs").BiomeMap} BiomeMap */
/** @typedef {import("../state/config/index.mjs").TileMap} TileMap */

/**
 * @param {BiomeMap} biomes
 * @param {number} surfaceLevel
 * @param {number} tileSize
 * @param {TileMap} tiles
 * @param {number} worldHeight
 * @param {number} worldWidth
 * @param {Signal.State} worldSeed
 * @param {Signal.State} gameTime
 * @param {Signal.State} growthTimers
 * @param {Signal.State} plantStructures
 * @param {Signal.State} player
 * @param {Signal.State} seedInventory
 * @param {number} [newSeed=null]
 *
 * @returns {WorldMap}
 */
export function initNewWorld(
  biomes,
  surfaceLevel,
  tileSize,
  tiles,
  worldHeight,
  worldWidth,
  worldSeed,
  gameTime,
  growthTimers,
  plantStructures,
  player,
  seedInventory,
  newSeed = null,
) {
  let currentWorldSeed;

  if (newSeed !== null) {
    worldSeed.set(newSeed);

    currentWorldSeed = newSeed;
  } else {
    currentWorldSeed = worldSeed?.get();
  }

  const currentWorld = generateWorld(
    biomes,
    surfaceLevel,
    tiles,
    currentWorldSeed,
    worldHeight,
    worldWidth,
  );

  // Reset game state
  growthTimers.set({});
  gameTime.set(0);
  plantStructures.set(
    registerTreeStructures(currentWorld, worldWidth, worldHeight, tiles),
  );

  // Set initial seed inventory
  const defaultNumberOfInitialSeeds = 1;
  const initialSeedInventory = mapValuesToProvided(
    extractSeeds(tiles),
    defaultNumberOfInitialSeeds,
  );

  seedInventory.set(initialSeedInventory);

  // Find a good spawn location
  let spawnX = Math.floor(worldWidth / 2);
  let spawnY = Math.floor(surfaceLevel - 5);

  for (let x = spawnX - 25; x < spawnX + 25; x++) {
    for (let y = spawnY - 5; y < spawnY + 5; y++) {
      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        // Check if current position is air and the tile below is solid
        if (
          currentWorld.getTile(tileX, tileY) === tiles.AIR &&
          tileY + 1 < worldHeight &&
          currentWorld.getTile(tileX, tileY + 1) &&
          currentWorld.getTile(tileX, tileY + 1).solid // Check the solid property directly
        ) {
          // Also ensure there's enough vertical clearance (2-3 tiles high)
          let hasVerticalClearance = true;

          for (let checkY = tileY - 2; checkY <= tileY; checkY++) {
            if (
              checkY >= 0 &&
              currentWorld.getTile(tileX, checkY) !== tiles.AIR
            ) {
              hasVerticalClearance = false;

              break;
            }
          }

          if (hasVerticalClearance) {
            const updatedPlayer = {
              ...player.get(),
              x: x * tileSize,
              y: y * tileSize,
              velocityX: 0,
              velocityY: 0,
              lastDirection: 0,
            };

            player.set(updatedPlayer);
          }
        }
      }
    }
  }

  return currentWorld;
}

import { stringifyToLowerCase } from "../state/config/tiles.mjs";
import { updateState } from "../state/state.mjs";
import { getHarvestMap } from "./getHarvestMap.mjs";

/** @typedef {import('../state/config/tiles.mjs').TileDefinition} TileDefinition */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * Harvests a mature crop, giving player seeds and replacing tile with air.
 *
 * Grants 2-4 seeds based on random generation.
 *
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {TileDefinition} cropTile - The mature crop tile to harvest
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {Object} world - World object with setTile method
 * @param {number} x - X coordinate in tiles
 * @param {number} y - Y coordinate in tiles
 *
 * @returns {void}
 */
export function harvestCrop(shadow, cropTile, tiles, world, x, y) {
  const seedType = getHarvestMap(tiles)[cropTile.id];

  if (seedType) {
    // Give player 2-4 seeds when harvesting crops
    const seedsGained = 2 + Math.floor(Math.random() * 3);

    updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] + seedsGained,
    }));

    // Remove crop from world
    world.setTile(x, y, tiles.AIR);

    const message = `Harvested ${stringifyToLowerCase(seedType)} crop, gained ${seedsGained} seeds`;

    console.log(message);
    shadow.dispatchEvent(
      new CustomEvent("sprite-garden-toast", {
        detail: {
          message,
        },
      }),
    );
  }
}

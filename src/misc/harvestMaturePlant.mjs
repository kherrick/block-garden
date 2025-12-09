import { stringifyToLowerCase } from "../state/config/tiles.mjs";
import { updateState } from "../state/state.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */

/**
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {Signal.State} growthTimers growthTimers - Signal State with growth timer data
 * @param {Signal.State} plantStructures plantStructures - Signal State with plant structure data
 * @param {Object} structure - Plant structure object
 * @param {string} structureKey - Key for the structure in plantStructures
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {WorldMap} world - World with getTile and setTile methods
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 *
 * @returns {void}
 */
export function harvestMaturePlant(
  shadow,
  growthTimers,
  plantStructures,
  structure,
  structureKey,
  tiles,
  world,
  worldHeight,
  worldWidth,
) {
  if (structure.blocks) {
    // Blocks can be an array or an object depending on save format
    const blocksArray = Array.isArray(structure.blocks)
      ? structure.blocks
      : Object.values(structure.blocks);

    blocksArray.forEach((block) => {
      if (
        block.x >= 0 &&
        block.x < worldWidth &&
        block.y >= 0 &&
        block.y < worldHeight
      ) {
        world.setTile(block.x, block.y, tiles.AIR);
      }
    });
  }

  // Give seeds (and / or wood) when harvesting mature plant
  if (structure.seedType) {
    // 1-3 seeds
    const seedsGained = 1 + Math.floor(Math.random() * 3);

    updateState("seedInventory", (inv) => ({
      ...inv,
      [structure.seedType]: inv[structure.seedType] + seedsGained,
    }));

    let message = `Harvested mature ${stringifyToLowerCase(structure.seedType)}, gained ${seedsGained} seed${seedsGained > 1 ? "s" : ""}.`;

    // Check for a wood like structure
    const item = "WOOD";
    const drops = tiles[structure.seedType].drops;
    const shouldDrop = Array.isArray(drops)
      ? drops.some((item) => item.toLowerCase().includes(item.toLowerCase()))
      : drops.toLowerCase().includes(item.toLowerCase());

    // 0-3 wood
    const woodGained = shouldDrop ? 1 + Math.floor(Math.random() * 3) : 0;

    if (woodGained) {
      updateState("materialsInventory", (inv) => ({
        ...inv,
        [item]: inv[item] + woodGained,
      }));

      message = `${message} Gained ${woodGained} ${stringifyToLowerCase(item)}.`;
    }

    console.log(message);
    shadow.dispatchEvent(
      new CustomEvent("sprite-garden-toast", {
        detail: {
          message,
        },
      }),
    );
  }

  // Remove the plant structure and any associated timers
  const currentStructures = plantStructures.get();
  const updatedStructures = { ...currentStructures };
  const updatedTimers = { ...growthTimers.get() };

  delete updatedStructures[structureKey];
  delete updatedTimers[structureKey];

  plantStructures.set(updatedStructures);
  growthTimers.set(updatedTimers);
}

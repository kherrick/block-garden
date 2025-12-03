import { seedTileMap, stringifyToLowerCase } from "../state/config/tiles.mjs";
import { updateState } from "../state/state.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * Plants a seed at the specified world tile coordinates.
 *
 * Verifies farmable ground exists below and initializes crop growth.
 * Updates both the world tiles and growth timer state.
 *
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {Signal.State} growthTimers - State Signal tracking crop growth progress
 * @param {Signal.State} plantStructures - State Signal for complex plant structures
 * @param {Signal.State} seedInventory - State Signal for seed inventory counts
 * @param {string} seedType - Seed name (e.g., 'WHEAT', 'CARROT') to plant
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {WorldMap} world - World with getTile and setTile methods
 * @param {number} x - X coordinate in tiles
 * @param {number} y - Y coordinate in tiles
 *
 * @returns {void}
 */
export function plantSeed(
  shadow,
  growthTimers,
  plantStructures,
  seedInventory,
  seedType,
  tiles,
  world,
  x,
  y,
) {
  // Check if there's farmable ground below
  const belowTile = world.getTile(x, y + 1);
  if (!belowTile || !belowTile.farmable) {
    console.log(`Cannot plant at (${x}, ${y}) - no farmable ground below`);

    return; // Can't plant without farmable ground
  }

  let message;
  if (seedTileMap[seedType] && seedInventory[seedType] > 0) {
    // Update world with initial growing tile
    world.setTile(x, y, seedTileMap[seedType]);

    // Update seed inventory
    updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] - 1,
    }));

    // Set growth timer
    const growthKey = `${x},${y}`;

    // Initialize both timer and structure
    growthTimers.set({
      ...growthTimers.get(),
      [growthKey]: {
        timeLeft: tiles[seedType].growthTime,
        seedType: seedType,
      },
    });

    // Initialize plant structure
    plantStructures.set({
      ...plantStructures.get(),
      [growthKey]: {
        seedType: seedType,
        mature: false,
        blocks: [{ x, y, tile: seedTileMap[seedType] }], // Start with just the seed
        baseX: x,
        baseY: y,
      },
    });

    message = `Planted ${stringifyToLowerCase(seedType)} at (${x}, ${y}), ${seedInventory[seedType] - 1} seeds remaining`;
  } else {
    message = `Cannot plant ${stringifyToLowerCase(seedType)} - no seeds available or invalid seed type`;
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

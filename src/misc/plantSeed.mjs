import { updateState } from "../state/state.mjs";

/**
 * @param {any} growthTimers
 * @param {any} plantStructures
 * @param {any} seedInventory
 * @param {any} seedType
 * @param {any} tiles
 * @param {any} world
 * @param {any} x
 * @param {any} y
 *
 * @returns {void}
 */
export function plantSeed(
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

  const seedTileMap = {
    AGAVE: tiles.AGAVE_GROWING,
    BAMBOO: tiles.BAMBOO_GROWING,
    BERRY_BUSH: tiles.BERRY_BUSH_GROWING,
    BIRCH: tiles.BIRCH_GROWING,
    CACTUS: tiles.CACTUS_GROWING,
    CARROT: tiles.CARROT_GROWING,
    CORN: tiles.CORN_GROWING,
    FERN: tiles.FERN_GROWING,
    KELP: tiles.KELP_GROWING,
    LAVENDER: tiles.LAVENDER_GROWING,
    LOTUS: tiles.LOTUS_GROWING,
    MUSHROOM: tiles.MUSHROOM_GROWING,
    PINE_TREE: tiles.PINE_TREE_GROWING,
    PUMPKIN: tiles.PUMPKIN_GROWING,
    ROSE: tiles.ROSE_GROWING,
    SUNFLOWER: tiles.SUNFLOWER_GROWING,
    TULIP: tiles.TULIP_GROWING,
    WALNUT: tiles.TREE_GROWING,
    WHEAT: tiles.WHEAT_GROWING,
    WILLOW_TREE: tiles.WILLOW_TREE_GROWING,
  };

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

    console.log(
      `Planted ${seedType} at (${x}, ${y}), ${seedInventory[seedType] - 1} seeds remaining`,
    );
  } else {
    console.log(
      `Cannot plant ${seedType} - no seeds available or invalid seed type`,
    );
  }
}

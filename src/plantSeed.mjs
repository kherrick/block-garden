import { updateState } from "./state.mjs";

export function plantSeed({
  growthTimers,
  plantStructures,
  seedInventory,
  seedType,
  tiles,
  world,
  x,
  y,
}) {
  // Check if there's farmable ground below
  const belowTile = world.getTile(x, y + 1);
  if (!belowTile || !belowTile.farmable) {
    console.log(`Cannot plant at (${x}, ${y}) - no farmable ground below`);

    return; // Can't plant without farmable ground
  }

  const seedTileMap = {
    WHEAT: tiles.WHEAT_GROWING,
    CARROT: tiles.CARROT_GROWING,
    MUSHROOM: tiles.MUSHROOM_GROWING,
    CACTUS: tiles.CACTUS_GROWING,
    WALNUT: tiles.TREE_GROWING,
    BERRY_BUSH: tiles.BERRY_BUSH_GROWING,
    BAMBOO: tiles.BAMBOO_GROWING,
    SUNFLOWER: tiles.SUNFLOWER_GROWING,
    CORN: tiles.CORN_GROWING,
    PINE_TREE: tiles.PINE_TREE_GROWING,
    WILLOW_TREE: tiles.WILLOW_TREE_GROWING,
    FERN: tiles.FERN_GROWING,
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
      `Planted ${seedType} at (${x}, ${y}), ${
        seedInventory[seedType] - 1
      } seeds remaining`,
    );
  } else {
    console.log(
      `Cannot plant ${seedType} - no seeds available or invalid seed type`,
    );
  }
}

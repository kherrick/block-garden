import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

export function plantSeed(currentState, x, y, seedType, game, doc) {
  const { state, world, TILES } = currentState;

  // Check if there's farmable ground below
  const belowTile = world.getTile(x, y + 1);
  if (!belowTile || !belowTile.farmable) {
    console.log(`Cannot plant at (${x}, ${y}) - no farmable ground below`);
    return; // Can't plant without farmable ground
  }

  const seedTileMap = {
    WHEAT: TILES.WHEAT_GROWING,
    CARROT: TILES.CARROT_GROWING,
    MUSHROOM: TILES.MUSHROOM_GROWING,
    CACTUS: TILES.CACTUS_GROWING,
    WALNUT: TILES.TREE_GROWING,
  };

  if (seedTileMap[seedType] && state.seedInventory[seedType] > 0) {
    // Update world with initial growing tile
    const currentWorld = game.state.world.get();
    currentWorld.setTile(x, y, seedTileMap[seedType]);
    game.state.world.set(currentWorld);

    // Update seed inventory
    game.updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] - 1,
    }));

    // Set growth timer
    const growthKey = `${x},${y}`;
    const currentTimers = game.state.growthTimers.get();
    const currentStructures = game.state.plantStructures.get();

    // Initialize both timer and structure
    game.state.growthTimers.set({
      ...currentTimers,
      [growthKey]: {
        timeLeft: TILES[seedType].growthTime,
        seedType: seedType,
      },
    });

    // Initialize plant structure
    game.state.plantStructures.set({
      ...currentStructures,
      [growthKey]: {
        seedType: seedType,
        mature: false,
        blocks: [{ x, y, tile: seedTileMap[seedType] }], // Start with just the seed
        baseX: x,
        baseY: y,
      },
    });

    updateInventoryDisplay(doc, game.state);

    console.log(
      `Planted ${seedType} at (${x}, ${y}), ${
        game.state.seedInventory.get()[seedType]
      } seeds remaining`,
    );
  } else {
    console.log(
      `Cannot plant ${seedType} - no seeds available or invalid seed type`,
    );
  }
}

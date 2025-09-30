import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

export function harvestCrop(currentState, x, y, cropTile, game, doc) {
  const { TILES } = currentState;

  const harvestMap = {
    [TILES.WHEAT.id]: "WHEAT",
    [TILES.CARROT.id]: "CARROT",
    [TILES.MUSHROOM.id]: "MUSHROOM",
    [TILES.CACTUS.id]: "CACTUS",
    [TILES.WALNUT.id]: "WALNUT",
  };

  const seedType = harvestMap[cropTile.id];
  if (seedType) {
    // Give player 2-4 seeds when harvesting simple crops
    const seedsGained = 2 + Math.floor(Math.random() * 3);
    game.updateState("seedInventory", (inv) => ({
      ...inv,
      [seedType]: inv[seedType] + seedsGained,
    }));

    // Remove crop from world
    const currentWorld = game.state.world.get();
    currentWorld.setTile(x, y, TILES.AIR);
    game.state.world.set(currentWorld);

    // Remove from growth timers and plant structures (cleanup)
    const currentTimers = game.state.growthTimers.get();
    const currentStructures = game.state.plantStructures.get();

    const updatedTimers = { ...currentTimers };
    const updatedStructures = { ...currentStructures };

    delete updatedTimers[`${x},${y}`];
    delete updatedStructures[`${x},${y}`];

    game.state.growthTimers.set(updatedTimers);
    game.state.plantStructures.set(updatedStructures);

    updateInventoryDisplay(doc, game.state);

    console.log(
      `Harvested simple ${seedType} crop, gained ${seedsGained} seeds`,
    );
  }
}

export function createSaveState(gThis) {
  const world = gThis.spriteGarden.state.world.get();

  // Always convert to array format for saving
  let worldArray;
  if (world && typeof world.toArray === "function") {
    // OptimizedWorld - convert to array
    worldArray = world.toArray();
  } else if (Array.isArray(world)) {
    // Already array format
    worldArray = world;
  } else {
    // Fallback - create empty array
    console.log("Game is being saved as empty air.");
    const WORLD_WIDTH = gThis.spriteGarden.config.WORLD_WIDTH.get();
    const WORLD_HEIGHT = gThis.spriteGarden.config.WORLD_HEIGHT.get();

    worldArray = [];

    for (let x = 0; x < WORLD_WIDTH; x++) {
      worldArray[x] = [];

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        worldArray[x][y] = gThis.spriteGarden.config.TILES.AIR;
      }
    }
  }

  return {
    config: {
      version: gThis.spriteGarden.config.version.get(),
      worldSeed: gThis.spriteGarden.config.worldSeed.get(),
      currentResolution: gThis.spriteGarden.config.currentResolution.get(),
      canvasScale: gThis.spriteGarden.config.canvasScale.get(),
      TILE_SIZE: gThis.spriteGarden.config.TILE_SIZE.get(),
      WORLD_WIDTH: gThis.spriteGarden.config.WORLD_WIDTH.get(),
      WORLD_HEIGHT: gThis.spriteGarden.config.WORLD_HEIGHT.get(),
      SURFACE_LEVEL: gThis.spriteGarden.config.SURFACE_LEVEL.get(),
      GRAVITY: gThis.spriteGarden.config.GRAVITY.get(),
      FRICTION: gThis.spriteGarden.config.FRICTION.get(),
      MAX_FALL_SPEED: gThis.spriteGarden.config.MAX_FALL_SPEED.get(),
      fogMode: gThis.spriteGarden.config.fogMode.get(),
      breakMode: gThis.spriteGarden.config.breakMode.get(),
    },
    state: {
      exploredMap: gThis.spriteGarden.state.exploredMap.get(),
      seedInventory: gThis.spriteGarden.state.seedInventory.get(),
      materialsInventory: gThis.spriteGarden.state.materialsInventory.get(),
      selectedSeedType: gThis.spriteGarden.state.selectedSeedType.get(),
      selectedMaterialType: gThis.spriteGarden.state.selectedMaterialType.get(),
      gameTime: gThis.spriteGarden.state.gameTime.get(),
      growthTimers: gThis.spriteGarden.state.growthTimers.get(),
      plantStructures: gThis.spriteGarden.state.plantStructures.get(),
      seeds: gThis.spriteGarden.state.seeds.get(),
      viewMode: gThis.spriteGarden.state.viewMode.get(),
      player: gThis.spriteGarden.state.player.get(),
      world: worldArray, // Always save as array
      camera: gThis.spriteGarden.state.camera.get(),
    },
  };
}

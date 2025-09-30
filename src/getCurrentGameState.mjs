// Create game state object for passing to functional methods
export const getCurrentGameState = (gameState, gameConfig) => {
  return {
    state: {
      seedInventory: gameState.seedInventory.get(),
      selectedSeedType: gameState.selectedSeedType.get(),
      gameTime: gameState.gameTime.get(),
      growthTimers: gameState.growthTimers.get(),
      plantStructures: gameState.plantStructures.get(),
      seeds: gameState.seeds.get(),
      viewMode: gameState.viewMode.get(),
    },
    BIOMES: gameConfig.BIOMES,
    camera: gameState.camera.get(),
    FRICTION: gameConfig.FRICTION.get(),
    GRAVITY: gameConfig.GRAVITY.get(),
    MAX_FALL_SPEED: gameConfig.MAX_FALL_SPEED.get(),
    player: gameState.player.get(),
    SURFACE_LEVEL: gameConfig.SURFACE_LEVEL.get(),
    TILE_SIZE: gameConfig.TILE_SIZE.get(),
    TILES: gameConfig.TILES,
    WORLD_HEIGHT: gameConfig.WORLD_HEIGHT.get(),
    WORLD_WIDTH: gameConfig.WORLD_WIDTH.get(),
    world: gameState.world.get(),
    worldSeed: gameConfig.worldSeed.get(),
  };
};

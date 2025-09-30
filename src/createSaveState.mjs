export function createSaveState(gThis) {
  const world = gThis.spriteGarden.state.world.get();

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
      fogScale: gThis.spriteGarden.config.fogScale.get(),
      isFogScaled: gThis.spriteGarden.config.isFogScaled.get(),
      breakMode: gThis.spriteGarden.config.breakMode.get(),
    },
    state: {
      exploredMap: gThis.spriteGarden.state.exploredMap.toObject(),
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
      world: world.toArray(),
      camera: gThis.spriteGarden.state.camera.get(),
    },
  };
}

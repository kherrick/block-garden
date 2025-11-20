/**
 * @param {any} gThis
 *
 * @returns {{ config: { breakMode: any; canvasScale: any; currentResolution: any; fogMode: any; fogScale: any; FRICTION: any; GRAVITY: any; isFogScaled: any; MAX_FALL_SPEED: any; SURFACE_LEVEL: any; TILE_SIZE: any; version: any; WORLD_HEIGHT: any; WORLD_WIDTH: any; worldSeed: any; }; state: { camera: any; exploredMap: any; gameTime: any; growthTimers: any; materialsInventory: any; plantStructures: any; player: any; seedInventory: any; seeds: any; selectedMaterialType: any; selectedSeedType: any; viewMode: any; world: any;  }; }}
 */
export function createSaveState(gThis) {
  const state = gThis.spriteGarden.state;
  const config = gThis.spriteGarden.config;

  return {
    config: {
      breakMode: config.breakMode.get(),
      canvasScale: config.canvasScale.get(),
      currentResolution: config.currentResolution.get(),
      fogMode: config.fogMode.get(),
      fogScale: config.fogScale.get(),
      FRICTION: config.FRICTION.get(),
      GRAVITY: config.GRAVITY.get(),
      isFogScaled: config.isFogScaled.get(),
      MAX_FALL_SPEED: config.MAX_FALL_SPEED.get(),
      SURFACE_LEVEL: config.SURFACE_LEVEL.get(),
      TILE_SIZE: config.TILE_SIZE.get(),
      version: config.version.get(),
      WORLD_HEIGHT: config.WORLD_HEIGHT.get(),
      WORLD_WIDTH: config.WORLD_WIDTH.get(),
      worldSeed: config.worldSeed.get(),
    },
    state: {
      camera: state.camera.get(),
      exploredMap: state.exploredMap.get().toObject(),
      gameTime: state.gameTime.get(),
      growthTimers: state.growthTimers.get(),
      materialsInventory: state.materialsInventory.get(),
      plantStructures: state.plantStructures.get(),
      player: state.player.get(),
      seedInventory: state.seedInventory.get(),
      seeds: state.seeds.get(),
      selectedMaterialType: state.selectedMaterialType.get(),
      selectedSeedType: state.selectedSeedType.get(),
      viewMode: state.viewMode.get(),
      world: state.world.get().toArray(),
    },
  };
}

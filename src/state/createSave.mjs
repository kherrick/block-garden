/**
 * Creates a serializable snapshot of current game state and config.
 *
 * Extracts all Signal values to plain objects for save file storage.
 * Includes world data, player position, inventory, and game settings.
 *
 * @param {typeof globalThis} gThis - Global this or window object with spriteGarden property
 *
 * @returns {Object} Serializable save object with config and state properties
 */
export function createSaveState(gThis) {
  const state = gThis.spriteGarden.state;
  const config = gThis.spriteGarden.config;
  const plantStructures = state.plantStructures.get();

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
      plantStructures: Object.fromEntries(
        Object.entries(plantStructures).map(([plantLocation, plant]) => {
          if (typeof plant?.blocks === "object") {
            const plantBlockEntries = Object.entries(plant.blocks);

            return [
              plantLocation,
              {
                ...plant,
                blocks: Object.fromEntries(
                  plantBlockEntries.map(([key, plantBlocks]) => {
                    return [
                      key,
                      {
                        ...plantBlocks,
                        tile: plantBlocks.tile.id,
                      },
                    ];
                  }),
                ),
              },
            ];
          }

          return [plantLocation, { ...plant }];
        }),
      ),
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

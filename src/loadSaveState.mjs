import { Signal } from "../deps/signal.mjs";

import { initializeFog } from "./fogMap.mjs";
import { generateNewWorld } from "./generateWorld.mjs";
import { WorldMap } from "./worldMap.mjs";

export function loadSaveState(gThis, saveState) {
  const gameConfig = gThis.spriteGarden.config;
  const gameState = gThis.spriteGarden.state;

  // Restore config first
  for (const key in saveState.config) {
    if (gameConfig[key]?.set) {
      gThis.spriteGarden.setConfig(key, saveState.config[key]);
    }
  }

  // Restore state with special handling for seedInventory, worldMap and fogMap
  for (const key in saveState.state) {
    // Make sure seedInventory has latest seeds defined
    if (key === "seedInventory") {
      const seedInventory = saveState.state[key];
      if (seedInventory["WALNUT"] === undefined) {
        seedInventory["WALNUT"] = 0;
      }

      if (seedInventory["BERRY_BUSH"] === undefined) {
        seedInventory["BERRY_BUSH"] = 0;
      }

      if (seedInventory["BAMBOO"] === undefined) {
        seedInventory["BAMBOO"] = 0;
      }

      if (seedInventory["SUNFLOWER"] === undefined) {
        seedInventory["SUNFLOWER"] = 0;
      }

      if (seedInventory["CORN"] === undefined) {
        seedInventory["CORN"] = 0;
      }

      if (seedInventory["PINE_TREE"] === undefined) {
        seedInventory["PINE_TREE"] = 0;
      }

      if (seedInventory["WILLOW_TREE"] === undefined) {
        seedInventory["WILLOW_TREE"] = 0;
      }

      if (seedInventory["FERN"] === undefined) {
        seedInventory["FERN"] = 0;
      }
    }

    const worldHeight = saveState.config.WORLD_HEIGHT;
    const worldWidth = saveState.config.WORLD_WIDTH;

    // convert explored map data
    if (key === "exploredMap") {
      initializeFog({
        fog: null,
        isFogScaled: new Signal.State(saveState.config.isFogScaled),
        tiles: saveState.config.tiles,
        worldHeight,
        worldWidth,
        exploredMap: saveState.state.exploredMap,
      });
    }

    // convert world map data
    if (key === "world") {
      const worldData = saveState.state[key];

      if (worldData && Array.isArray(worldData) && worldData.length > 0) {
        console.log(`Converting world: ${worldWidth}x${worldHeight}`);

        // Create WorldMap with proper configuration and convert the world data
        const worldMap = WorldMap.fromArray(worldData, worldWidth, worldHeight);

        // get tiles from config
        const tiles = gameConfig.TILES;

        // Verify the conversion
        let tileCount = 0;
        for (let x = 0; x < worldWidth; x++) {
          for (let y = 0; y < worldHeight; y++) {
            const tile = worldMap.getTile(x, y);

            if (tile && tile !== tiles.AIR) {
              tileCount++;
            }
          }
        }

        console.log(`Converted world contains ${tileCount} non-air tiles`);

        gameConfig.isFogScaled.set(false);
        gameState.world.set(worldMap);

        console.log("World converted successfully");
      } else {
        console.error("Invalid world data in save state:", worldData);

        // Generate new world as fallback
        const currentWorld = generateNewWorld({
          biomes: gameConfig.BIOMES,
          gameTime: gameState.gameTime,
          growthTimers: gameState.growthTimers,
          plantStructures: gameState.plantStructures,
          player: gameState.player,
          seedInventory: gameState.seedInventory,
          surfaceLevel: gameConfig.SURFACE_LEVEL.get(),
          tiles: gameConfig.TILES,
          tileSize: gameConfig.TILE_SIZE.get(),
          worldHeight: gameConfig.WORLD_HEIGHT.get(),
          worldWidth: gameConfig.WORLD_WIDTH.get(),
          worldSeed: gameConfig.worldSeed,
        });

        gameState.world.set(currentWorld);
      }
    } else if (gameState[key]?.set) {
      gThis.spriteGarden.setState(key, saveState.state[key]);
    }
  }

  console.log("Save state loaded successfully");
}

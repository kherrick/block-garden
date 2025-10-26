import { resizeCanvas } from "../util/resizeCanvas.mjs";

import { FogMap } from "../map/fog.mjs";
import { WorldMap } from "../map/world.mjs";

export function loadSaveState(gThis, saveState) {
  const gameConfig = gThis.spriteGarden.config;
  const gameState = gThis.spriteGarden.state;

  // Restore config
  for (const key in saveState.config) {
    if (key === "currentResolution") {
      continue;
    }

    if (key === "isFogScaled") {
      continue;
    }

    if (gameConfig[key]?.set) {
      gThis.spriteGarden.setConfig(key, saveState.config[key]);
    }
  }

  const worldHeight = saveState.config.WORLD_HEIGHT;
  const worldWidth = saveState.config.WORLD_WIDTH;

  // Restore state
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

      continue;
    }

    // convert explored map data
    if (key === "exploredMap") {
      let fogMap = {};

      const existingMap = saveState.state.exploredMap;
      if (existingMap && Object.keys(existingMap).length > 0) {
        fogMap = FogMap.fromObject(existingMap, worldWidth, worldHeight);
      }

      gameState.exploredMap.set(fogMap);

      continue;
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

        gameState.world.set(worldMap);

        console.log("World converted successfully");
      } else {
        console.error("Invalid world data in save state:", worldData);
      }

      continue;
    }

    if (gameState[key]?.set) {
      gThis.spriteGarden.setState(key, saveState.state[key]);
    }
  }

  console.log("Save state loaded successfully");

  // Force canvas resize to ensure proper coordinate mapping
  resizeCanvas(gThis.document, gameConfig);
}

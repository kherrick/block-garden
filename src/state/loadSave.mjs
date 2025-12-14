import { getCustomProperties } from "../util/colors/getCustomProperties.mjs";

import { FogMap } from "../map/fog.mjs";
import { WorldMap } from "../map/world.mjs";
import { getTileById } from "./config/tiles.mjs";
import { base64toBlob } from "../util/conversion.mjs";
import { extractAttachments } from "../util/extractAttachments.mjs";
import { extractJsonFromPng } from "../util/canvasToPngWithState.mjs";

/**
 * Restores game state and config from a save file.
 *
 * Reconstructs complex objects like world maps and fog maps from serialized data.
 * Updates all Signal values to restore previous game state.
 *
 * @param {typeof globalThis} gThis - Global this or window object with spriteGarden property
 * @param {ShadowRoot} shadow - Shadow root for canvas resizing
 * @param {Object} state - Save state object created by createSaveState
 *
 * @returns {Promise<void>}
 */
export async function loadSaveState(gThis, shadow, state) {
  let saveState = state;

  // handle loading pdfs
  if (saveState?.type === "pdf") {
    const blob = base64toBlob(gThis, saveState.contents, "application/pdf");

    const [results] = await extractAttachments(
      new File([blob], "sprite-garden-game-card.png"),
    );

    saveState = JSON.parse(await extractJsonFromPng(new Blob([results.data])));
  }

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
      const savedSeedInventory = saveState.state[key];

      for (const currentSeedType in gameState.seedInventory.get()) {
        if (savedSeedInventory[currentSeedType] === undefined) {
          savedSeedInventory[currentSeedType] = 0;
        }
      }

      // Set the seed inventory state
      gameState.seedInventory.set(savedSeedInventory);
      continue;
    }

    // Make sure materialsInventory has latest materials defined
    if (key === "materialsInventory") {
      const savedMaterialsInventory = saveState.state[key];

      for (const currentMaterialType in gameState.materialsInventory.get()) {
        if (savedMaterialsInventory[currentMaterialType] === undefined) {
          savedMaterialsInventory[currentMaterialType] = 0;
        }
      }

      // Set the materials inventory state
      gameState.materialsInventory.set(savedMaterialsInventory);
      continue;
    }

    if (key === "plantStructures") {
      const savedPlants = saveState.state.plantStructures;
      const tiles = gameConfig.TILES;

      const reconstructedPlants = Object.fromEntries(
        Object.entries(savedPlants).map(([location, plant]) => [
          location,
          {
            ...plant,
            blocks: Object.fromEntries(
              Object.entries(plant.blocks).map(([key, block]) => {
                let tile = tiles.AIR;

                // support both full object
                if (typeof block.tile === "object") {
                  tile = block.tile;
                  // and lookup by number
                } else if (typeof block.tile === "number") {
                  const matchingTile = getTileById(tiles, block.tile);
                  if (matchingTile) {
                    tile = matchingTile;
                  }
                }

                return [key, { ...block, tile }];
              }),
            ),
          },
        ]),
      );

      gameState.plantStructures.set(reconstructedPlants);
      continue;
    }

    // convert explored map data
    if (key === "exploredMap") {
      const existingMap = saveState.state.exploredMap;
      const colors = getCustomProperties(gThis, shadow);

      let fogMap;
      if (existingMap && Object.keys(existingMap).length > 0) {
        fogMap = FogMap.fromObject(
          existingMap,
          worldWidth,
          worldHeight,
          colors,
        );
      } else {
        fogMap = new FogMap(worldWidth, worldHeight, colors);
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

  // "Reset" to enable updated state / config
  shadow.dispatchEvent(new CustomEvent("sprite-garden-reset"));
}

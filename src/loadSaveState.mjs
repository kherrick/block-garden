import { initializeFog } from "./fogMap.mjs";
import { generateNewWorld } from "./generateWorld.mjs";
import { WorldMap } from "./worldMap.mjs";

export function loadSaveState(gThis, saveState) {
  // Restore config first
  for (const key in saveState.config) {
    if (gThis.spriteGarden.config[key]?.set) {
      gThis.spriteGarden.setConfig(key, saveState.config[key]);
    }
  }

  // Restore state with special handling for worldMap and fogMap
  for (const key in saveState.state) {
    if (key === "exploredMap") {
      initializeFog(saveState.state.exploredMap);
    }

    if (key === "world") {
      const worldData = saveState.state[key];

      if (worldData && Array.isArray(worldData) && worldData.length > 0) {
        const worldWidth = saveState.config.WORLD_WIDTH;
        const worldHeight = saveState.config.WORLD_HEIGHT;

        console.log(`Converting world: ${worldWidth}x${worldHeight}`);

        // Create WorldMap with proper configuration and convert the world data
        const worldMap = WorldMap.fromArray(worldData, worldWidth, worldHeight);

        // get tiles from config
        const tiles = gThis.spriteGarden.config.TILES;

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

        gThis.spriteGarden.config.isFogScaled.set(false);
        gThis.spriteGarden.state.world.set(worldMap);

        console.log("World converted successfully");
      } else {
        console.error("Invalid world data in save state:", worldData);

        // Generate new world as fallback
        generateNewWorld(gThis.document);
      }
    } else if (gThis.spriteGarden.state[key]?.set) {
      gThis.spriteGarden.setState(key, saveState.state[key]);
    }
  }

  console.log("Save state loaded successfully");
}

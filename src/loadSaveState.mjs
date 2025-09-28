import { generateNewWorld } from "./generateWorld.mjs";
import { OptimizedWorld } from "./optimizedWorld.mjs";

export function loadSaveState(gThis, saveState) {
  // Restore config first
  for (const key in saveState.config) {
    if (gThis.spriteGarden.config[key]?.set) {
      gThis.spriteGarden.setConfig(key, saveState.config[key]);
    }
  }

  // Restore state with special handling for world
  for (const key in saveState.state) {
    if (key === "world") {
      const worldData = saveState.state[key];

      if (worldData && Array.isArray(worldData) && worldData.length > 0) {
        // Convert array to OptimizedWorld
        const WORLD_WIDTH = gThis.spriteGarden.config.WORLD_WIDTH.get();
        const WORLD_HEIGHT = gThis.spriteGarden.config.WORLD_HEIGHT.get();
        const TILES = gThis.spriteGarden.config.TILES;

        console.log(`Converting world: ${WORLD_WIDTH}x${WORLD_HEIGHT}`);

        // Create OptimizedWorld with proper configuration and convert the world data
        const optimizedWorld = OptimizedWorld.fromArray(worldData, WORLD_WIDTH, WORLD_HEIGHT);

        // Verify the conversion
        let tileCount = 0;
        for (let x = 0; x < WORLD_WIDTH; x++) {
          for (let y = 0; y < WORLD_HEIGHT; y++) {
            const tile = optimizedWorld.getTile(x, y);

            if (tile && tile !== TILES.AIR) {
              tileCount++;
            }
          }
        }

        console.log(`Converted world contains ${tileCount} non-air tiles`);

        gThis.spriteGarden.state.world.set(optimizedWorld);

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

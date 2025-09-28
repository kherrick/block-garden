import { configSignals, stateSignals } from "./state.mjs";
import { generateCaves } from "./generateCaves.mjs";
import { generateHeightMap } from "./generateHeightMap.mjs";
import { generateWaterSources, simulateWaterPhysics } from "./waterPhysics.mjs";
import { getBiome } from "./getBiome.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { OptimizedWorld } from "./optimizedWorld.mjs";
import { resetMapFog } from "./mapFog.mjs";
import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";
import { updateUI } from "./updateUI.mjs";
import { isSolid } from "./isSolid.mjs";

// Generate world
export function generateWorld(doc) {
  const BIOMES = configSignals.BIOMES;
  const SURFACE_LEVEL = configSignals.SURFACE_LEVEL.get();
  const TILES = configSignals.TILES;
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const worldSeed = configSignals.worldSeed.get();

  console.log(`Generating world with seed: ${worldSeed}`);

  // Initialize world
  const world = new OptimizedWorld(WORLD_WIDTH, WORLD_HEIGHT);

  // Generate seeded height map
  const heights = generateHeightMap(WORLD_WIDTH, SURFACE_LEVEL, worldSeed);

  // Generate terrain based on height map and biomes
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const biome = getBiome(x, BIOMES, worldSeed) || BIOMES.FOREST;
    const surfaceHeight = heights[x];

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (y > surfaceHeight) {
        const depth = y - surfaceHeight;

        if (depth < 3) {
          world.setTile(x, y, biome.subTile);
        } else if (depth < 15) {
          if (Math.random() < 0.1) {
            world.setTile(x, y, TILES.COAL);
          } else {
            world.setTile(x, y, TILES.STONE);
          }
        } else if (depth < 30) {
          if (Math.random() < 0.05) {
            world.setTile(x, y, TILES.IRON);
          } else if (Math.random() < 0.02) {
            world.setTile(x, y, TILES.GOLD);
          } else {
            world.setTile(x, y, TILES.STONE);
          }
        } else if (y > WORLD_HEIGHT - 5) {
          world.setTile(x, y, TILES.BEDROCK);
        } else {
          if (Math.random() < 0.01) {
            world.setTile(x, y, TILES.LAVA);
          } else {
            world.setTile(x, y, TILES.STONE);
          }
        }
      } else if (y === surfaceHeight) {
        world.setTile(x, y, biome.surfaceTile);
      }
    }

    // Generate trees
    if (biome.trees && Math.random() < 0.1) {
      const treeHeight = 3 + Math.floor(Math.random() * 2);

      for (let i = 0; i < treeHeight; i++) {
        const y = surfaceHeight - i - 1;

        if (y >= 0) {
          if (i < treeHeight - 1) {
            world.setTile(x, y, TILES.TREE_TRUNK);
          } else {
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (
                  nx >= 0 &&
                  nx < WORLD_WIDTH &&
                  ny >= 0 &&
                  ny < WORLD_HEIGHT
                ) {
                  if (world.getTile(nx, ny) === TILES.AIR) {
                    world.setTile(nx, ny, TILES.TREE_LEAVES);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Generate natural crops
    if (biome.crops.length > 0 && Math.random() < 0.05) {
      const crop = biome.crops[Math.floor(Math.random() * biome.crops.length)];
      const y = surfaceHeight - 1;

      if (y >= 0 && world.getTile(x, y) === TILES.AIR) {
        world.setTile(x, y, crop);

        // Add to inventory when found
        const cropToSeed = {
          [TILES.WHEAT.id]: "WHEAT",
          [TILES.CARROT.id]: "CARROT",
          [TILES.MUSHROOM.id]: "MUSHROOM",
          [TILES.CACTUS.id]: "CACTUS",
        };
        const seedType = cropToSeed[crop.id];
        if (seedType) {
          globalThis.spriteGarden.updateState("seedInventory", (inv) => ({
            ...inv,
            [seedType]: (inv && inv[seedType] ? inv[seedType] : 0) + 2,
          }));
        }
      }
    }
  }

  // Set the world in state
  stateSignals.world.set(world);

  // Generate caves with seeded randomization
  generateCaves();

  // Generate water sources using seeded noise
  const currentWorld = stateSignals.world.get();
  generateWaterSources(
    currentWorld,
    heights,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    SURFACE_LEVEL,
    TILES,
    worldSeed,
  );

  // Simulate water physics to make water settle naturally
  console.log("Simulating water physics...");
  simulateWaterPhysics(currentWorld, WORLD_WIDTH, WORLD_HEIGHT, TILES, 30);

  // Update the world state with settled water
  stateSignals.world.set(currentWorld);

  console.log("World generation complete!");

  updateInventoryDisplay(doc, stateSignals);
  updateUI(doc, getCurrentGameState(stateSignals, configSignals));
}

// Utility functions
export function generateNewWorld(doc, newSeed = null) {
  if (newSeed !== null) {
    configSignals.worldSeed.set(newSeed.toString());
  }

  generateWorld(doc);

  // Reset game state
  stateSignals.growthTimers.set({});
  stateSignals.plantStructures.set({});
  stateSignals.gameTime.set(0);

  // Reset map fog for new world
  resetMapFog();

  // Give player starting seeds
  stateSignals.seedInventory.set({
    WHEAT: 5,
    CARROT: 3,
    MUSHROOM: 1,
    CACTUS: 2,
  });

  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const SURFACE_LEVEL = configSignals.SURFACE_LEVEL.get();
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const TILES = configSignals.TILES;
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const player = stateSignals.player.get();
  const world = stateSignals.world.get();

  // Find a good spawn location
  let spawnX = Math.floor(WORLD_WIDTH / 2);
  let spawnY = Math.floor(SURFACE_LEVEL - 5);

  for (let x = spawnX - 25; x < spawnX + 25; x++) {
    for (let y = spawnY - 5; y < spawnY + 5; y++) {
      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (
          world.getTile(tileX, tileY) === TILES.AIR &&
          world.getTile(tileX, tileY + 1) &&
          isSolid(world.getTile(tileX, tileY + 1))
        ) {
          const updatedPlayer = {
            ...player,
            x: x * TILE_SIZE,
            y: y * TILE_SIZE,
            velocityX: 0,
            velocityY: 0,
            lastDirection: 0,
          };
          stateSignals.player.set(updatedPlayer);
          updateInventoryDisplay(doc, stateSignals);
          return;
        }
      }
    }
  }

  // Fallback spawn location
  const updatedPlayer = {
    ...player,
    x: spawnX * TILE_SIZE,
    y: spawnY * TILE_SIZE,
    velocityX: 0,
    velocityY: 0,
    lastDirection: 0,
  };
  stateSignals.player.set(updatedPlayer);
  updateInventoryDisplay(doc, stateSignals);
}

import { addMossToCaves } from "./generateMoss.mjs";
import { gameConfig, gameState, updateState } from "./state.mjs";
import { generateCaves } from "./generateCaves.mjs";
import { generateHeightMap } from "./generateHeightMap.mjs";
import { generateWaterSources, simulateWaterPhysics } from "./waterPhysics.mjs";
import { getBiome } from "./getBiome.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { WorldMap } from "./worldMap.mjs";
import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";
import { updateUI } from "./updateUI.mjs";
import { initializeFog } from "./fogMap.mjs";

function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate world
export function generateWorld(doc) {
  const biomes = gameConfig.BIOMES;
  const surfaceLevel = gameConfig.SURFACE_LEVEL.get();
  const tiles = gameConfig.TILES;
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const worldSeed = gameConfig.worldSeed.get();

  console.log(`Generating world with seed: ${worldSeed}`);

  // Initialize world
  const world = new WorldMap(worldWidth, worldHeight);

  // Generate seeded height map
  const heights = generateHeightMap(worldWidth, surfaceLevel, worldSeed);

  // Generate terrain based on height map and biomes
  for (let x = 0; x < worldWidth; x++) {
    const biome = getBiome(x, biomes, worldSeed) || biomes.FOREST;
    const surfaceHeight = heights[x];

    for (let y = 0; y < worldHeight; y++) {
      if (y > surfaceHeight) {
        const depth = y - surfaceHeight;

        // Surface layer (grass/snow) - deeper for these specific tiles
        if (depth < 2) {
          if (
            biome.surfaceTile === tiles.GRASS ||
            biome.surfaceTile === tiles.SNOW
          ) {
            world.setTile(x, y, biome.surfaceTile);
          } else {
            world.setTile(x, y, biome.subTile);
          }
        } else if (depth < getRandomInRange(20, 50)) {
          // Sub-surface layer
          if (Math.random() < 0.1) {
            world.setTile(x, y, tiles.COAL);
          } else if (Math.random() < 0.95) {
            world.setTile(x, y, biome.subTile);
          } else {
            world.setTile(x, y, tiles.STONE);
          }
        } else if (depth < getRandomInRange(50, 90)) {
          if (Math.random() < 0.05) {
            world.setTile(x, y, tiles.IRON);
          } else if (Math.random() < 0.02) {
            world.setTile(x, y, tiles.GOLD);
          } else {
            world.setTile(x, y, tiles.STONE);
          }
        } else if (y > worldHeight - 2) {
          world.setTile(x, y, tiles.BEDROCK);
        } else if (y > worldHeight - 4) {
          world.setTile(x, y, tiles.LAVA);
        } else {
          if (Math.random() < 0.01) {
            world.setTile(x, y, tiles.LAVA);
          } else {
            world.setTile(x, y, tiles.STONE);
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
            world.setTile(x, y, tiles.TREE_TRUNK);
          } else {
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < worldWidth && ny >= 0 && ny < worldHeight) {
                  if (world.getTile(nx, ny) === tiles.AIR) {
                    world.setTile(nx, ny, tiles.TREE_LEAVES);
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

      if (y >= 0 && world.getTile(x, y) === tiles.AIR) {
        world.setTile(x, y, crop);

        // Add to inventory when found
        const cropToSeed = {
          [tiles.WHEAT.id]: "WHEAT",
          [tiles.CARROT.id]: "CARROT",
          [tiles.MUSHROOM.id]: "MUSHROOM",
          [tiles.CACTUS.id]: "CACTUS",
        };
        const seedType = cropToSeed[crop.id];
        if (seedType) {
          updateState("seedInventory", (inv) => ({
            ...inv,
            [seedType]: (inv && inv[seedType] ? inv[seedType] : 0) + 2,
          }));
        }
      }
    }
  }

  // Set the world in state
  gameState.world.set(world);

  // Generate caves with seeded randomization
  generateCaves();

  // Add moss to cave surfaces after cave generation
  addMossToCaves(gameState.world.get(), worldWidth, worldHeight, tiles);

  // Generate water sources using seeded noise
  const currentWorld = gameState.world.get();
  generateWaterSources(
    currentWorld,
    heights,
    worldWidth,
    worldHeight,
    surfaceLevel,
    tiles,
    worldSeed,
  );

  // Simulate water physics to make water settle naturally
  console.log("Simulating water physics...");
  simulateWaterPhysics(currentWorld, worldWidth, worldHeight, tiles, 30);

  // Update the world state with settled water
  gameState.world.set(currentWorld);

  console.log("World generation complete!");

  updateInventoryDisplay(doc, gameState);
  updateUI(doc, getCurrentGameState(gameState, gameConfig));
}

// Utility functions
export function generateNewWorld(doc, newSeed = null) {
  if (newSeed !== null) {
    gameConfig.worldSeed.set(newSeed.toString());
  }

  generateWorld(doc);

  // Reset game state
  gameState.growthTimers.set({});
  gameState.plantStructures.set({});
  gameState.gameTime.set(0);

  // Give player starting seeds
  gameState.seedInventory.set({
    WHEAT: 5,
    CARROT: 3,
    MUSHROOM: 1,
    CACTUS: 2,
  });

  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const surfaceLevel = gameConfig.SURFACE_LEVEL.get();
  const tileSize = gameConfig.TILE_SIZE.get();
  const tiles = gameConfig.TILES;
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const player = gameState.player.get();
  const world = gameState.world.get();

  initializeFog();

  // Find a good spawn location
  let spawnX = Math.floor(worldWidth / 2);
  let spawnY = Math.floor(surfaceLevel - 5);

  for (let x = spawnX - 25; x < spawnX + 25; x++) {
    for (let y = spawnY - 5; y < spawnY + 5; y++) {
      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        // Check if current position is air and the tile below is solid
        if (
          world.getTile(tileX, tileY) === tiles.AIR &&
          tileY + 1 < worldHeight &&
          world.getTile(tileX, tileY + 1) &&
          world.getTile(tileX, tileY + 1).solid // Check the solid property directly
        ) {
          // Also ensure there's enough vertical clearance (2-3 tiles high)
          let hasVerticalClearance = true;

          for (let checkY = tileY - 2; checkY <= tileY; checkY++) {
            if (checkY >= 0 && world.getTile(tileX, checkY) !== tiles.AIR) {
              hasVerticalClearance = false;

              break;
            }
          }

          if (hasVerticalClearance) {
            const updatedPlayer = {
              ...player,
              x: x * tileSize,
              y: y * tileSize,
              velocityX: 0,
              velocityY: 0,
              lastDirection: 0,
            };

            gameState.player.set(updatedPlayer);

            updateInventoryDisplay(doc, gameState);
            return;
          }
        }
      }
    }
  }

  gameState.player.set(updatedPlayer);
  updateInventoryDisplay(doc, gameState);
}

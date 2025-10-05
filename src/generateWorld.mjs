import { addMossToCaves } from "./generateMoss.mjs";
import { getCropToSeed } from "./cropToSeed.mjs";
import { gameConfig, gameState, updateState } from "./state.mjs";
import { generateCaves } from "./generateCaves.mjs";
import { generateHeightMap } from "./generateHeightMap.mjs";
import { generateWaterSources, simulateWaterPhysics } from "./waterPhysics.mjs";
import { getBiome } from "./getBiome.mjs";
import { getRandomSeed } from "./getRandomSeed.mjs";
import { initializeFog } from "./fogMap.mjs";
import { WorldMap } from "./worldMap.mjs";

// Generate world
export function generateWorld({
  biomes,
  surfaceLevel,
  tiles,
  tileSize,
  worldSeed,
  worldHeight,
  worldWidth,
}) {
  console.log(`Generating world with seed: ${worldSeed}`);

  // Initialize world
  const currentWorld = new WorldMap(worldWidth, worldHeight);

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
            currentWorld.setTile(x, y, biome.surfaceTile);
          } else {
            currentWorld.setTile(x, y, biome.subTile);
          }
        } else if (depth < getRandomSeed(20, 50)) {
          // Sub-surface layer
          if (Math.random() < 0.1) {
            currentWorld.setTile(x, y, tiles.COAL);
          } else if (Math.random() < 0.95) {
            currentWorld.setTile(x, y, biome.subTile);
          } else {
            currentWorld.setTile(x, y, tiles.STONE);
          }
        } else if (depth < getRandomSeed(50, 90)) {
          if (Math.random() < 0.05) {
            currentWorld.setTile(x, y, tiles.IRON);
          } else if (Math.random() < 0.02) {
            currentWorld.setTile(x, y, tiles.GOLD);
          } else {
            currentWorld.setTile(x, y, tiles.STONE);
          }
        } else if (y > worldHeight - 2) {
          currentWorld.setTile(x, y, tiles.BEDROCK);
        } else if (y > worldHeight - 4) {
          currentWorld.setTile(x, y, tiles.LAVA);
        } else {
          if (Math.random() < 0.01) {
            currentWorld.setTile(x, y, tiles.LAVA);
          } else {
            currentWorld.setTile(x, y, tiles.STONE);
          }
        }
      } else if (y === surfaceHeight) {
        currentWorld.setTile(x, y, biome.surfaceTile);
      }
    }

    // Generate trees
    if (biome.trees && Math.random() < 0.025) {
      const treeHeight = getRandomSeed(3, 5);
      const baseY = surfaceHeight;
      const plantX = x;
      // Base of the tree (where it would be planted)
      const plantY = baseY - 1;

      // Collect all tree blocks
      const treeBlocks = [];

      // Build trunk
      for (let i = 0; i < treeHeight; i++) {
        const y = baseY - i - 1;
        if (y >= 0) {
          currentWorld.setTile(x, y, tiles.TREE_TRUNK);

          treeBlocks.push({ x, y, tile: tiles.TREE_TRUNK });
        }
      }

      // Build leaf canopy at top
      const topY = baseY - treeHeight;
      const leafRadius = 3;

      for (let dx = -leafRadius; dx <= leafRadius; dx++) {
        for (let dy = -leafRadius; dy <= 1; dy++) {
          const leafX = x + dx;
          const leafY = topY + dy;

          // Create circular canopy shape
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= leafRadius && dy <= 0) {
            if (
              leafX >= 0 &&
              leafX < worldWidth &&
              leafY >= 0 &&
              leafY < worldHeight
            ) {
              // Check if it's not a trunk position
              const isTrunkPosition =
                leafX === x && leafY >= topY && leafY < baseY;
              if (
                !isTrunkPosition &&
                currentWorld.getTile(leafX, leafY) === tiles.AIR
              ) {
                currentWorld.setTile(leafX, leafY, tiles.TREE_LEAVES);
                treeBlocks.push({
                  x: leafX,
                  y: leafY,
                  tile: tiles.TREE_LEAVES,
                });
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

      if (y >= 0 && currentWorld.getTile(x, y) === tiles.AIR) {
        currentWorld.setTile(x, y, crop);

        // Add to inventory when found
        const seedType = getCropToSeed(tiles)[crop.id];
        if (seedType) {
          updateState("seedInventory", (inv) => ({
            ...inv,
            [seedType]: (inv && inv[seedType] ? inv[seedType] : 0) + 2,
          }));
        }
      }
    }
  }

  // Generate caves with seeded randomization
  generateCaves({
    surfaceLevel,
    tiles,
    world: currentWorld,
    worldHeight,
    worldWidth,
  });

  // Add moss to cave surfaces after cave generation
  addMossToCaves({
    world: currentWorld,
    worldWidth,
    worldHeight,
    tiles,
  });

  // Generate water sources using seeded noise
  generateWaterSources({
    world: currentWorld,
    heights,
    worldWidth,
    worldHeight,
    surfaceLevel,
    tiles,
    seed: worldSeed,
  });

  // Simulate water physics to make water settle naturally
  simulateWaterPhysics({
    world: currentWorld,
    worldWidth,
    worldHeight,
    tiles,
    tileSize,
    iterations: 30,
  });

  console.log("World generation complete!");

  return currentWorld;
}

function registerTreeStructures(world, worldWidth, worldHeight, tiles) {
  const structures = {};

  // Scan the world for trees and register them
  for (let x = 0; x < worldWidth; x++) {
    for (let y = 0; y < worldHeight; y++) {
      const tile = world.getTile(x, y);

      // Look for tree trunks that have ground below and aren't already part of a structure
      if (tile === tiles.TREE_TRUNK) {
        const belowTile = world.getTile(x, y + 1);
        const aboveTile = world.getTile(x, y - 1);

        // This is the base of a tree if it has solid ground below and trunk/air above
        if (belowTile && belowTile.solid && belowTile !== tiles.TREE_TRUNK) {
          const plantKey = `${x},${y}`;

          // Collect all blocks for this tree
          const treeBlocks = [];

          // Collect trunk blocks going up
          let checkY = y;
          while (checkY >= 0 && world.getTile(x, checkY) === tiles.TREE_TRUNK) {
            treeBlocks.push({ x, y: checkY, tile: tiles.TREE_TRUNK });
            checkY--;
          }

          // Collect leaf blocks around the top
          const topY = checkY + 1; // Last trunk position
          const leafRadius = 3; // Search radius

          for (let dx = -leafRadius; dx <= leafRadius; dx++) {
            for (let dy = -leafRadius; dy <= leafRadius; dy++) {
              const leafX = x + dx;
              const leafY = topY + dy;

              if (
                leafX >= 0 &&
                leafX < worldWidth &&
                leafY >= 0 &&
                leafY < worldHeight
              ) {
                if (world.getTile(leafX, leafY) === tiles.TREE_LEAVES) {
                  treeBlocks.push({
                    x: leafX,
                    y: leafY,
                    tile: tiles.TREE_LEAVES,
                  });
                }
              }
            }
          }

          // Register this tree structure
          structures[plantKey] = {
            seedType: "WALNUT",
            mature: true,
            blocks: treeBlocks,
            baseX: x,
            baseY: y,
          };
        }
      }
    }
  }

  return structures;
}

// Utility functions
export function generateNewWorld({
  biomes,
  gameTime,
  growthTimers,
  plantStructures,
  player,
  seedInventory,
  surfaceLevel,
  tiles,
  tileSize,
  worldSeed,
  worldHeight,
  worldWidth,
  newSeed = null,
}) {
  let currentWorldSeed;

  if (newSeed !== null) {
    worldSeed.set(newSeed.toString());
    currentWorldSeed = newSeed;
  } else {
    currentWorldSeed = worldSeed.get();
  }

  const currentWorld = generateWorld({
    biomes,
    surfaceLevel,
    tiles,
    tileSize,
    worldSeed: currentWorldSeed,
    worldHeight,
    worldWidth,
  });

  // Reset game state
  growthTimers.set({});
  gameTime.set(0);
  plantStructures.set(
    registerTreeStructures(currentWorld, worldWidth, worldHeight, tiles),
  );

  // set seed inventory
  seedInventory.set({
    WHEAT: 1,
    CARROT: 1,
    MUSHROOM: 1,
    CACTUS: 1,
    WALNUT: 1,
    BERRY_BUSH: 1,
    BAMBOO: 1,
    SUNFLOWER: 1,
    CORN: 1,
    PINE_TREE: 1,
    WILLOW_TREE: 1,
    FERN: 1,
  });

  gameState.exploredMap = initializeFog({
    fog: null,
    isFogScaled: gameConfig.isFogScaled,
    worldHeight,
    worldWidth,
    exploredMap: gameState.exploredMap,
  });

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
          currentWorld.getTile(tileX, tileY) === tiles.AIR &&
          tileY + 1 < worldHeight &&
          currentWorld.getTile(tileX, tileY + 1) &&
          currentWorld.getTile(tileX, tileY + 1).solid // Check the solid property directly
        ) {
          // Also ensure there's enough vertical clearance (2-3 tiles high)
          let hasVerticalClearance = true;

          for (let checkY = tileY - 2; checkY <= tileY; checkY++) {
            if (
              checkY >= 0 &&
              currentWorld.getTile(tileX, checkY) !== tiles.AIR
            ) {
              hasVerticalClearance = false;

              break;
            }
          }

          if (hasVerticalClearance) {
            const updatedPlayer = {
              ...player.get(),
              x: x * tileSize,
              y: y * tileSize,
              velocityX: 0,
              velocityY: 0,
              lastDirection: 0,
            };

            player.set(updatedPlayer);
          }
        }
      }
    }
  }

  return currentWorld;
}

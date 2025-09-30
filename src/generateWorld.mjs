import { addMossToCaves } from "./generateMoss.mjs";
import { gameConfig, gameState, updateState } from "./state.mjs";
import { generateCaves } from "./generateCaves.mjs";
import { generateHeightMap } from "./generateHeightMap.mjs";
import { generateWaterSources, simulateWaterPhysics } from "./waterPhysics.mjs";
import { getBiome } from "./getBiome.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { getRandomSeed } from "./getRandomSeed.mjs";
import { initializeFog } from "./fogMap.mjs";
import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";
import { updateUI } from "./updateUI.mjs";
import { WorldMap } from "./worldMap.mjs";

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
        } else if (depth < getRandomSeed(20, 50)) {
          // Sub-surface layer
          if (Math.random() < 0.1) {
            world.setTile(x, y, tiles.COAL);
          } else if (Math.random() < 0.95) {
            world.setTile(x, y, biome.subTile);
          } else {
            world.setTile(x, y, tiles.STONE);
          }
        } else if (depth < getRandomSeed(50, 90)) {
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
          world.setTile(x, y, tiles.TREE_TRUNK);

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
                world.getTile(leafX, leafY) === tiles.AIR
              ) {
                world.setTile(leafX, leafY, tiles.TREE_LEAVES);
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

      // Register the tree structure so it can be harvested properly
      const plantKey = `${plantX},${plantY}`;
      const currentStructures = gameState.plantStructures.get() || {};
      currentStructures[plantKey] = {
        seedType: "WALNUT",
        mature: true,
        blocks: treeBlocks,
        baseX: plantX,
        baseY: plantY,
      };
      gameState.plantStructures.set(currentStructures);
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
          [tiles.WALNUT.id]: "WALNUT",
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
export function generateNewWorld(doc, newSeed = null) {
  if (newSeed !== null) {
    gameConfig.worldSeed.set(newSeed.toString());
  }

  generateWorld(doc);

  // Reset game state
  gameState.growthTimers.set({});
  gameState.plantStructures.set({});
  gameState.gameTime.set(0);

  // set seed inventory
  gameState.seedInventory.set({
    WHEAT: 2,
    CARROT: 1,
    MUSHROOM: 1,
    CACTUS: 0,
    WALNUT: 0,
  });

  const player = gameState.player.get();
  const surfaceLevel = gameConfig.SURFACE_LEVEL.get();
  const tiles = gameConfig.TILES;
  const tileSize = gameConfig.TILE_SIZE.get();
  const world = gameState.world.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const worldWidth = gameConfig.WORLD_WIDTH.get();

  const treeStructures = registerTreeStructures(
    world,
    worldWidth,
    worldHeight,
    tiles,
  );

  gameState.plantStructures.set(treeStructures);

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

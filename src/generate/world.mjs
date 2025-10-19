import { Signal } from "../../deps/signal.mjs";

import { addMossToCaves } from "./moss.mjs";
import { generateCaves } from "./caves.mjs";
import { generateHeightMap } from "./heightMap.mjs";
import { generateWaterSources } from "../water/generateWaterSources.mjs";
import { getBiome } from "../misc/getBiome.mjs";
import { getHarvestMap } from "../misc/getHarvestMap.mjs";
import { getRandomSeed } from "../misc/getRandomSeed.mjs";
import { updateState } from "../state/state.mjs";
import { updateWaterPhysics } from "../water/updateWaterPhysics.mjs";
import { WorldMap } from "../map/world.mjs";

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
        const seedType = getHarvestMap(tiles)[crop.id];
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
    tileSize,
  });

  // Simulate water physics to make water settle naturally
  const initialQueue = new Set();
  for (let x = 0; x < worldWidth; x++) {
    for (let y = 0; y < worldHeight; y++) {
      if (currentWorld.getTile(x, y) === tiles.WATER) {
        initialQueue.add(`${x},${y}`);
      }
    }
  }

  // (more iterations for world gen)
  for (let i = 0; i < 100; i++) {
    const tempQueue = {
      get: () => initialQueue,
      set: (v) => initialQueue.clear() || v.forEach((k) => initialQueue.add(k)),
    };

    updateWaterPhysics({
      world: new Signal.State(currentWorld),
      worldWidth,
      worldHeight,
      tiles,
      waterPhysicsQueue: tempQueue,
      waterPhysicsConfig: { frameCounter: 999 }, // Force immediate update
    });

    // Water settled
    if (initialQueue.size === 0) {
      break;
    }
  }

  console.log("World generation complete!");

  return currentWorld;
}

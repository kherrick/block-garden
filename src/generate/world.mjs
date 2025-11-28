import { Signal } from "signal-polyfill";

import { addMossToCaves } from "../generate/plants/moss.mjs";
import { generateCaves } from "./caves.mjs";
import { generateHeightMap } from "./heightMap.mjs";
import { generateWaterSources } from "../water/generateWaterSources.mjs";
import { generateClouds } from "./generateClouds.mjs";
import { getBiome } from "../misc/getBiome.mjs";
import { getHarvestMap } from "../misc/getHarvestMap.mjs";
import { getRandomSeed } from "../misc/getRandomSeed.mjs";
import { updateState } from "../state/state.mjs";
import { updateWaterPhysics } from "../water/updateWaterPhysics.mjs";
import { WorldMap } from "../map/world.mjs";

/** @typedef {import('../state/config/index.mjs').BiomeMap} BiomeMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * Generates a complete procedural world with terrain, caves, water, and biomes.
 *
 * Uses seeded noise for deterministic generation across playthroughs.
 * Populates terrain based on height maps, biome rules, and procedural features.
 *
 * @param {BiomeMap} biomes - Biome definitions
 * @param {number} surfaceLevel - Y-coordinate where surface terrain begins
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} worldSeed - Seed for noise-based generation
 * @param {number} worldHeight - World height in tiles
 * @param {number} worldWidth - World width in tiles
 *
 * @returns {WorldMap} Complete generated world
 */
export function generateWorld(
  biomes,
  surfaceLevel,
  tiles,
  worldSeed,
  worldHeight,
  worldWidth,
) {
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
  generateCaves(surfaceLevel, tiles, currentWorld, worldHeight, worldWidth);

  // Add moss to cave surfaces after cave generation
  addMossToCaves(currentWorld, worldWidth, worldHeight, tiles);

  // Generate clouds in the sky
  generateClouds(currentWorld, worldWidth, surfaceLevel, tiles, worldSeed);

  // Generate water sources using seeded noise
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
  const initialQueue = new Set();
  for (let x = 0; x < worldWidth; x++) {
    for (let y = 0; y < worldHeight; y++) {
      if (currentWorld.getTile(x, y) === tiles.WATER) {
        initialQueue.add(`${x},${y}`);
      }
    }
  }

  // Create Signal State for queue and world - keep same world instance
  const waterPhysicsQueue = new Signal.State(new Set(initialQueue));
  const worldState = new Signal.State(currentWorld);

  // (more iterations for world gen)
  for (let i = 0; i < 100; i++) {
    updateWaterPhysics(
      tiles,
      {
        updateInterval: 0,
        frameCounter: 999, // Force immediate update
        maxIterationsPerUpdate: 0,
        checkRadius: 0,
        dirtyRegions: new Set(),
      },
      waterPhysicsQueue,
      worldState,
      worldWidth,
      worldHeight,
    );

    // Check if water settled
    const currentQueue = waterPhysicsQueue.get();
    if (currentQueue.size === 0) {
      break;
    }

    // Prepare queue for next iteration - add adjacent tiles that might need updating
    const nextQueue = new Set();
    currentQueue.forEach((pos) => {
      const [x, y] = pos.split(",").map(Number);

      nextQueue.add(pos); // Re-add current position
      if (x > 0) {
        nextQueue.add(`${x - 1},${y}`);
      }

      if (x < worldWidth - 1) {
        nextQueue.add(`${x + 1},${y}`);
      }

      if (y > 0) {
        nextQueue.add(`${x},${y - 1}`);
      }

      if (y < worldHeight - 1) {
        nextQueue.add(`${x},${y + 1}`);
      }
    });

    waterPhysicsQueue.set(nextQueue);
  }

  console.log("World generation complete!");

  return currentWorld;
}

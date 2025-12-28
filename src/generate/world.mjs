import { initNoise, terrainNoise, noise3d } from "../util/noise.mjs";

/**
 * @typedef {import('../state/config/index.mjs').gameConfig} GameConfig
 */

/**
 * @typedef {import('../state/state.mjs').gameState} GameState
 */

/**
 * @typedef {import('../state/state.mjs').computedSignals} ComputedSignals
 */

/**
 * Generate the procedural world
 *
 * @param {number} seed
 * @param {GameConfig} gameConfig
 * @param {GameState} gameState
 */
export function generateProceduralWorld(seed, gameConfig, gameState) {
  const { blocks, blockNames } = gameConfig;
  const { world } = gameState;

  initNoise(seed);

  // Helper to find block IDs
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GRASS = getBlockId(blockNames.GRASS);
  const DIRT = getBlockId(blockNames.DIRT);
  const STONE = getBlockId(blockNames.STONE);
  const WATER = getBlockId(blockNames.WATER);
  const SAND = getBlockId(blockNames.SAND);
  const CLOUD = getBlockId(blockNames.CLOUD);
  const WOOD = getBlockId(blockNames.WOOD);
  const TREE_LEAVES = getBlockId(blockNames.TREE_LEAVES);

  const WORLD_RADIUS = 16;
  const MIN_Y = 1;
  const MAX_Y = 24;
  const SEA_LEVEL = 4;
  const CLOUD_HEIGHT_MIN = 18;
  const CLOUD_HEIGHT_MAX = 22;

  // Clear existing world if any (though usually empty on init)
  world.clear();

  // Clear plant structures and growth timers
  gameState.plantStructures = {};
  gameState.growthTimers = {};

  let spawnY = MAX_Y;

  // --- Terrain and surface map generation ---
  // We'll collect valid grass blocks for pre-planting
  const validSeedSpots = [];
  for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x++) {
    for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z++) {
      const n = terrainNoise(x, z, seed);
      let surfaceHeight = Math.floor(((n + 1) / 2) * 12 + 2);
      if (Math.abs(x) < 3 && Math.abs(z) < 3) {
        surfaceHeight = Math.max(surfaceHeight, SEA_LEVEL + 1);
      }
      if (x === 0 && z === 0) {
        spawnY = surfaceHeight + 2;
      }
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        const key = `${x},${y},${z}`;
        if (y === MIN_Y) {
          world.set(key, WATER);
          continue;
        }
        if (y <= surfaceHeight) {
          if (y === surfaceHeight) {
            if (y < SEA_LEVEL + 1) {
              world.set(key, SAND);
            } else {
              world.set(key, GRASS);
              // Tree Chance
              if (
                (Math.abs(x) > 4 || Math.abs(z) > 4) &&
                Math.random() < 0.02 &&
                x % 3 !== 0 &&
                z % 3 !== 0
              ) {
                placeTree(world, x, y + 1, z, WOOD, TREE_LEAVES);
              }
              // Collect valid grass blocks for pre-planting
              if (
                gameState.isPrePlanted &&
                (Math.abs(x) > 2 || Math.abs(z) > 2)
              ) {
                validSeedSpots.push({ x, y, z, key });
              }
            }
          } else if (y > surfaceHeight - 3) {
            world.set(key, DIRT);
          } else {
            world.set(key, STONE);
          }
        } else {
          if (y <= SEA_LEVEL) {
            world.set(key, WATER);
          } else {
            if (
              (Math.abs(x) > 6 || Math.abs(z) > 6) &&
              y >= CLOUD_HEIGHT_MIN &&
              y <= CLOUD_HEIGHT_MAX
            ) {
              const cn = noise3d(x, y, z, seed, 2, 0.5, 0.05);
              if (cn > 0.45) {
                world.set(key, CLOUD);
              }
            }
          }
        }
      }
    }
  }

  // --- Pre-plant one of each seed at a random valid spot ---
  if (gameState.isPrePlanted && validSeedSpots.length > 0) {
    const usedKeys = new Set();
    const useFastGrowth = gameState.fastGrowth;
    const FAST_GROWTH_TIME = blocks.FAST_GROWTH_TIME || 30;
    blocks.forEach((block, blockId) => {
      if (block.isSeed) {
        // Pick a random valid spot not already used
        let spot = null;
        let attempts = 0;
        while (attempts < 100 && !spot) {
          const candidate =
            validSeedSpots[Math.floor(Math.random() * validSeedSpots.length)];
          if (candidate && !usedKeys.has(candidate.key)) {
            spot = candidate;
            usedKeys.add(candidate.key);
          }
          attempts++;
        }
        if (spot) {
          world.set(spot.key, blockId);
          gameState.plantStructures[spot.key] = {
            type: block.name,
            blocks: [spot.key],
          };
          gameState.growthTimers[spot.key] = useFastGrowth
            ? FAST_GROWTH_TIME
            : block.growthTime || 10.0;
        }
      }
    });
  }

  // Set spawn position
  gameState.y = spawnY + (1.62 - gameState.playerHeight / 2);
  gameState.x = 0;
  gameState.z = 0;
  gameState.dy = 0;
  gameState.onGround = false;
}

/**
 * Generate a flat world (dirt + grass)
 *
 * @param {GameConfig} gameConfig
 * @param {GameState} gameState
 */
export function generateFlatWorld(gameConfig, gameState) {
  const { blocks, blockNames } = gameConfig;
  const { world } = gameState;

  // Helper to find block IDs
  const getBlockId = (name) => blocks.findIndex((b) => b.name === name);

  const GRASS = getBlockId(blockNames.GRASS);
  const DIRT = getBlockId(blockNames.DIRT);

  world.clear();

  const WORLD_RADIUS = 16;

  for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x++) {
    for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z++) {
      // Layer 1: Dirt (y=0 is bedrock, handled by ChunkManager)
      world.set(`${x},1,${z}`, DIRT);
      // Layer 2: Grass
      world.set(`${x},2,${z}`, GRASS);
    }
  }

  // Set spawn position on top of grass
  gameState.y = 4;
  gameState.x = 0;
  gameState.z = 0;
  gameState.dy = 0;
  gameState.onGround = false;
}

function placeTree(world, x, y, z, woodId, leavesId) {
  const height = 4 + Math.floor(Math.random() * 2);
  // Trunk
  for (let i = 0; i < height; i++) {
    world.set(`${x},${y + i},${z}`, woodId);
  }
  // Leaves
  for (let lx = x - 2; lx <= x + 2; lx++) {
    for (let lz = z - 2; lz <= z + 2; lz++) {
      for (let ly = y + height - 2; ly <= y + height + 1; ly++) {
        // Simple sphere/box approximation
        if (
          Math.abs(lx - x) + Math.abs(lz - z) + Math.abs(ly - (y + height)) <=
          3
        ) {
          const key = `${lx},${ly},${lz}`;
          if (!world.has(key)) {
            world.set(key, leavesId);
          }
        }
      }
    }
  }
}

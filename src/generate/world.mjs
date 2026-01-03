import { initNoise, terrainNoise } from "../util/noise.mjs";

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
 * Initialize procedural world generation.
 * Terrain is generated lazily per-chunk as player moves.
 *
 * @param {number} seed
 * @param {GameState} gameState
 */
export function generateProceduralWorld(seed, gameState) {
  const { world } = gameState;

  // Initialize noise generator with seed
  initNoise(seed);

  // Store seed for saving and chunk generation
  gameState.seed = seed;

  // Clear existing world
  world.clear();

  // Clear plant structures and growth timers
  gameState.plantStructures = {};
  gameState.growthTimers = {};

  // Calculate spawn height at origin
  const SEA_LEVEL = 4;
  const n = terrainNoise(0, 0, seed);
  let spawnY = Math.floor(((n + 1) / 2) * 12 + 2);
  spawnY = Math.max(spawnY, SEA_LEVEL + 1);

  // Set spawn position (terrain will generate around player)
  gameState.y = spawnY + 10 + (1.62 - gameState.playerHeight / 2);
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

  const WORLD_RADIUS = gameState.worldRadius;

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

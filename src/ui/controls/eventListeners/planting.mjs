import { gameState } from "../../../core/systems/game/state.mjs";
import { BIOMES } from "../../../world/config/biomes.mjs";
import { FAST_GROWTH_TIME } from "../../../world/config/index.mjs";
import { blockNames, blocks } from "../../../world/config/blocks.mjs";

/**
 * Configurable constants for planting.
 */
export const PLANTING_CONFIG = {
  TOSS_COUNT: 5, // Number of seeds to "toss"
  TOSS_RADIUS: 20, // Max distance seeds can land
  MIN_DISTANCE_FROM_PLAYER: 2, // Don't plant too close

  BANNED_SURFACES: new Set([
    blocks.getIdByName(blockNames.WATER),
    blocks.getIdByName(blockNames.LAVA),
  ]),
};

/**
 * Get biome from surface block ID, with cloud fallback
 *
 * @param {number} surfaceId
 * @returns {Object|null}
 */
export function getBiomeBySurface(surfaceId) {
  // Check standard biomes first
  for (const biome of Object.values(BIOMES)) {
    if (biome.surfaceBlockId === surfaceId) {
      return biome;
    }
  }

  // Clouds = any seed allowed
  if (surfaceId === blocks.getIdByName(blockNames.CLOUD)) {
    return {
      name: "Clouds",
      cropBlockIds: blocks.filter((b) => b.isSeed).map((b) => b.id),
    };
  }

  return null;
}

/**
 * Plant single seed at position
 *
 * @param {string} key
 * @param {number[]} allowedSeeds
 * @param {Object} world
 */
export function plantSeedAt(key, allowedSeeds, world) {
  if (allowedSeeds.length === 0) {
    return;
  }

  const seedId = allowedSeeds[Math.floor(Math.random() * allowedSeeds.length)];

  const block = blocks.getById(seedId);

  world.set(key, seedId, true);

  gameState.plantStructures[key] = {
    type: block.name,
    blocks: [key],
  };

  gameState.growthTimers[key] = gameState.fastGrowth
    ? FAST_GROWTH_TIME
    : block.growthTime || 10.0;
}

/**
 * Randomly plants seeds around the player.
 *
 * @param {ShadowRoot} shadow
 */
export function randomPlantSeeds(shadow) {
  const { world } = gameState;
  const px = Math.floor(gameState.x);
  const py = Math.floor(gameState.y);
  const pz = Math.floor(gameState.z);

  const usedKeys = new Set();
  let seedsPlaced = 0;

  for (let i = 0; i < PLANTING_CONFIG.TOSS_COUNT; i++) {
    // Natural circular distribution using rejection sampling or polar coords
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * PLANTING_CONFIG.TOSS_RADIUS;

    if (dist < PLANTING_CONFIG.MIN_DISTANCE_FROM_PLAYER) continue;

    const dx = Math.round(Math.cos(angle) * dist);
    const dz = Math.round(Math.sin(angle) * dist);

    const tx = px + dx;
    const tz = pz + dz;

    // Start search higher to better catch surfaces below elevated player
    for (let y = py + 5; y >= 0; y--) {
      const key = `${tx},${y},${tz}`;
      const blockId = world.get(key);

      // Skip air/undefined
      if (
        blockId === undefined ||
        blockId === blocks.getIdByName(blockNames.AIR)
      ) {
        continue;
      }

      // Quick ban check - skips entire column if we hit water/lava
      if (PLANTING_CONFIG.BANNED_SURFACES.has(blockId)) break;

      const block = blocks.getById(blockId);
      if (!block || !block.solid) continue;

      // Valid planting surfaces
      const biome = getBiomeBySurface(blockId);
      if (biome && !usedKeys.has(key)) {
        // Check if space ABOVE is clear
        const aboveKey = `${tx},${y + 1},${tz}`;
        const aboveId = world.get(aboveKey);

        if (
          aboveId === undefined ||
          aboveId === blocks.getIdByName(blockNames.AIR)
        ) {
          plantSeedAt(key, biome.cropBlockIds, world);
          usedKeys.add(key);
          seedsPlaced++;
        }
      }

      break; // Found surface (or banned block), stop scanning column
    }
  }

  console.log(
    `[Interaction] Randomly tossed seeds. Placed ${seedsPlaced} plants.`,
  );

  // Ensure growthTimers are updated for fast growth if enabled
  if (gameState.fastGrowth) {
    shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
  }
}

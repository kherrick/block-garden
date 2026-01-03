import {
  blocks as blockDefs,
  FAST_GROWTH_TIME,
} from "../state/config/blocks.mjs";

import { generators } from "../generate/plants/index.mjs";

/**
 * Update plant growth logic.
 *
 * @param {Object} gameState
 */
export function updatePlantGrowth(gameState) {
  if (!gameState.growthTimers || !gameState.plantStructures) {
    return;
  }

  const dt = 0.02; // 20ms fixed timestep

  // Process timers
  const useFastGrowth = gameState.fastGrowth;
  for (const [key, timeLeft] of Object.entries(gameState.growthTimers)) {
    const newTime = timeLeft - dt;
    const structure = gameState.plantStructures[key];

    if (newTime <= 0) {
      // Mature!
      if (structure && generators[structure.type]) {
        updateStructure(gameState, key, 1.0, structure.type);
      }
      delete gameState.growthTimers[key];
    } else {
      gameState.growthTimers[key] = newTime;

      // Update structure visuals based on progress
      if (structure && generators[structure.type]) {
        // Find plant block definition to get growthTime
        const plantDef = blockDefs.find((b) => b.name === structure.type);
        const totalTime = useFastGrowth
          ? FAST_GROWTH_TIME
          : plantDef?.growthTime || 10.0;

        const progress = 1.0 - newTime / totalTime;

        updateStructure(gameState, key, progress, structure.type);
      }
    }
  }
}

export function updateStructure(gameState, key, progress, type) {
  const structure = gameState.plantStructures[key];
  if (!structure) return;

  const [rootX, rootY, rootZ] = key.split(",").map(Number);

  // Clean up old blocks
  if (structure.blocks) {
    for (const block of structure.blocks) {
      const k = `${block.x},${block.y},${block.z}`;
      const currentId = gameState.world.get(k);
      // Only remove if it's the block we expect (prevent deleting player-placed blocks if collision)
      if (currentId === block.blockId) {
        gameState.world.delete(k);
      }
    }
  }

  // Generate new blocks
  let newBlocks = [];
  const generator = generators[type];
  if (generator) {
    newBlocks = generator(rootX, rootY, rootZ, progress, blockDefs);
    // Debug logging is causing performance issues -- enable a flag to sample
    // // console.debug(`[PlantGrowth] Updated ${type} at ${key} (progress ${progress.toFixed(2)}): ${newBlocks.length} blocks generated`);
  } else {
    console.warn(`[PlantGrowth] Generator not found for type: ${type}`);
  }

  // Place new blocks
  for (const block of newBlocks) {
    const k = `${block.x},${block.y},${block.z}`;
    gameState.world.set(k, block.blockId);
  }

  // Store for next update
  structure.blocks = newBlocks;
}

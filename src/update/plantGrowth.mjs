import {
  blocks as blockDefs,
  FAST_GROWTH_TIME,
} from "../state/config/blocks.mjs";

import { generators } from "../generate/plants/index.mjs";

/**
 * Check if a plant structure has been completely harvested (all blocks removed).
 * If so, remove the structure and its timer from the game state.
 *
 * @param {Object} gameState - Game state object with world, plantStructures, growthTimers
 * @param {string} key - The plant key (e.g., "x,y,z")
 *
 * @returns {boolean} True if the plant was removed (completely harvested), false otherwise
 */
export function checkAndRemoveFarmedPlant(gameState, key) {
  if (!gameState.plantStructures || !gameState.plantStructures[key]) {
    return false;
  }

  const structure = gameState.plantStructures[key];
  if (!structure.blocks || structure.blocks.length === 0) {
    // No blocks to check - consider it farmed if it's empty
    delete gameState.plantStructures[key];
    if (gameState.growthTimers) {
      delete gameState.growthTimers[key];
    }
    return true;
  }

  // Check if all blocks in the structure are gone from the world
  let allBlocksRemoved = true;
  for (const block of structure.blocks) {
    const k = `${block.x},${block.y},${block.z}`;
    const currentId = gameState.world.get(k);
    if (currentId !== undefined) {
      // Block still exists in world
      allBlocksRemoved = false;
      break;
    }
  }

  if (allBlocksRemoved) {
    // Plant is completely harvested - remove structure and timer
    console.log(
      `[PlantGrowth] Plant at ${key} fully harvested, removing structure`,
    );
    delete gameState.plantStructures[key];
    if (gameState.growthTimers) {
      delete gameState.growthTimers[key];
    }
    return true;
  }

  return false;
}

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
  const keysToDelete = [];

  for (const [key, timeLeft] of Object.entries(gameState.growthTimers)) {
    const newTime = timeLeft - dt;
    const structure = gameState.plantStructures[key];

    if (newTime <= 0) {
      // Mature!
      if (structure && generators[structure.type]) {
        updateStructure(gameState, key, 1.0, structure.type);
      }
      keysToDelete.push(key);
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

      // Check if plant has been completely harvested while growing
      checkAndRemoveFarmedPlant(gameState, key);
    }
  }

  // Clean up mature plant timers
  for (const key of keysToDelete) {
    delete gameState.growthTimers[key];
    // Also check if the plant was completely harvested
    checkAndRemoveFarmedPlant(gameState, key);
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

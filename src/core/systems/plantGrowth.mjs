import {
  getBlockByName,
  FAST_GROWTH_TIME,
} from "../../world/config/blocks.mjs";

import { generators } from "../../world/plants/index.mjs";

// Controls for throttling visual updates
const LOGIC_UPDATE_INTERVAL_MS = 200; // only update visuals every 200ms

let _lastLogicUpdateMs = 0;

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
    const k =
      typeof block === "string" ? block : `${block.x},${block.y},${block.z}`;

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
  const nowMs = performance.now();
  const shouldUpdateVisuals =
    nowMs - _lastLogicUpdateMs >= LOGIC_UPDATE_INTERVAL_MS;

  // Process timers
  const useFastGrowth = gameState.fastGrowth;
  const keysToDelete = [];

  for (const [key, timeLeft] of Object.entries(gameState.growthTimers)) {
    const newTime = timeLeft - dt;
    const structure = gameState.plantStructures[key];

    if (newTime <= 0) {
      // Mature! Force update to final stage
      if (structure && generators[structure.type]) {
        updateStructure(gameState, key, 1.0, structure.type);
      }

      keysToDelete.push(key);
    } else {
      gameState.growthTimers[key] = newTime;

      // Update structure visuals based on progress (throttled)
      if (structure && generators[structure.type] && shouldUpdateVisuals) {
        // Find plant block definition to get growthTime
        const plantDef = getBlockByName(structure.type);
        const totalTime = useFastGrowth
          ? FAST_GROWTH_TIME
          : plantDef?.growthTime || 10.0;

        const progress = 1.0 - newTime / totalTime;

        updateStructure(gameState, key, progress, structure.type);
      }

      // Check if plant has been completely harvested while growing (only every logic frame to save perf)
      if (shouldUpdateVisuals) {
        checkAndRemoveFarmedPlant(gameState, key);
      }
    }
  }

  if (shouldUpdateVisuals) {
    _lastLogicUpdateMs = nowMs;
  }

  // Clean up mature plant timers
  for (const key of keysToDelete) {
    delete gameState.growthTimers[key];

    // Also check if the plant was completely harvested
    checkAndRemoveFarmedPlant(gameState, key);
  }
}

export function updateStructure(gameState, key, progress, type, force = false) {
  const structure = gameState.plantStructures[key];
  if (!structure) {
    return;
  }

  const [rootX, rootY, rootZ] = key.split(",").map(Number);

  // Generate new blocks
  let newBlocks = [];

  const generator = generators[type];
  if (generator) {
    newBlocks = generator(rootX, rootY, rootZ, progress);
  } else {
    console.warn(`[PlantGrowth] Generator not found for type: ${type}`);

    return;
  }

  // Build maps for comparison
  const prevMap = new Map();
  if (structure.blocks) {
    for (const block of structure.blocks) {
      if (typeof block === "string") {
        prevMap.set(block, undefined); // Seed block coordinate
      } else {
        prevMap.set(`${block.x},${block.y},${block.z}`, block.blockId);
      }
    }
  }

  const newMap = new Map();
  for (const block of newBlocks) {
    newMap.set(`${block.x},${block.y},${block.z}`, block.blockId);
  }

  // Remove blocks that are no longer in the structure
  for (const [k, prevId] of prevMap) {
    if (!newMap.has(k) || force) {
      const currentId = gameState.world.get(k);
      // Only delete if it's the block we expect (or if it was a seed block string)
      if (
        prevId === undefined ||
        currentId === prevId ||
        (force && currentId !== undefined)
      ) {
        gameState.world.delete(k);
      }
    }
  }

  // Add or update blocks that have changed
  for (const [k, newId] of newMap) {
    const prevEntry = prevMap.get(k);
    const prevId = prevEntry;

    if (prevId !== newId || force) {
      // If it was a seed block (prevId === undefined), ensure we delete whatever is there first
      // although world.set usually overwrites.
      if (prevEntry === undefined && prevMap.has(k)) {
        gameState.world.delete(k);
      }

      gameState.world.set(k, newId);
    }
  }

  // Store for next update
  structure.blocks = newBlocks;
}

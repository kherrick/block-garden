import { intersects } from "./aabb.mjs";
import { gameConfig } from "../state/config/index.mjs";
import { getBlockById } from "../state/config/blocks.mjs";

/** @typedef {import('../state/state.mjs').GameState} GameState */

/**
 * Attempts to place a block at the current hit position.
 *
 * @param {GameState} gameState
 * @param {import('../util/ray.mjs').PointWithFace} [targetHit] - Optional hit target. If not provided, uses gameState.hit
 *
 * @returns {boolean} True if block was placed, false otherwise
 */
export function placeBlock(gameState, targetHit) {
  const hit = targetHit || gameState.hit;
  if (!hit || !hit.face) {
    return false;
  }

  const { x, y, z, face } = hit;
  const newBlockX = x + face.x;
  const newBlockY = y + face.y;
  const newBlockZ = z + face.z;

  const playerAABB = {
    minX: gameState.x - gameState.playerWidth / 2,
    maxX: gameState.x + gameState.playerWidth / 2,
    minY: gameState.y - gameState.playerHeight / 2,
    maxY: gameState.y + gameState.playerHeight / 2,
    minZ: gameState.z - gameState.playerWidth / 2,
    maxZ: gameState.z + gameState.playerWidth / 2,
  };

  const newBlockAABB = {
    minX: newBlockX,
    maxX: newBlockX + 1,
    minY: newBlockY,
    maxY: newBlockY + 1,
    minZ: newBlockZ,
    maxZ: newBlockZ + 1,
  };

  if (intersects(playerAABB, newBlockAABB)) {
    return false;
  }

  const curBlockId = gameState.curBlock.get();
  const key = `${newBlockX},${newBlockY},${newBlockZ}`;

  gameState.world.set(key, curBlockId, true);

  // Plant growth logic
  const placedBlock = getBlockById(curBlockId);
  if (placedBlock && placedBlock.isSeed) {
    if (!gameState.growthTimers) {
      gameState.growthTimers = {};
    }

    if (!gameState.plantStructures) {
      gameState.plantStructures = {};
    }

    const FAST_GROWTH_TIME = 30;
    const growthTime = gameState.fastGrowth
      ? FAST_GROWTH_TIME
      : placedBlock.growthTime || 10.0;
    gameState.growthTimers[key] = growthTime;
    gameState.plantStructures[key] = {
      type: placedBlock.name,
      blocks: [],
    };
  }

  return true;
}

/**
 * Attempts to remove a block at the current hit position.
 *
 * @param {GameState} gameState
 * @param {import('../util/ray.mjs').PointWithFace} [targetHit] - Optional hit target. If not provided, uses gameState.hit
 *
 * @returns {boolean} True if block was removed, false otherwise
 */
export function removeBlock(gameState, targetHit) {
  const hit = targetHit || gameState.hit;
  if (!hit) {
    return false;
  }

  const key = `${hit.x},${hit.y},${hit.z}`;
  gameState.world.delete(key, true);

  // Check if this block removal completed a plant harvest
  if (gameState.plantStructures) {
    for (const [structureKey, structure] of Object.entries(
      gameState.plantStructures,
    )) {
      if (!structure || !structure.blocks) continue;

      // Check if this block was part of this structure
      const blockInStructure = structure.blocks.find(
        (block) => block.x === hit.x && block.y === hit.y && block.z === hit.z,
      );

      if (blockInStructure) {
        // Block was part of this structure - check if now fully harvested
        let allBlocksRemoved = true;
        for (const block of structure.blocks) {
          const blockKey = `${block.x},${block.y},${block.z}`;
          const currentId = gameState.world.get(blockKey);
          if (currentId !== undefined) {
            allBlocksRemoved = false;
            break;
          }
        }

        if (allBlocksRemoved) {
          // Structure is completely harvested
          console.log(
            `[Interaction] Plant at ${structureKey} fully harvested, removing structure`,
          );
          delete gameState.plantStructures[structureKey];
          if (gameState.growthTimers) {
            delete gameState.growthTimers[structureKey];
          }
        }
        break; // Found the structure, no need to check others
      }
    }
  }

  return true;
}

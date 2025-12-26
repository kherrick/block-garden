import { intersects } from "./aabb.mjs";
import { gameConfig } from "../state/config/index.mjs";

/** @typedef {import('../state/state.mjs').GameState} GameState */

/**
 * Attempts to place a block at the current hit position.
 *
 * @param {GameState} gameState
 *
 * @returns {boolean} True if block was placed, false otherwise
 */
export function placeBlock(gameState) {
  const hit = gameState.hit;
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

  gameState.world.set(key, curBlockId);

  // Plant growth logic
  const placedBlock = gameConfig.blocks[curBlockId];
  if (placedBlock && placedBlock.isSeed) {
    if (!gameState.growthTimers) {
      gameState.growthTimers = {};
    }

    if (!gameState.plantStructures) {
      gameState.plantStructures = {};
    }

    const growthTime = placedBlock.growthTime || 10.0;
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
 *
 * @returns {boolean} True if block was removed, false otherwise
 */
export function removeBlock(gameState) {
  const hit = gameState.hit;
  if (!hit) {
    return false;
  }

  const key = `${hit.x},${hit.y},${hit.z}`;
  gameState.world.delete(key);

  return true;
}

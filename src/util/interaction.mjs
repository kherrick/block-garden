import { intersects } from "./aabb.mjs";

import { formatName } from "./formatWorldName.mjs";

import { showToast } from "../api/ui/toast.mjs";

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
  if (!hit) {
    return false;
  }

  // Check if we are interacting with an existing block
  const blockType = gameState.world.get(`${hit.x},${hit.y},${hit.z}`);
  if (blockType !== undefined) {
    const blockDef = getBlockById(blockType);
    if (blockDef && blockDef.name === "Link") {
      activateLinkBlock(gameState, hit.x, hit.y, hit.z);

      return true;
    }
  }

  if (!hit.face) {
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
    const shadow = document.querySelector("block-garden")?.shadowRoot;
    if (shadow) {
      const targetBlockType = gameState.world.get(`${hit.x},${hit.y},${hit.z}`);
      const targetBlockDef = getBlockById(targetBlockType);
      const blockName = targetBlockDef ? targetBlockDef.name : "Unknown";

      let msg = `${blockName} at [${hit.x}, ${hit.y}, ${hit.z}]`;
      if (targetBlockDef?.name === "Link") {
        const chunkX = Math.floor(hit.x / 16);
        const chunkZ = Math.floor(hit.z / 16);
        const chunk = gameState.world.getOrCreateChunk(chunkX, chunkZ);
        const localX = ((hit.x % 16) + 16) % 16;
        const localZ = ((hit.z % 16) + 16) % 16;

        const metadata = chunk.metadata.get(chunk.index(localX, hit.y, localZ));
        if (metadata?.worldName) {
          msg = `🔗 Link to: ${metadata.worldName} at [${hit.x}, ${hit.y}, ${hit.z}]`;
        }
      }

      showToast(shadow, msg);
    }

    return false;
  }

  const curBlockId = gameState.curBlock.get();
  const key = `${newBlockX},${newBlockY},${newBlockZ}`;

  const curBlockDef = getBlockById(curBlockId);

  let metadata = null;
  if (curBlockDef && curBlockDef.name === "Link") {
    metadata = gameState.armedLinkConfig.get();
  }

  gameState.world.set(key, curBlockId, true, metadata);

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

/**
 * Activates a Link block at the given coordinates.
 *
 * @param {GameState} gameState
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function activateLinkBlock(gameState, x, y, z) {
  const chunkX = Math.floor(x / 16);
  const chunkZ = Math.floor(z / 16);
  const chunk = gameState.world.getOrCreateChunk(chunkX, chunkZ);
  const localX = ((x % 16) + 16) % 16;
  const localZ = ((z % 16) + 16) % 16;

  const metadata = chunk.metadata.get(chunk.index(localX, y, localZ));
  if (!metadata || !metadata.worldName) {
    console.warn("Link block has no metadata or world name");

    return;
  }

  const { worldName, params = {} } = metadata;
  const shadow = document.querySelector("block-garden").shadowRoot;

  // Show inspection toast
  const paramString = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  const toastMsg = `🔗 Link: ${worldName}${paramString ? ` (${paramString})` : ""} at [${x}, ${y}, ${z}]`;

  showToast(shadow, toastMsg);

  const filename = formatName(worldName) + ".pdf";
  const gameSaveUrl = `https://kherrick.github.io/block-garden/assets/game-saves/${filename}`;

  const url = new URL("https://kherrick.github.io/block-garden/");
  url.searchParams.set("gameSave", gameSaveUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const dialog = document.createElement("dialog");
  dialog.style.cssText = `
    background: var(--bg-color-gray-50);
    border-radius: 0.5rem;
    border: 0.125rem solid var(--bg-color-gray-900);
    color: var(--bg-color-gray-900);
    font-family: monospace;
    padding: 1.25rem;
    max-width: 25rem;
    z-index: 10000;
  `;

  dialog.innerHTML = `
    <h3 style="margin: 0 0 1rem 0">Travel to World?</h3>
    <p style="margin: 0 0 1rem 0">
      Would you like to travel to <strong>${worldName}</strong>?
    </p>
    <div style="display: flex; gap: 0.625rem; justify-content: flex-end">
      <button id="cancelTravel" style="background: var(--bg-color-red-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.5rem 0.9375rem;">No</button>
      <button id="confirmTravel" style="background: var(--bg-color-green-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.5rem 0.9375rem;">Yes</button>
    </div>
  `;

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  gameState.isCanvasActionDisabled = true;

  shadow.append(dialog);
  dialog.showModal();

  dialog.querySelector("#cancelTravel").addEventListener("click", () => {
    dialog.close();
    dialog.remove();

    setTimeout(() => {
      gameState.isCanvasActionDisabled = false;
    }, 500);
  });

  dialog.querySelector("#confirmTravel").addEventListener("click", () => {
    window.location.href = url.toString();
  });
}

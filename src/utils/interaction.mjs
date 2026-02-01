import { intersects } from "../core/systems/physics.mjs";

import { formatName } from "./formatWorldName.mjs";

import { showToast } from "../api/ui/toast.mjs";

import { blocks } from "../world/config/blocks.mjs";
import { FAST_GROWTH_TIME, gameConfig } from "../world/config/index.mjs";

import { getShadowRoot } from "../ui/utils/getShadowRoot.mjs";
import { raycastFromCanvasCoords } from "./raycastFromCanvasCoords.mjs";
import { waitForElement } from "../ui/utils/waitForElement.mjs";

/** @typedef {import('../core/systems/game/state.mjs').GameState} GameState */
/** @typedef {import('../utils/ray.mjs').PointWithFace} PointWithFace */

/**
 * Attempts to place a block at the current hit position.
 *
 * @param {GameState} gameState
 * @param {PointWithFace} [targetHit] - Optional hit target. If not provided, uses gameState.hit
 *
 * @returns {boolean|string} "activated" if block was activated, "placed" if placed, false otherwise
 */
export function placeBlock(gameState, targetHit) {
  const hit = targetHit || gameState.hit;
  if (!hit) {
    return false;
  }

  // Check if we are interacting with an existing block
  const blockType = gameState.world.get(`${hit.x},${hit.y},${hit.z}`);
  if (blockType !== undefined) {
    const blockDef = blocks.getById(blockType);
    if (blockDef && blockDef.name === "Link") {
      activateLinkBlock(gameState, hit.x, hit.y, hit.z);

      return "activated";
    }

    if (blockDef && blockDef.name === "Text") {
      activateTextBlock(gameState, hit.x, hit.y, hit.z);

      return "activated";
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
    const shadow = getShadowRoot(globalThis.document, "block-garden");
    if (shadow) {
      const targetBlockType = gameState.world.get(`${hit.x},${hit.y},${hit.z}`);
      const targetBlockDef = blocks.getById(targetBlockType);
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
      } else if (targetBlockDef?.name === "Text") {
        const chunkX = Math.floor(hit.x / 16);
        const chunkZ = Math.floor(hit.z / 16);
        const chunk = gameState.world.getOrCreateChunk(chunkX, chunkZ);
        const localX = ((hit.x % 16) + 16) % 16;
        const localZ = ((hit.z % 16) + 16) % 16;

        const metadata = chunk.metadata.get(chunk.index(localX, hit.y, localZ));
        if (metadata?.text) {
          msg = `📝 Text: ${metadata.text.substring(0, 20)}${metadata.text.length > 20 ? "..." : ""} at [${hit.x}, ${hit.y}, ${hit.z}]`;
        }
      }

      showToast(shadow, msg);
    }

    return false;
  }

  const curBlockId = gameState.curBlock.get();
  const key = `${newBlockX},${newBlockY},${newBlockZ}`;

  const curBlockDef = blocks.getById(curBlockId);

  let metadata = null;
  if (curBlockDef && curBlockDef.name === "Link") {
    metadata = gameState.armedLinkConfig.get();
  } else if (curBlockDef && curBlockDef.name === "Text") {
    metadata = gameState.armedTextConfig.get();
  }

  gameState.world.set(key, curBlockId, true, metadata);

  // Plant growth logic
  const placedBlock = blocks.getById(curBlockId);
  if (placedBlock && placedBlock.isSeed) {
    if (!gameState.growthTimers) {
      gameState.growthTimers = {};
    }

    if (!gameState.plantStructures) {
      gameState.plantStructures = {};
    }

    const growthTime = gameState.fastGrowth
      ? FAST_GROWTH_TIME
      : placedBlock.growthTime || 10.0;

    gameState.growthTimers[key] = growthTime;
    gameState.plantStructures[key] = {
      type: placedBlock.name,
      blocks: [],
    };
  }

  return "placed";
}

/**
 * Attempts to remove a block at the current hit position.
 *
 * @param {GameState} gameState
 * @param {PointWithFace} [targetHit] - Optional hit target. If not provided, uses gameState.hit
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

        // Found the structure, no need to check others
        break;
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
  const shadow = getShadowRoot(globalThis.document, "block-garden");

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
      <button id="cancelTravel" autofocus="autofocus" style="background: var(--bg-color-red-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.5rem 0.9375rem;">No</button>
      <button id="confirmTravel" style="background: var(--bg-color-green-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.5rem 0.9375rem;">Yes</button>
    </div>
  `;

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  const handleClose = () => {
    setTimeout(() => {
      // re-enable canvas after dialog is closed
      gameState.isCanvasActionDisabled = false;

      dialog.removeEventListener("close", handleClose);
    }, 300);
  };

  dialog.addEventListener("close", handleClose);

  // disable canvas while dialog is open
  gameState.isCanvasActionDisabled = true;

  shadow.append(dialog);
  dialog.showModal();

  const autofocusElement = dialog.querySelector("[autofocus]");
  if (autofocusElement instanceof HTMLElement) {
    autofocusElement.focus();
  }

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelector("#cancelTravel").addEventListener("click", closeDialog);

  // Close on Escape is handled by dialog naturally but we need to reset gameState
  dialog.addEventListener("close", closeDialog);

  dialog.querySelector("#confirmTravel").addEventListener("click", () => {
    window.location.href = url.toString();
  });
}

/**
 * Activates a Text block at the given coordinates.
 *
 * @param {GameState} gameState
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
async function activateTextBlock(gameState, x, y, z) {
  const chunkX = Math.floor(x / 16);
  const chunkZ = Math.floor(z / 16);
  const chunk = gameState.world.getOrCreateChunk(chunkX, chunkZ);
  const localX = ((x % 16) + 16) % 16;
  const localZ = ((z % 16) + 16) % 16;

  const metadata = chunk.metadata.get(chunk.index(localX, y, localZ));
  const text = metadata?.text || "No text saved in this block.";
  const shadow = getShadowRoot(globalThis.document, "block-garden");

  // Show inspection toast
  const toastMsg = `📝 Text at [${x}, ${y}, ${z}]`;
  showToast(shadow, toastMsg);

  const dialog = document.createElement("dialog");
  dialog.style.cssText = `
    background: var(--bg-color-gray-50);
    border-radius: 0.5rem;
    border: 0.125rem solid var(--bg-color-gray-900);
    color: var(--bg-color-gray-900);
    font-family: monospace;
    padding: 1.25rem;
    max-width: 30rem;
    width: 90%;
    z-index: 10000;
  `;

  dialog.innerHTML = `
    <h3 style="margin: 0 0 1rem 0">Block Text</h3>
    <div style="margin: 0 0 1.5rem 0; white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto; border: 1px solid var(--bg-color-gray-300); padding: 0.5rem; border-radius: 0.25rem;">${text}</div>
    <div style="display: flex; gap: 0.625rem; justify-content: flex-end">
      <button id="closeTextDialog" autofocus="autofocus" style="background: var(--bg-color-blue-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.5rem 0.9375rem;">OK</button>
    </div>
  `;

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  const handleClose = () => {
    setTimeout(() => {
      // re-enable canvas after dialog is closed
      gameState.isCanvasActionDisabled = false;

      dialog.removeEventListener("close", handleClose);
    }, 300);
  };

  dialog.addEventListener("close", handleClose);

  // disable canvas while dialog is open
  gameState.isCanvasActionDisabled = true;

  shadow.append(dialog);
  dialog.showModal();

  const autofocusElement = /** @type {HTMLButtonElement} */ (
    await waitForElement({
      getElement: () => dialog.querySelector("[autofocus]"),
      intervalMs: 150,
      timeoutMs: 1000,
    })
  );

  autofocusElement.focus();

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  dialog
    .querySelector("#closeTextDialog")
    .addEventListener("click", closeDialog);

  // Close on Escape is handled by dialog naturally but we need to reset gameState
  dialog.addEventListener("close", closeDialog);
}

/**
 * Starts a breaking session (if not already active) for a specific target.
 * This is now mostly internal or used for "one-shot" activation.
 * Continuous breaking is handled by updateBreaking observing breakingInput.
 *
 * @param {GameState} gameState
 * @param {PointWithFace} [targetHit]
 */
export function startBreaking(gameState, targetHit) {
  const hit = targetHit;
  if (!hit) {
    return;
  }

  const blockKey = `${hit.x},${hit.y},${hit.z}`;
  const blockId = gameState.world.get(blockKey);

  if (blockId === undefined || blockId === 0) {
    stopBreaking(gameState);

    return;
  }

  // If we are already breaking THIS block, do nothing (continue breaking)
  if (
    gameState.breaking.active &&
    gameState.breaking.blockPos &&
    gameState.breaking.blockPos.x === hit.x &&
    gameState.breaking.blockPos.y === hit.y &&
    gameState.breaking.blockPos.z === hit.z
  ) {
    return;
  }

  // Start breaking new block
  gameState.breaking.active = true;
  gameState.breaking.startTime = performance.now();
  gameState.breaking.blockPos = { x: hit.x, y: hit.y, z: hit.z };
  gameState.breaking.currentBlockId = blockId;
}

/**
 * Stops/cancels the current block breaking action.
 *
 * @param {GameState} gameState
 */
export function stopBreaking(gameState) {
  if (gameState.breaking.active) {
    gameState.breaking.active = false;
    gameState.breaking.blockPos = null;
    gameState.breaking.currentBlockId = null;
    gameState.breaking.startTime = 0;
    gameState.breaking.breakPercentage = 0;
  }
}

/**
 * Updates the block breaking progress. Should be called every frame.
 * Handles continuous breaking and re-targeting based on input state.
 *
 * @param {GameState} gameState
 * @param {number} dt - Delta time in seconds
 */
export function updateBreaking(gameState, dt) {
  // Check if input is held. If not, stop everything.
  if (!gameState.breakingInput.isHeld) {
    if (gameState.breaking.active) {
      stopBreaking(gameState);
    }
    return;
  }

  // Determine target block based on mode
  let targetHit = null;

  // Determine effective mode:
  // Force "center" if Split Controls are ON or Pointer Lock is active (Mouse Captured)
  let effectiveMode = gameState.breakingInput.mode;
  if (
    gameConfig.useSplitControls.get() ||
    (globalThis.document && globalThis.document.pointerLockElement)
  ) {
    effectiveMode = "center";
  }

  if (effectiveMode === "center") {
    // Center mode (Split controls or Keyboard): Use gameState.hit (center ray)
    targetHit = gameState.hit;
  } else {
    // Cursor mode (Mouse/Touch with Split OFF): Raycast from cursor
    const shadow = getShadowRoot(globalThis.document, "block-garden");
    const canvas = shadow
      ? /** @type {HTMLCanvasElement} */ (shadow.getElementById("canvas"))
      : null;

    if (canvas) {
      const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;
      const { hit: rayHit } = raycastFromCanvasCoords(
        canvas,
        gameState.breakingInput.cursorX,
        gameState.breakingInput.cursorY,
        gameState.world,
        {
          x: gameState.x,
          y: eyeY,
          z: gameState.z,
        },
        {
          yaw: gameState.yaw,
          pitch: gameState.pitch,
        },
      );

      targetHit = rayHit;
    }
  }

  // Process Target
  if (!targetHit) {
    // Input held but pointing at sky/nothing
    if (gameState.breaking.active) {
      stopBreaking(gameState);
    }

    gameState.cursorTarget = null;

    return;
  }

  // Keep cursorTarget synchronized with the breaking target during continuous breaking
  // This prevents highlight artifacts when transitioning between blocks
  gameState.cursorTarget = { x: targetHit.x, y: targetHit.y, z: targetHit.z };

  // Compare with current breaking target
  if (gameState.breaking.active) {
    // Check if we are still on the same block
    if (
      gameState.breaking.blockPos &&
      gameState.breaking.blockPos.x === targetHit.x &&
      gameState.breaking.blockPos.y === targetHit.y &&
      gameState.breaking.blockPos.z === targetHit.z
    ) {
      // Same block - continue progress
    } else {
      // Different block - restart
      stopBreaking(gameState);
      startBreaking(gameState, targetHit);
    }
  } else {
    // Not active, start breaking this target
    startBreaking(gameState, targetHit);
  }

  // Update Progress (if active)
  if (gameState.breaking.active) {
    const blockDef = blocks.getById(gameState.breaking.currentBlockId);
    if (!blockDef) {
      stopBreaking(gameState);

      return;
    }

    const breakTimeMs = (blockDef.breakTime || 0) * 1000;
    const elapsedTime = performance.now() - gameState.breaking.startTime;

    gameState.breaking.breakPercentage = Math.min(
      1.0,
      elapsedTime / breakTimeMs,
    );

    if (elapsedTime >= breakTimeMs) {
      // Break the block
      removeBlock(gameState, targetHit);

      // Reset progress but KEEP input held state active to catch next block immediately
      // We "stop" the current break to reset timer, but next frame will restart if still held
      stopBreaking(gameState);
    }
  }
}

/**
 * Updates the block placing progress. Should be called every frame.
 * Handles continuous placing and re-targeting based on input state.
 *
 * @param {GameState} gameState
 * @param {number} dt - Delta time in seconds
 */
export function updatePlacing(gameState, dt) {
  // Check if input is held. If not, stop everything.
  if (!gameState.placingInput.isHeld) {
    if (gameState.placing.active) {
      gameState.placing.active = false;
      gameState.placing.lastPlaceTime = 0;
    }

    return;
  }

  // Determine target block based on mode
  let targetHit = null;

  // Determine effective mode:
  // Force "center" if Split Controls are ON or Pointer Lock is active (Mouse Captured)
  let effectiveMode = gameState.placingInput.mode;
  if (
    gameConfig.useSplitControls.get() ||
    (globalThis.document && globalThis.document.pointerLockElement)
  ) {
    effectiveMode = "center";
  }

  if (effectiveMode === "center") {
    // Center mode (Split controls or Keyboard): Use gameState.hit (center ray)
    targetHit = gameState.hit;
  } else {
    // Cursor mode (Mouse/Touch with Split OFF): Raycast from cursor
    const shadow = getShadowRoot(globalThis.document, "block-garden");
    const canvas = shadow
      ? /** @type {HTMLCanvasElement} */ (shadow.getElementById("canvas"))
      : null;

    if (canvas) {
      const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;
      const { hit: rayHit } = raycastFromCanvasCoords(
        canvas,
        gameState.placingInput.cursorX,
        gameState.placingInput.cursorY,
        gameState.world,
        {
          x: gameState.x,
          y: eyeY,
          z: gameState.z,
        },
        {
          yaw: gameState.yaw,
          pitch: gameState.pitch,
        },
      );

      targetHit = rayHit;
    }
  }

  // Process Target
  if (!targetHit) {
    return;
  }

  // Start/Update Progress
  const now = performance.now();
  if (!gameState.placing.active) {
    // First placement (immediate)
    gameState.placing.active = true;
    gameState.placing.lastPlaceTime = now;
  } else {
    if (now - gameState.placing.lastPlaceTime >= gameState.placing.interval) {
      // Periodic placement
      if (placeBlock(gameState, targetHit)) {
        gameState.placing.lastPlaceTime = now;
      }
    }
  }
}

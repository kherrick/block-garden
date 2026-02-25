import { intersects } from "../core/systems/physics.mjs";

import { formatName } from "./formatWorldName.mjs";

import { showToast } from "../api/ui/toast.mjs";

import { blocks } from "../core/world/config/blocks.mjs";
import { FAST_GROWTH_TIME, gameConfig } from "../core/world/config/index.mjs";

import { getShadowRoot } from "../ui/utils/getShadowRoot.mjs";
import { raycastFromCanvasCoords } from "./raycastFromCanvasCoords.mjs";
import { waitForElement } from "../ui/utils/waitForElement.mjs";
import { collectDrop } from "./collectDrop.mjs";
import {
  getMaterialCount,
  getSeedCount,
  removeMaterial,
  removeSeed,
  toInventoryKey,
} from "../core/systems/game/state.mjs";

/**
 * @typedef {import("../core/world/config/blocks.mjs").BlockMetadata} BlockMetadata
 * @typedef {import("../core/systems/game/state.mjs").GameState} GameState
 * @typedef {import("../core/systems/game/state.mjs").PointWithFace} PointWithFace
 * @typedef {import("../core/systems/game/state.mjs").BlockGardenGlobalThis} BlockGardenGlobalThis
 */

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
    const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
    const shadow = getShadowRoot(gThis.document, "block-garden");
    if (shadow) {
      const targetBlockType = gameState.world.get(`${hit.x},${hit.y},${hit.z}`);
      const targetBlockDef =
        targetBlockType !== undefined ? blocks.getById(targetBlockType) : null;
      const blockName = targetBlockDef ? targetBlockDef.name : "Unknown";

      let msg = `${blockName} at [${hit.x}, ${hit.y}, ${hit.z}]`;
      if (targetBlockDef?.name === "Link") {
        const chunkX = Math.floor(hit.x / 16);
        const chunkZ = Math.floor(hit.z / 16);
        const chunk = gameState.world.getOrCreateChunk(chunkX, chunkZ);
        if (chunk) {
          const localX = ((hit.x % 16) + 16) % 16;
          const localZ = ((hit.z % 16) + 16) % 16;

          const metadata = /** @type {BlockMetadata | undefined} */ (
            chunk.metadata.get(chunk.index(localX, hit.y, localZ))
          );
          if (metadata?.worldName) {
            msg = `🔗 Link to: ${metadata.worldName} at [${hit.x}, ${hit.y}, ${hit.z}]`;
          }
        }
      } else if (targetBlockDef?.name === "Text") {
        const chunkX = Math.floor(hit.x / 16);
        const chunkZ = Math.floor(hit.z / 16);
        const chunk = gameState.world.getOrCreateChunk(chunkX, chunkZ);
        if (chunk) {
          const localX = ((hit.x % 16) + 16) % 16;
          const localZ = ((hit.z % 16) + 16) % 16;

          const metadata = /** @type {BlockMetadata | undefined} */ (
            chunk.metadata.get(chunk.index(localX, hit.y, localZ))
          );
          if (metadata?.text) {
            msg = `📝 Text: ${metadata.text.substring(0, 20)}${metadata.text.length > 20 ? "..." : ""} at [${hit.x}, ${hit.y}, ${hit.z}]`;
          }
        }
      }

      showToast(shadow, msg);
    }

    return false;
  }

  const curBlockId = gameState.curBlock.get();
  const key = `${newBlockX},${newBlockY},${newBlockZ}`;

  const curBlockDef = blocks.getById(curBlockId);

  // Check inventory before placing (skip in Creative Mode and for lighting blocks)
  if (curBlockDef && !gameConfig.useCreativeMode.get()) {
    const isLightingBlock =
      (curBlockDef.emissive || 0) > 0 && curBlockDef.name !== "Lava";

    // Skip inventory check for lighting blocks (always available) and creative mode
    if (!isLightingBlock) {
      const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
      const itemName = toInventoryKey(curBlockDef.name);
      const shadow = getShadowRoot(gThis.document, "block-garden");

      if (curBlockDef.isSeed) {
        if (getSeedCount(itemName) < 1) {
          if (shadow) {
            showToast(shadow, `No ${curBlockDef.name} seeds available`);
          }

          return false;
        }

        removeSeed(itemName, 1);
      } else {
        if (getMaterialCount(itemName) < 1) {
          if (shadow) {
            showToast(shadow, `No ${curBlockDef.name} available`);
          }

          return false;
        }

        removeMaterial(itemName, 1);
      }
    }
  }

  let metadata = null;
  if (curBlockDef && curBlockDef.name === "Link") {
    metadata = gameState.armedLinkConfig.get();
  } else if (curBlockDef && curBlockDef.name === "Text") {
    metadata = gameState.armedTextConfig.get();
  }

  gameState.world.set(key, curBlockId, true, metadata);

  // Plant growth logic
  const placedBlock = curBlockDef;
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
    /** @type {any} */
    const plantStructure = {
      type: placedBlock.name,
      blocks: [],
    };
    /** @type {any} */ (gameState.plantStructures)[key] = plantStructure;
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

  // Get block before deletion to collect drops
  const blockId = gameState.world.get(key);
  if (blockId === undefined || blockId === 0) {
    return false;
  }

  // Prevent breaking/collecting non-removable blocks (e.g. Water) or unbreakable blocks (e.g. Bedrock)
  const hitBlock = blocks.getById(blockId);
  if (hitBlock && (hitBlock.name === "Water" || hitBlock.breakTime === null)) {
    return false;
  }

  // Check if this block is part of any plant structure
  let associatedStructureKey = null;
  let associatedStructure = null;

  if (gameState.plantStructures) {
    for (const [sKey, structure] of Object.entries(gameState.plantStructures)) {
      if (!structure || !structure.blocks) {
        continue;
      }

      const blockInStructure = structure.blocks.find(
        (/** @type {any} */ block) =>
          block.x === hit.x && block.y === hit.y && block.z === hit.z,
      );

      if (blockInStructure) {
        associatedStructureKey = sKey;
        associatedStructure = structure;

        break;
      }
    }
  }

  // If it's part of a structure, perform chain reaction harvest
  if (associatedStructure && associatedStructureKey) {
    const isImmature =
      gameState.growthTimers?.[associatedStructureKey] !== undefined;
    /** @type {Object.<string, number>} */
    const collectedMaterials = {};
    /** @type {Object.<string, number>} */
    const collectedSeeds = {};

    // Collect all blocks in the structure
    for (const block of associatedStructure.blocks) {
      if (typeof block === "string") continue;
      const bKey = `${block.x},${block.y},${block.z}`;
      const bId = gameState.world.get(bKey);

      if (bId !== undefined && bId !== 0) {
        const isRoot = bKey === associatedStructureKey;
        const result = collectDrop(bId, {
          isImmature,
          isRoot,
          silent: true,
          includeBlock: true,
        });

        // Aggregate materials
        result.materials.forEach((name) => {
          collectedMaterials[name] = (collectedMaterials[name] || 0) + 1;
        });

        // Aggregate seeds
        result.seeds.forEach((name) => {
          collectedSeeds[name] = (collectedSeeds[name] || 0) + 1;
        });

        // Use false for shouldUpdateMesh to avoid redundant work
        gameState.world.delete(bKey, false);
      }
    }

    // Now trigger a mesh update for the final block remove to ensure visuals refresh
    gameState.world.delete(key, true);

    // Show summary toast
    const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
    const shadow = /** @type {ShadowRoot | null} */ (
      getShadowRoot(gThis.document, "block-garden")
    );
    if (shadow) {
      const items = [];
      for (const [name, count] of Object.entries(collectedMaterials)) {
        items.push(count > 1 ? `${name} x${count}` : name);
      }

      for (const [name, count] of Object.entries(collectedSeeds)) {
        items.push(count > 1 ? `${name} x${count}` : name);
      }

      if (items.length > 0) {
        const plantName = associatedStructure.type || "Plant";

        showToast(shadow, `Harvested ${plantName}: ${items.join(", ")}`);
      }
    }

    // Clean up structure tracking
    if (associatedStructureKey) {
      delete gameState.plantStructures[associatedStructureKey];
      const growthTimers = gameState.growthTimers;
      if (growthTimers) {
        delete growthTimers[associatedStructureKey];
      }
    }

    return true;
  }

  // Fallback: Regular block removal
  collectDrop(blockId, { isImmature: false });
  gameState.world.delete(key, true);

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

  if (!chunk) {
    console.warn("Failed to get or create chunk");

    return;
  }

  const localX = ((x % 16) + 16) % 16;
  const localZ = ((z % 16) + 16) % 16;

  const metadata = chunk.metadata.get(chunk.index(localX, y, localZ));
  if (!metadata || !metadata.worldName) {
    console.warn("Link block has no metadata or world name");

    return;
  }

  const { worldName, params = {} } = metadata;
  const shadow = /** @type {ShadowRoot | null} */ (
    getShadowRoot(globalThis.document, "block-garden")
  );

  if (!shadow) {
    return;
  }

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

  const shadowLink = getShadowRoot(globalThis.document, "block-garden");
  if (!shadowLink) {
    return;
  }

  shadowLink.append(dialog);
  dialog.showModal();

  const autofocusElement = dialog.querySelector("[autofocus]");
  if (autofocusElement instanceof HTMLElement) {
    autofocusElement.focus();
  }

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  const cancelBtn = /** @type {HTMLElement | null} */ (
    dialog.querySelector("#cancelTravel")
  );

  if (cancelBtn) cancelBtn.addEventListener("click", closeDialog);

  // Close on Escape is handled by dialog naturally but we need to reset gameState
  dialog.addEventListener("close", closeDialog);

  const confirmBtn = /** @type {HTMLElement | null} */ (
    dialog.querySelector("#confirmTravel")
  );

  if (confirmBtn)
    confirmBtn.addEventListener("click", () => {
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

  if (!chunk) {
    console.warn("Failed to get or create chunk");

    return;
  }

  const localX = ((x % 16) + 16) % 16;
  const localZ = ((z % 16) + 16) % 16;

  const metadata = chunk.metadata.get(chunk.index(localX, y, localZ));
  const text = metadata?.text || "No text saved in this block.";
  const shadow = /** @type {ShadowRoot | null} */ (
    getShadowRoot(globalThis.document, "block-garden")
  );

  if (!shadow) {
    return;
  }

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

  const shadowText = getShadowRoot(globalThis.document, "block-garden");
  if (!shadowText) {
    return;
  }

  shadowText.append(dialog);
  dialog.showModal();

  const autofocusElement = /** @type {HTMLButtonElement | null} */ (
    await waitForElement({
      getElement: () => dialog.querySelector("[autofocus]"),
      intervalMs: 150,
      timeoutMs: 1000,
    })
  );

  if (!autofocusElement) {
    console.warn("Autofocus element not found");

    return;
  }

  autofocusElement.focus();

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  const closeTextBtn = /** @type {HTMLElement | null} */ (
    dialog.querySelector("#closeTextDialog")
  );

  if (closeTextBtn) {
    closeTextBtn.addEventListener("click", closeDialog);
  }

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

  // Prevent breaking non-removable blocks (e.g. Water) or unbreakable blocks (e.g. Bedrock)
  const blockDef = blocks.getById(blockId);
  if (blockDef && (blockDef.name === "Water" || blockDef.breakTime === null)) {
    stopBreaking(gameState);

    return;
  }

  // If we are already breaking THIS block, do nothing (continue breaking)
  const breaking = /** @type {any} */ (gameState.breaking);
  if (
    breaking.active &&
    breaking.blockPos &&
    breaking.blockPos.x === hit.x &&
    breaking.blockPos.y === hit.y &&
    breaking.blockPos.z === hit.z
  ) {
    return;
  }

  // Start breaking new block
  gameState.breaking.active = true;
  gameState.breaking.startTime = performance.now();

  const blockPosData = { x: hit.x, y: hit.y, z: hit.z };
  gameState.breaking.blockPos = blockPosData;
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
      ? /** @type {HTMLCanvasElement | null} */ (
          shadow.getElementById("canvas")
        )
      : null;

    if (canvas) {
      const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;
      const result = raycastFromCanvasCoords(
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

      targetHit = result.hit;
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
  const cursorTarget = { x: targetHit.x, y: targetHit.y, z: targetHit.z };
  gameState.cursorTarget = cursorTarget;

  // Compare with current breaking target
  if (gameState.breaking.active) {
    // Check if we are still on the same block
    const bPos = gameState.breaking.blockPos;
    if (
      bPos &&
      bPos.x === targetHit.x &&
      bPos.y === targetHit.y &&
      bPos.z === targetHit.z
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
  if (gameState.breaking.active && gameState.breaking.currentBlockId !== null) {
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
      ? /** @type {HTMLCanvasElement | null} */ (
          shadow.getElementById("canvas")
        )
      : null;

    if (canvas) {
      const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;
      const result = raycastFromCanvasCoords(
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

      targetHit = result.hit;
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

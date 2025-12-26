import { debounce } from "../util/debounce.mjs";
import { effect } from "../util/effect.mjs";
import { getBlock } from "../util/world.mjs";
import { intersects } from "../util/aabb.mjs";
import { resizeCanvas } from "../util/resizeCanvas.mjs";

import { gameConfig } from "../state/config/index.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { loadSaveState } from "../state/loadSave.mjs";

import { generateProceduralWorld } from "../generate/world.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('./game.mjs').CustomShadowHost} CustomShadowHost */

/**
 * @param {MouseEvent} e
 *
 * @returns {void}
 */
function handleCornerClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const heading = e.currentTarget;
  if (heading instanceof HTMLDivElement) {
    const cornerContainer = heading.nextElementSibling;

    if (cornerContainer.getAttribute("hidden") !== null) {
      cornerContainer.removeAttribute("hidden");

      return;
    }

    cornerContainer.setAttribute("hidden", "hidden");
  }
}

function handleBackquoteClick(gameState) {
  return () => {
    gameState.curBlock.set(
      (gameState.curBlock.get() + 1) % gameConfig.blocks.length,
    );
  };
}
/**
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Signal.State} currentResolution - Signal State for current resolution
 *
 * @returns {void}
 */
// Shared state to track touch interactions
let lastTouchTime = 0;

/**
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Signal.State} currentResolution - Signal State for current resolution
 *
 * @returns {void}
 */
export function initElementEventListeners(shadow, cnvs, currentResolution) {
  // Fast Growth Button
  const fastGrowthButton = shadow.getElementById("fastGrowthButton");
  if (fastGrowthButton) {
    fastGrowthButton.addEventListener("click", () => {
      gameState.fastGrowth = !gameState.fastGrowth;

      fastGrowthButton.textContent = gameState.fastGrowth
        ? "Disable Fast Growth"
        : "Enable Fast Growth";
      fastGrowthButton.style.backgroundColor = gameState.fastGrowth
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";
      fastGrowthButton.style.color = "var(--bg-color-white)";

      shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
    });

    // Set initial button state
    fastGrowthButton.textContent = "Enable Fast Growth";
    fastGrowthButton.style.backgroundColor = "var(--bg-color-green-500)";
    fastGrowthButton.style.color = "var(--bg-color-white)";
  }

  // Set isPrePlanted to true by default
  const gameState = globalThis.blockGarden.state;
  gameState.isPrePlanted = true;

  const host =
    /** @type {CustomShadowHost} */
    (shadow.host);

  // Toggle Pre-Planting Button
  const togglePrePlanting = shadow.getElementById("togglePrePlanting");
  if (togglePrePlanting) {
    togglePrePlanting.addEventListener("click", () => {
      gameState.isPrePlanted = !gameState.isPrePlanted;
      togglePrePlanting.textContent = gameState.isPrePlanted
        ? "Disable Pre-Planting"
        : "Enable Pre-Planting";
      togglePrePlanting.style.backgroundColor = gameState.isPrePlanted
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";
      togglePrePlanting.style.color = "var(--bg-color-white)";
    });
    // Set initial button state
    togglePrePlanting.textContent = gameState.isPrePlanted
      ? "Disable Pre-Planting"
      : "Enable Pre-Planting";
    togglePrePlanting.style.backgroundColor = gameState.isPrePlanted
      ? "var(--bg-color-red-500)"
      : "var(--bg-color-green-500)";
    togglePrePlanting.style.color = "var(--bg-color-white)";
  }

  // Random Plant Again Button
  const randomPlantButton = shadow.getElementById("randomPlantButton");
  if (randomPlantButton) {
    randomPlantButton.addEventListener("click", () => {
      // Call the random planting logic again on the current world
      if (typeof randomPlantSeeds === "function") {
        randomPlantSeeds();

        alert("Random planting complete!");
      }
    });
  }
  const backquote = shadow.querySelector('[data-key="backquote"]');

  backquote.addEventListener("click", handleBackquoteClick(gameState));
  backquote.addEventListener("touchstart", handleBackquoteClick(gameState));

  shadow
    .querySelector('[data-key="backquote"]')
    .addEventListener("click", () => {
      gameState.curBlock.set(
        (gameState.curBlock.get() + 1) % gameConfig.blocks.length,
      );
    });

  shadow.addEventListener(
    "keyup",
    /** @param {KeyboardEvent} e */
    (e) => {
      host.keys[e.key.toLowerCase()] = false;

      e.preventDefault();
    },
  );

  const resolutionSelectEl = shadow.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener(
      "change",
      (
        /** @type {CustomEvent} */
        e,
      ) => {
        gameConfig.currentResolution.set(e.detail.value);

        resizeCanvas(shadow, gameConfig.currentResolution);
      },
    );
  }

  shadow.addEventListener(
    "mousemove",
    (
      /** @type MouseEvent */
      e,
    ) => {
      if (
        globalThis.document.pointerLockElement === cnvs ||
        globalThis.document.pointerLockElement === shadow.host
      ) {
        gameState.yaw -= e.movementX * 0.0025;
        const MAX_PITCH = Math.PI / 2 - 0.01;
        gameState.pitch = Math.max(
          -MAX_PITCH,
          Math.min(MAX_PITCH, gameState.pitch - e.movementY * 0.0025),
        );
      }
    },
  );

  // Prevent default touch behaviors and track touch time
  shadow.addEventListener(
    "touchstart",
    (e) => {
      lastTouchTime = Date.now();
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  shadow.addEventListener(
    "touchmove",
    (e) => {
      lastTouchTime = Date.now();
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  shadow.addEventListener(
    "touchend",
    (e) => {
      lastTouchTime = Date.now();
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  // Prevent context menu on long press
  shadow.addEventListener("contextmenu", (e) => {
    if (
      (e.target instanceof HTMLDivElement &&
        e.target.closest(".touch-controls")) ||
      e.target === shadow.getElementById("canvas")
    ) {
      e.preventDefault();
    }
  });

  // Prevent zoom on double tap
  shadow.addEventListener("dblclick", (e) => {
    if (
      (e.target instanceof HTMLDivElement &&
        e.target.closest(".touch-controls")) ||
      e.target === shadow.getElementById("canvas")
    ) {
      e.preventDefault();
    }
  });

  const corners = shadow.querySelectorAll(".ui-grid__corner");
  corners.forEach((corner) => {
    const heading = corner.querySelector(".ui-grid__corner--heading");

    heading.addEventListener(
      "click",
      (
        /** @type MouseEvent */
        e,
      ) => handleCornerClick(e),
    );
  });

  const loadworldButton = shadow.getElementById("loadInput");
  loadworldButton.addEventListener("change", async (e) => {
    const file =
      /**@type {HTMLInputElement} */
      (e.target).files[0];

    if (!file) {
      return;
    }

    const world = await loadSaveState(globalThis, file, gameState.world);

    // Reposition player to the top-most block
    const { x, z, playerHeight } = gameState;
    let foundY = -Infinity;

    // Scan downwards from a high point to find the first solid block
    for (let y = 255; y >= -64; y--) {
      if (getBlock(world, x, y, z)) {
        foundY = y;

        break;
      }
    }

    // Place player on top of the found block, at eye height
    // foundY is the coordinate of the block, so foundY + 1 is the surface
    gameState.y = foundY + 1 + 1.62;
    gameState.dy = 0;

    alert(`Loaded ${world.chunks.size} chunks!`);
  });

  const saveWorldButton = shadow.getElementById("saveWorld");
  saveWorldButton.addEventListener("click", async () => {
    const world = createSaveState(gameState.world);
    const jsonStream = new globalThis.Blob([JSON.stringify(world)]).stream();
    const gzipStream = jsonStream.pipeThrough(
      new globalThis.CompressionStream("gzip"),
    );
    const blob = await new globalThis.Response(gzipStream).blob();

    const a = globalThis.document.createElement("a");
    a.href = globalThis.URL.createObjectURL(blob);
    a.download = "block-garden.json.gz";
    a.click();

    URL.revokeObjectURL(a.href);
  });

  const generateWorldButton = shadow.getElementById("generateWorldButton");
  if (generateWorldButton) {
    generateWorldButton.addEventListener("click", () => {
      if (!confirm("Are you sure you want to generate a new world?")) {
        return;
      }

      // Set a new random seed
      gameState.seed = Math.random();

      // Use the current value of isPrePlanted
      generateProceduralWorld(gameConfig, gameState);

      alert("New world generated!");
    });
  }

  // planting logic for randomPlantButton ---
  function randomPlantSeeds() {
    // Reuse the logic from generateProceduralWorld, but only the pre-planting part
    const { blocks, blockNames } = gameConfig;
    const { world } = gameState;
    // Helper to find block IDs
    const getBlockId = (name) => blocks.findIndex((b) => b.name === name);
    const GRASS = getBlockId(blockNames.GRASS);
    const WORLD_RADIUS = 16;
    const MIN_Y = 1;
    const MAX_Y = 24;
    const SEA_LEVEL = 4;

    // Collect valid grass tiles
    const validSeedSpots = [];
    for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x++) {
      for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z++) {
        for (let y = MIN_Y; y <= MAX_Y; y++) {
          const key = `${x},${y},${z}`;
          // Allow planting on any grass tile, regardless of y
          if (
            world.get(key) === GRASS &&
            (Math.abs(x) > 2 || Math.abs(z) > 2)
          ) {
            validSeedSpots.push({ x, y, z, key });
          }
        }
      }
    }
    // Place one of each seed at a random valid spot
    if (validSeedSpots.length > 0) {
      const usedKeys = new Set();
      blocks.forEach((block, blockId) => {
        if (block.isSeed) {
          let spot = null;
          let attempts = 0;
          while (attempts < 100 && !spot) {
            const candidate =
              validSeedSpots[Math.floor(Math.random() * validSeedSpots.length)];
            if (candidate && !usedKeys.has(candidate.key)) {
              spot = candidate;
              usedKeys.add(candidate.key);
            }
            attempts++;
          }
          if (spot) {
            world.set(spot.key, blockId);
            gameState.plantStructures[spot.key] = {
              type: block.name,
              blocks: [spot.key],
            };
            gameState.growthTimers[spot.key] = block.growthTime || 10.0;
          }
        }
      });
    }

    // Ensure growthTimers are updated for fast growth if enabled
    if (gameState.fastGrowth) {
      shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
    }
  }

  const debouncedResize = debounce(() => {
    resizeCanvas(shadow, currentResolution);
  }, 200);

  const resizeObserver = new ResizeObserver((entries) => {
    debouncedResize();
  });

  resizeObserver.observe(shadow.host);

  const toggleTouchControls = shadow.getElementById("toggleTouchControls");
  if (toggleTouchControls) {
    toggleTouchControls.addEventListener("click", () => {
      gameConfig.useTouchControls.set(!gameConfig.useTouchControls.get());
    });

    effect(() => {
      const enabled = gameConfig.useTouchControls.get();
      toggleTouchControls.textContent = enabled
        ? "Disable Touch Controls"
        : "Enable Touch Controls";
      toggleTouchControls.style.backgroundColor = enabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";
      toggleTouchControls.style.color = "var(--bg-color-white)";
    });
  }
}

/**
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Object} blocks
 * @param {Signal.State} curBlock
 *
 * @returns {void}
 */
export function initCanvasEventListeners(shadow, cnvs, blocks, curBlock) {
  // Keyboard events
  cnvs.addEventListener(
    "keydown",
    /** @param {KeyboardEvent} e */
    async (e) => {
      const lowercaseKey = e.key.toLowerCase();

      const host =
        /** @type {CustomShadowHost} */
        (shadow.host);
      host.keys[lowercaseKey] = true;

      if (lowercaseKey === "`" || lowercaseKey === "~") {
        e.preventDefault();
        if (e.code === "Backquote" || e.code === "Accent") {
          const blockCount = gameConfig.blocks.length;
          const forward = !e.shiftKey;
          const newIndex = forward
            ? (curBlock.get() + 1) % blockCount
            : (curBlock.get() - 1 + blockCount) % blockCount;
          curBlock.set(newIndex);
        }
      }
    },
  );

  cnvs.addEventListener("click", () => {
    cnvs?.requestPointerLock();
  });

  cnvs.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  cnvs.addEventListener("mousedown", (e) => {
    // Ignore mousedown if it happened shortly after a touch event
    if (Date.now() - lastTouchTime < 1000) {
      return;
    }

    const gameState = globalThis.blockGarden.state;
    const hit = gameState.hit;

    if (!hit) {
      return;
    }

    const k = `${hit.x},${hit.y},${hit.z}`;
    const world = gameState.world;

    if (e.button === 0 && hit.face) {
      const newBlockX = hit.x + hit.face.x;
      const newBlockY = hit.y + hit.face.y;
      const newBlockZ = hit.z + hit.face.z;

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

      if (!intersects(playerAABB, newBlockAABB)) {
        const curBlockId = gameState.curBlock.get();
        world.set(`${newBlockX},${newBlockY},${newBlockZ}`, curBlockId);

        // seed growth logic
        // Plant growth logic
        const placedBlock = blocks[curBlockId];
        if (placedBlock && placedBlock.isSeed) {
          const key = `${newBlockX},${newBlockY},${newBlockZ}`;
          if (!gameState.growthTimers) gameState.growthTimers = {};
          if (!gameState.plantStructures) gameState.plantStructures = {};

          const growthTime = placedBlock.growthTime || 10.0;
          gameState.growthTimers[key] = growthTime;
          gameState.plantStructures[key] = {
            type: placedBlock.name,
            blocks: [],
          };
        }
      }
    }

    if (e.button === 2) {
      world.delete(k);
    }
  });
}

import Hammer from "hammerjs";
import { intersects } from "../util/aabb.mjs";
import { blocks as blockDefs, blockNames } from "../state/config/blocks.mjs";

/** @typedef {import('./game.mjs').CustomShadowHost} CustomShadowHost */

/**
 * Initialize HammerJS controls
 *
 * @param {Hammer.Manager} stage
 * @param {ShadowRoot} shadow
 * @param {Object} gameState
 */
export function initHammerControls(stage, shadow, gameState) {
  const pan = stage.get("pan");
  const press = stage.get("press");
  const tap = stage.get("tap");

  // Setup Pan for Looking
  pan.set({ direction: Hammer.DIRECTION_ALL, threshold: 10 });

  // Setup Press for Breaking (Hold)
  // Ensure we can look around while holding to break
  press.set({ time: 500 }).recognizeWith(pan);

  // Setup Tap for Placing
  // Tap should only fire if we didn't pan or press
  tap.set({ interval: 150, threshold: 5 });
  tap.requireFailure(press);
  tap.requireFailure(pan);

  let lastDeltaX = 0;
  let lastDeltaY = 0;

  const isUIInteraction = (ev) => {
    // Robust check: determine element at the center of the gesture
    // This bypasses event bubbling/shadow DOM target issues
    const target = shadow.elementFromPoint(ev.center.x, ev.center.y);

    if (!target) {
      return false;
    }

    return (
      target.closest(".ui-grid__corner") !== null ||
      target.closest(".touch-btn") !== null
    );
  };

  // View Looking (Pan)
  stage.on("panstart", (ev) => {
    if (isUIInteraction(ev)) {
      return;
    }
    lastDeltaX = 0;
    lastDeltaY = 0;
  });

  stage.on("panmove", (ev) => {
    if (isUIInteraction(ev)) {
      return;
    }

    // Calculate delta since last event
    const deltaX = ev.deltaX - lastDeltaX;
    const deltaY = ev.deltaY - lastDeltaY;

    lastDeltaX = ev.deltaX;
    lastDeltaY = ev.deltaY;

    // Adjust sensitivity
    const SENSITIVITY = 0.005;

    gameState.yaw -= deltaX * SENSITIVITY;

    const MAX_PITCH = Math.PI / 2 - 0.01;
    gameState.pitch = Math.max(
      -MAX_PITCH,
      Math.min(MAX_PITCH, gameState.pitch - deltaY * SENSITIVITY),
    );
  });

  stage.on("panend", () => {
    lastDeltaX = 0;
    lastDeltaY = 0;
  });

  // Block Placing (Tap)
  stage.on("tap", (ev) => {
    if (isUIInteraction(ev)) {
      return;
    }

    // Prevent native click/mousedown from firing
    if (ev.srcEvent && ev.srcEvent.cancelable) {
      ev.srcEvent.preventDefault();
    }

    if (ev.pointerType === "mouse") {
      return;
    }

    // Skip if a UI button is active (e.g., jump/dig buttons)
    if (gameState.uiButtonActive) {
      return;
    }

    // Use the ray-cast hit target (crosshairs aim point)
    const hit = gameState.hit;

    if (hit && hit.face) {
      const newBlockX = hit.x + hit.face.x;
      const newBlockY = hit.y + hit.face.y;
      const newBlockZ = hit.z + hit.face.z;

      // Collision check
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
        gameState.world.set(
          `${newBlockX},${newBlockY},${newBlockZ}`,
          curBlockId,
        );

        // seed growth logic
        const placedBlock = blockDefs[curBlockId];
        if (placedBlock && placedBlock.isSeed) {
          if (!gameState.growthTimers) gameState.growthTimers = {};
          if (!gameState.plantStructures) gameState.plantStructures = {};

          const key = `${newBlockX},${newBlockY},${newBlockZ}`;
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
      }
    }
  });

  // Block Breaking (Press/Hold)
  let breakInterval = null;

  const stopBreaking = () => {
    if (breakInterval) {
      clearInterval(breakInterval);
      breakInterval = null;
    }
  };

  stage.on("press", (ev) => {
    if (isUIInteraction(ev)) {
      return;
    }

    // Break immediately
    const hit = gameState.hit;
    if (hit) {
      gameState.world.delete(`${hit.x},${hit.y},${hit.z}`);
    }

    // Start continuous breaking
    stopBreaking();
    breakInterval = setInterval(() => {
      const currentHit = gameState.hit;
      if (currentHit) {
        gameState.world.delete(
          `${currentHit.x},${currentHit.y},${currentHit.z}`,
        );
      }
    }, 500); // 500ms delay between breaks
  });

  stage.on("pressup", stopBreaking);
  stage.on("panend", stopBreaking); // Safety release
}

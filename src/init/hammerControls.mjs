import Hammer from "hammerjs";
import { intersects } from "../util/aabb.mjs";
import { blocks as blockDefs, blockNames } from "../state/config/blocks.mjs";
import { raycastFromCanvasCoords } from "../util/raycastFromCanvasCoords.mjs";
import { placeBlock, removeBlock } from "../util/interaction.mjs";
import { gameConfig } from "../state/config/index.mjs";

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
  tap.set({ interval: 50, threshold: 5 });
  tap.requireFailure(press);
  tap.requireFailure(pan);

  let lastDeltaX = 0;
  let lastDeltaY = 0;

  let lastPointerPos = { x: 0, y: 0 };

  shadow.addEventListener(
    "pointermove",
    (e) => {
      const pointerEvent = /** @type {PointerEvent} */ (e);
      lastPointerPos.x = pointerEvent.clientX;
      lastPointerPos.y = pointerEvent.clientY;
    },
    { passive: true },
  );

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

    if (ev.pointerType === "mouse" && gameConfig.useSplitControls.get()) {
      return;
    }

    // Skip if a UI button is active (e.g., jump/dig buttons)
    if (gameState.uiButtonActive) {
      return;
    }

    let hit = gameState.hit;

    if (!gameConfig.useSplitControls.get()) {
      const canvas = /** @type {HTMLCanvasElement} */ (
        shadow.getElementById("canvas")
      );

      const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;

      const { hit: rayHit } = raycastFromCanvasCoords(
        canvas,
        ev.center.x,
        ev.center.y,
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
      // If we raycast from touch, we ONLY use the touch result.
      // If it's null (miss), we pass null.
      hit = rayHit;
    }

    // Pass the specific hit target. If hit is null (and we are in non-split mode),
    // placeBlock will receive null.
    // However, placeBlock still has: const hit = targetHit || gameState.hit;
    // We need to prevent placeBlock from using the fallback if we INTENDED to use a specific hit (even if null).
    // Or simpler: only call placeBlock if hit is valid?
    // If I tap the sky, interaction should happen with sky (nothing).
    // So if hit is null, we do NOTHING.
    // This differs from "Split Controls ON" where hit is always gameState.hit (which might be null).
    // If Split ON, gameState.hit is passed. if null, nothing happens.
    // If Split OFF, rayHit is passed. If null, nothing happens.
    // The issue was placeBlock's fallback: `targetHit || gameState.hit`.
    // If rayHit is null, placeBlock sees null, and falls back to gameState.hit.

    // Changing placeBlock is risky for other calls (if any).
    // Better to handle it here: call placeBlock only if hit is valid, OR pass a non-null object that signifies "Miss" if needed?
    // Actually, placeBlock returns false if (!hit ...).
    // So if I pass null, and it falls back, that's bad.
    // If I pass {hit: null}? No.
    // I should simply pass `hit` but ensure I don't call it if I missed?
    // Or I modify placeBlock to accept `useFallback`?
    // Or I check here.

    if (gameConfig.useSplitControls.get()) {
      // Split controls active: use center hit (gameState.hit)
      placeBlock(gameState);
    } else {
      // Split controls inactive: use rayHit
      if (hit) {
        // We have a direct hit, use it
        // We pass it as targetHit. placeBlock uses it.
        placeBlock(gameState, hit);
      }
      // If no hit, do nothing. Do not fallback to center.
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

    let hit = gameState.hit;

    if (!gameConfig.useSplitControls.get()) {
      const canvas = /** @type {HTMLCanvasElement} */ (
        shadow.getElementById("canvas")
      );

      const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;

      const { hit: rayHit } = raycastFromCanvasCoords(
        canvas,
        ev.center.x,
        ev.center.y,
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
      hit = rayHit;
    }

    if (hit) {
      removeBlock(gameState, hit);
    }

    // Start continuous breaking
    stopBreaking();
    breakInterval = setInterval(() => {
      // Re-calculate raycast if split controls are off
      let currentHit = gameState.hit;

      if (!gameConfig.useSplitControls.get()) {
        const canvas = /** @type {HTMLCanvasElement} */ (
          shadow.getElementById("canvas")
        );

        // Use the latest tracked pointer position
        const pointerX =
          ev.pointerType === "mouse" ? lastPointerPos.x : ev.center.x;
        const pointerY =
          ev.pointerType === "mouse" ? lastPointerPos.y : ev.center.y;

        const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;

        const { hit: rayHit } = raycastFromCanvasCoords(
          canvas,
          pointerX,
          pointerY,
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
        currentHit = rayHit;
      }

      if (currentHit) {
        removeBlock(gameState, currentHit);
      }
    }, 500); // 500ms delay between breaks
  });

  stage.on("pressup", stopBreaking);
  stage.on("panend", stopBreaking); // Safety release
}

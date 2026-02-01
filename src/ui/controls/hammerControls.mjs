import Hammer from "hammerjs";

import { raycastFromCanvasCoords } from "../../utils/raycastFromCanvasCoords.mjs";
import { placeBlock } from "../../utils/interaction.mjs";

import { gameConfig } from "../../world/config/index.mjs";
import { startDigHighlight, stopDigHighlight } from "../utils/digHighlight.mjs";

/** @typedef {import('../../core/systems/game/init.mjs').CustomShadowHost} CustomShadowHost */

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
  press.set({ time: 500, threshold: 50 }).recognizeWith(pan);

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

  const updateCursorPos = (x, y) => {
    if (
      gameState.breakingInput.isHeld &&
      gameState.breakingInput.mode === "cursor"
    ) {
      gameState.breakingInput.cursorX = x;
      gameState.breakingInput.cursorY = y;
    }

    // Always update cursorTarget for highlighting if split controls are OFF
    if (!gameConfig.useSplitControls.get()) {
      const canvas =
        /** @type {HTMLCanvasElement} */
        (shadow.getElementById("canvas"));

      if (canvas) {
        const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;
        const { hit: rayHit } = raycastFromCanvasCoords(
          canvas,
          x,
          y,
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

        if (rayHit) {
          gameState.cursorTarget = { x: rayHit.x, y: rayHit.y, z: rayHit.z };
        } else {
          gameState.cursorTarget = null;
        }
      }
    }
  };

  shadow.addEventListener(
    "pointermove",
    (
      /** @type {PointerEvent} */
      e,
    ) => {
      updateCursorPos(e.clientX, e.clientY);
    },
  );

  shadow.addEventListener(
    "touchmove",
    (
      /** @type {TouchEvent} */
      e,
    ) => {
      if (e.touches && e.touches[0]) {
        updateCursorPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
  );

  const isUIInteraction = (ev) => {
    // Robust check: determine element at the center of the gesture
    // This bypasses event bubbling/shadow DOM target issues
    const target = shadow.elementFromPoint(ev.center.x, ev.center.y);

    if (!target) {
      return false;
    }

    return (
      target.closest(`
        dialog,
        #materialBar,
        .touch-btn,
        .seed-controls,
        .settings-actions,
        .ui-grid__corner,
        .ui-grid__corner--container
      `) !== null ||
      (target.closest("block-garden") &&
        /** @type {any} */
        (ev).type !== "panstart" &&
        /** @type {any} */
        (ev).type !== "panmove")
    );
  };

  let isPanning = false;

  // View Looking (Pan)
  stage.on("panstart", (ev) => {
    if (isUIInteraction(ev)) {
      return;
    }

    const target = shadow.elementFromPoint(ev.center.x, ev.center.y);
    const canvas = shadow.getElementById("canvas");
    gameState.panStartedOnCanvas = target === canvas;

    isPanning = true;

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

    // Update cursor target during panning to keep highlight under finger/cursor
    // Only if the pan started on the canvas.
    if (gameState.panStartedOnCanvas) {
      updateCursorPos(ev.center.x, ev.center.y);
    } else {
      gameState.cursorTarget = null;
    }
  });

  stage.on("panend", () => {
    isPanning = false;
    gameState.panStartedOnCanvas = false;

    lastDeltaX = 0;
    lastDeltaY = 0;
  });

  // Block Placing (Tap)
  stage.on("tap", (ev) => {
    if (isUIInteraction(ev)) {
      return;
    }

    // Skip if a UI button is active (e.g., jump/dig buttons)
    if (gameState.uiButtonActive) {
      return;
    }

    // Prevent native click/mousedown from firing
    if (ev.srcEvent && ev.srcEvent.cancelable) {
      ev.srcEvent.preventDefault();
    }

    // Ignore Tap From Mouse
    // We handle mouse placement in mousedown (Right Click) logic.
    // HammerJS "tap" corresponds to Left Click on mouse, which we now use for Breaking.
    if (ev.pointerType === "mouse") {
      return;
    }

    let hit = gameState.hit;

    if (!gameConfig.useSplitControls.get()) {
      const canvas =
        /** @type {HTMLCanvasElement} */
        (shadow.getElementById("canvas"));

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

    if (gameState.isCanvasActionDisabled) {
      return;
    }

    if (gameConfig.useSplitControls.get()) {
      // use center hit (gameState.hit)
      placeBlock(gameState);
    } else {
      if (hit) {
        // use rayHit
        placeBlock(gameState, hit);
      }
    }
  });

  // Block Breaking (Press/Hold)
  const cancelBreaking = () => {
    gameState.breakingInput.isHeld = false;
    gameState.cursorTarget = null;

    stopDigHighlight(shadow);
  };

  stage.on("press", (ev) => {
    if (isUIInteraction(ev)) {
      return;
    }

    if (isPanning) {
      return;
    }

    gameState.breakingInput.isHeld = true;
    gameState.breakingInput.mode = "cursor";
    gameState.breakingInput.cursorX = ev.center.x;
    gameState.breakingInput.cursorY = ev.center.y;

    // Immediately raycast to set cursorTarget for highlighting
    if (!gameConfig.useSplitControls.get()) {
      const canvas =
        /** @type {HTMLCanvasElement} */
        (shadow.getElementById("canvas"));

      if (canvas) {
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

        if (rayHit) {
          gameState.cursorTarget = { x: rayHit.x, y: rayHit.y, z: rayHit.z };
        }
      }
    }

    startDigHighlight(shadow);
  });

  stage.on("pressup", cancelBreaking);
}

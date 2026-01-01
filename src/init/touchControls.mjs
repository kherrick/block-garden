import { gameConfig, gameState } from "../state/state.mjs";

/** @typedef {import('./game.mjs').CustomShadowHost} CustomShadowHost */

/**
 * Touch controls
 *
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
export function initTouchControls(shadow) {
  const host =
    /** @type {CustomShadowHost} */
    (shadow.host);
  const touchButtons = shadow.querySelectorAll(".touch-btn");

  touchButtons.forEach((btn) => {
    const key = btn.getAttribute("data-key");

    let isPressed = false;
    let intervalId = null;

    function executeKeyAction() {
      host.touchKeys[key] = true;

      if (btn instanceof HTMLButtonElement) {
        btn.style.background = "var(--bg-color-gray-alpha-30)";
      }
    }

    function startHeldAction() {
      if (isPressed) {
        return;
      }

      isPressed = true;
      gameState.uiButtonActive = true;

      // Immediate execution
      executeKeyAction();

      // Handle touch UI block removal
      if (key === "backspace") {
        const hit = gameState.hit;

        if (hit) {
          gameState.world.delete(`${hit.x},${hit.y},${hit.z}`);
        }
      }
    }

    function stopHeldAction() {
      isPressed = false;
      gameState.uiButtonActive = false;

      host.touchKeys[key] = false;

      if (btn instanceof HTMLButtonElement) {
        btn.style.background = "var(--bg-ui-touch-btn-background-color)";
      }

      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    // Touch events
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();

      startHeldAction();
    });

    btn.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();

      stopHeldAction();
    });

    btn.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      e.stopPropagation();

      stopHeldAction();
    });

    // Mouse events
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      startHeldAction();
    });

    btn.addEventListener("mouseup", (e) => {
      e.preventDefault();
      e.stopPropagation();

      stopHeldAction();
    });

    btn.addEventListener("mouseleave", (e) => {
      e.preventDefault();
      e.stopPropagation();

      stopHeldAction();
    });

    // Stop HammerJS from seeing D-pad interactions via Pointer Events
    btn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
  });

  // Prevent default touch behaviors
  shadow.addEventListener(
    "touchstart",
    (e) => {
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  shadow.addEventListener(
    "touchmove",
    (e) => {
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  shadow.addEventListener(
    "touchend",
    (e) => {
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        e.preventDefault();
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
}

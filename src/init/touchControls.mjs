import { dismissTutorialToast } from "../util/dismissTutorialToast.mjs";
import {
  gameConfig,
  gameState,
  hasDismissedTutorial,
} from "../state/state.mjs";
import { handleBreakBlockWithWaterPhysics } from "../misc/handleBreakBlock.mjs";
import { handleFarmAction } from "../misc/handleFarmAction.mjs";
import { handlePlaceBlock } from "../misc/handlePlaceBlock.mjs";

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
        btn.style.background = "var(--sg-color-gray-alpha-30)";
      }

      if (
        !hasDismissedTutorial.get() &&
        (key === "r" || key === "w" || key === "upright" || key == "upleft")
      ) {
        dismissTutorialToast(shadow);
      }

      if (key === "f") {
        handleFarmAction(
          shadow,
          gameState.growthTimers,
          gameState.plantStructures,
          gameState.player.get(),
          gameState.seedInventory.get(),
          gameState.selectedSeedType.get(),
          gameConfig.TILES,
          gameConfig.TILE_SIZE.get(),
          gameState.world.get(),
          gameConfig.WORLD_HEIGHT.get(),
          gameConfig.WORLD_WIDTH.get(),
        );
      }

      if (key === "r") {
        handleBreakBlockWithWaterPhysics(
          shadow,
          gameState.growthTimers,
          gameState.plantStructures,
          gameState.player,
          gameConfig.TILES,
          gameConfig.TILE_SIZE.get(),
          gameState.world,
          gameConfig.WORLD_HEIGHT.get(),
          gameConfig.WORLD_WIDTH.get(),
          gameState.waterPhysicsQueue,
          gameConfig.breakMode.get(),
        );
      }
    }

    function startHeldAction() {
      if (isPressed) {
        return;
      }

      isPressed = true;

      // Immediate execution
      executeKeyAction();

      // Repeat only for f and r keys every 100ms
      if (key === "f" || key === "r") {
        intervalId = setInterval(executeKeyAction, 100);
      }
    }

    function stopHeldAction() {
      isPressed = false;

      host.touchKeys[key] = false;

      if (btn instanceof HTMLButtonElement) {
        btn.style.background = "var(--sg-ui-touch-btn-background-color)";
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
  });

  // Handle block placement mobile controls
  shadow.querySelectorAll(".touch-btn.place-block").forEach(
    (
      /** @type HTMLDivElement */
      pb,
    ) => {
      pb.addEventListener(
        "touchstart",
        async () =>
          await handlePlaceBlock(
            shadow,
            pb.dataset.key,
            gameState.materialsInventory.get(),
            gameState.player.get(),
            gameState.selectedMaterialType.get(),
            gameConfig.TILES,
            gameConfig.TILE_SIZE.get(),
            gameState.world.get(),
            gameConfig.WORLD_HEIGHT.get(),
            gameConfig.WORLD_WIDTH.get(),
          ),
      );

      pb.addEventListener(
        "click",
        async () =>
          await handlePlaceBlock(
            shadow,
            pb.dataset.key,
            gameState.materialsInventory.get(),
            gameState.player.get(),
            gameState.selectedMaterialType.get(),
            gameConfig.TILES,
            gameConfig.TILE_SIZE.get(),
            gameState.world.get(),
            gameConfig.WORLD_HEIGHT.get(),
            gameConfig.WORLD_WIDTH.get(),
          ),
      );
    },
  );

  shadow.addEventListener(
    "keyup",
    /** @param {KeyboardEvent} e */
    (e) => {
      host.keys[e.key.toLowerCase()] = false;

      e.preventDefault();
    },
  );

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

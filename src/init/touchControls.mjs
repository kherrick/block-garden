import { gameConfig, gameState } from "../state/state.mjs";
import { handleBreakBlockWithWaterPhysics } from "../misc/handleBreakBlock.mjs";
import { handleFarmAction } from "../misc/handleFarmAction.mjs";
import { handlePlaceBlock } from "../misc/handlePlaceBlock.mjs";

// Touch controls
export function initTouchControls(shadow) {
  const touchButtons = shadow.querySelectorAll(".touch-btn");

  touchButtons.forEach((btn) => {
    const key = btn.getAttribute("data-key");
    let isPressed = false;
    let intervalId = null;

    function executeKeyAction() {
      shadow.host.touchKeys[key] = true;
      btn.style.background = "var(--sg-color-gray-alpha-30)";

      if (key === "f") {
        handleFarmAction({
          growthTimers: gameState.growthTimers,
          plantStructures: gameState.plantStructures,
          player: gameState.player.get(),
          seedInventory: gameState.seedInventory.get(),
          selectedSeedType: gameState.selectedSeedType.get(),
          tileName: gameConfig.TileName,
          tiles: gameConfig.TILES,
          tileSize: gameConfig.TILE_SIZE.get(),
          world: gameState.world.get(),
          worldHeight: gameConfig.WORLD_HEIGHT.get(),
          worldWidth: gameConfig.WORLD_WIDTH.get(),
        });
      }

      if (key === "r") {
        handleBreakBlockWithWaterPhysics({
          growthTimers: gameState.growthTimers,
          plantStructures: gameState.plantStructures,
          player: gameState.player,
          tiles: gameConfig.TILES,
          tileSize: gameConfig.TILE_SIZE.get(),
          world: gameState.world,
          worldHeight: gameConfig.WORLD_HEIGHT.get(),
          worldWidth: gameConfig.WORLD_WIDTH.get(),
          mode: gameConfig.breakMode.get(),
          queue: gameState.waterPhysicsQueue,
        });
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
      shadow.host.touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";

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
  shadow.querySelectorAll(".touch-btn.place-block").forEach((pb) => {
    pb.addEventListener(
      "touchstart",
      async () =>
        await handlePlaceBlock({
          key: pb.dataset.key,
          materialsInventory: gameState.materialsInventory.get(),
          player: gameState.player.get(),
          selectedMaterialType: gameState.selectedMaterialType.get(),
          tiles: gameConfig.TILES,
          tileSize: gameConfig.TILE_SIZE.get(),
          world: gameState.world.get(),
          worldHeight: gameConfig.WORLD_HEIGHT.get(),
          worldWidth: gameConfig.WORLD_WIDTH.get(),
        }),
    );

    pb.addEventListener(
      "click",
      async () =>
        await handlePlaceBlock({
          key: pb.dataset.key,
          materialsInventory: gameState.materialsInventory.get(),
          player: gameState.player.get(),
          selectedMaterialType: gameState.selectedMaterialType.get(),
          tiles: gameConfig.TILES,
          tileSize: gameConfig.TILE_SIZE.get(),
          world: gameState.world.get(),
          worldHeight: gameConfig.WORLD_HEIGHT.get(),
          worldWidth: gameConfig.WORLD_WIDTH.get(),
        }),
    );
  });

  shadow.addEventListener("keyup", (e) => {
    shadow.host.keys[e.key.toLowerCase()] = false;

    e.preventDefault();
  });

  // Prevent default touch behaviors
  shadow.addEventListener(
    "touchstart",
    (e) => {
      if (
        e.target.closest(".touch-controls") ||
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
        e.target.closest(".touch-controls") ||
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
        e.target.closest(".touch-controls") ||
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
      e.target.closest(".touch-controls") ||
      e.target === shadow.getElementById("canvas")
    ) {
      e.preventDefault();
    }
  });

  // Prevent zoom on double tap
  shadow.addEventListener("dblclick", (e) => {
    if (
      e.target.closest(".touch-controls") ||
      e.target === shadow.getElementById("canvas")
    ) {
      e.preventDefault();
    }
  });
}

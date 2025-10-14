import { gameConfig, gameState } from "../state/state.mjs";
import { handleBreakBlockWithWaterPhysics } from "../misc/handleBreakBlock.mjs";
import { handleFarmAction } from "../misc/handleFarmAction.mjs";
import { handlePlaceBlock } from "../misc/handlePlaceBlock.mjs";

// Touch controls
export function initTouchControls(doc) {
  const touchButtons = doc.querySelectorAll(".touch-btn");

  touchButtons.forEach((btn) => {
    const key = btn.getAttribute("data-key");
    let isPressed = false;
    let intervalId = null;

    function executeKeyAction() {
      globalThis.spriteGarden.touchKeys[key] = true;
      btn.style.background = "rgba(255, 255, 255, 0.3)";

      if (key === "f") {
        handleFarmAction({
          growthTimers: gameState.growthTimers,
          plantStructures: gameState.plantStructures,
          player: gameState.player.get(),
          seedInventory: gameState.seedInventory.get(),
          selectedSeedType: gameState.selectedSeedType.get(),
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
      globalThis.spriteGarden.touchKeys[key] = false;
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
  doc.querySelectorAll(".touch-btn.place-block").forEach((pb) => {
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

  doc.addEventListener("keyup", (e) => {
    globalThis.spriteGarden.keys[e.key.toLowerCase()] = false;

    e.preventDefault();
  });

  // Prevent default touch behaviors
  doc.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  doc.addEventListener(
    "touchmove",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  doc.addEventListener(
    "touchend",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  // Prevent context menu on long press
  doc.addEventListener("contextmenu", (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  });

  // Prevent zoom on double tap
  doc.addEventListener("dblclick", (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  });
}

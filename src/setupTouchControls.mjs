import { gameConfig, gameState } from "./state.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { handleBreakBlock } from "./handleBreakBlock.mjs";
import { handleFarmAction } from "./handleFarmAction.mjs";

// Touch controls
export function setupTouchControls(gThis) {
  const touchButtons = gThis.document.querySelectorAll(".touch-btn");

  touchButtons.forEach((btn) => {
    const key = btn.getAttribute("data-key");

    // Touch start
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();

      gThis.spriteGarden.touchKeys[key] = true;
      btn.style.background = "rgba(255, 255, 255, 0.3)";

      // Handle special actions
      if (key === "f") {
        handleFarmAction(
          getCurrentGameState(gameState, gameConfig),
          gThis.spriteGarden,
          gThis.document,
        );
      } else if (key === "r") {
        handleBreakBlock(
          getCurrentGameState(gameState, gameConfig),
          gThis.spriteGarden,
          gThis.document,
          gameConfig.breakMode.get(),
        );
      }
    });

    // Touch end
    btn.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();

      gThis.spriteGarden.touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });

    // Touch cancel
    btn.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      e.stopPropagation();

      gThis.spriteGarden.touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });

    // Mouse events for desktop testing
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      gThis.spriteGarden.touchKeys[key] = true;
      btn.style.background = "rgba(255, 255, 255, 0.3)";

      if (key === "f") {
        handleFarmAction(
          getCurrentGameState(gameState, gameConfig),
          gThis.spriteGarden,
          gThis.document,
        );
      } else if (key === "r") {
        handleBreakBlock(
          getCurrentGameState(gameState, gameConfig),
          gThis.spriteGarden,
          gThis.document,
          gameConfig.breakMode.get(),
        );
      }
    });

    btn.addEventListener("mouseup", (e) => {
      e.preventDefault();
      e.stopPropagation();

      gThis.spriteGarden.touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });

    btn.addEventListener("mouseleave", (e) => {
      e.preventDefault();
      e.stopPropagation();

      gThis.spriteGarden.touchKeys[key] = false;
      btn.style.background = "rgba(0, 0, 0, 0.6)";
    });
  });
}

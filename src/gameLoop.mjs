import { gameConfig, gameState } from "./state.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { render } from "./render.mjs";
import { updateCrops } from "./updateCrops.mjs";
import { updatePlayer } from "./updatePlayer.mjs";
import { updateUI } from "./updateUI.mjs";

const canvas = globalThis.document?.getElementById("canvas");

// Game loop
export function gameLoop(
  gThis,
  FRICTION,
  GRAVITY,
  MAX_FALL_SPEED,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
) {
  updatePlayer(
    gThis,
    FRICTION,
    GRAVITY,
    MAX_FALL_SPEED,
    TILE_SIZE,
    WORLD_HEIGHT,
    WORLD_WIDTH,
  );

  updateCrops(getCurrentGameState(gameState, gameConfig), gThis.spriteGarden);

  render(canvas);

  updateUI(gThis.document, getCurrentGameState(gameState, gameConfig));

  // Increment game time every frame (we store seconds as fractional)
  gameState.gameTime.set(gameState.gameTime.get() + 1 / 60);

  requestAnimationFrame(() =>
    gameLoop(
      gThis,
      FRICTION,
      GRAVITY,
      MAX_FALL_SPEED,
      TILE_SIZE,
      WORLD_HEIGHT,
      WORLD_WIDTH,
    ),
  );
}

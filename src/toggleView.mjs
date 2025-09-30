import { gameConfig, gameState } from "./state.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { updateUI } from "./updateUI.mjs";

export function toggleView(doc) {
  const currentMode = gameState.viewMode.get();

  gameState.viewMode.set(currentMode === "normal" ? "xray" : "normal");

  updateUI(doc, getCurrentGameState(gameState, gameConfig));
}

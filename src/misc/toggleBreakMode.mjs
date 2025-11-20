import { gameConfig } from "../state/state.mjs";

/** @returns {void} */
export function toggleBreakMode() {
  const currentMode = gameConfig.breakMode.get();

  gameConfig.breakMode.set(currentMode === "regular" ? "extra" : "regular");
}

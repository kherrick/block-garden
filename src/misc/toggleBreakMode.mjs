import { gameConfig } from "../state/state.mjs";

/**
 * Toggles the break mode between 'regular' and 'extra'.
 *
 * Regular mode breaks one block; extra mode affects larger areas.
 *
 * @returns {void}
 */
export function toggleBreakMode() {
  const currentMode = gameConfig.breakMode.get();

  gameConfig.breakMode.set(currentMode === "regular" ? "extra" : "regular");
}

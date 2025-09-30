import { gameConfig } from "./state.mjs";

export function toggleBreakMode() {
  const currentMode = gameConfig.breakMode.get();

  gameConfig.breakMode.set(currentMode === "regular" ? "extra" : "regular");
}

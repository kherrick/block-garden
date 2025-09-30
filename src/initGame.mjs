import storage from "../deps/localforage.mjs";
import { gameConfig, initState } from "./state.mjs";
import { gameLoop } from "./gameLoop.mjs";
import { generateNewWorld } from "./generateWorld.mjs";
import { initMapEditor } from "./mapEditor.mjs";
import { resizeCanvas } from "./resizeCanvas.mjs";

import {
  setupDocumentEventListeners,
  setupElementEventListeners,
  setupGlobalEventListeners,
} from "./setupEventListeners.mjs";

import { setupEffects } from "./setupEffects.mjs";
import { setupTileInspection } from "./setupTileInspection.mjs";
import { setupTouchControls } from "./setupTouchControls.mjs";

// Initialize game
export async function initGame(doc, cnvs) {
  let version = "1";

  try {
    version = (await (await fetch("package.json")).json()).version;
  } catch (error) {
    console.log(`continuing with static version: ${version}`);
  }

  initState(globalThis, version);
  initMapEditor(doc);

  setupGlobalEventListeners(globalThis);
  setupDocumentEventListeners(globalThis);
  setupElementEventListeners(doc);
  setupEffects(doc);
  setupTouchControls(globalThis);
  setupTileInspection(cnvs);

  generateNewWorld(doc);
  resizeCanvas(doc, gameConfig);

  storage
    .setItem("sprite-garden-version", version)
    .then((v) => console.log(`Sprite Garden version: ${v}`));

  gameLoop(
    globalThis,
    gameConfig.FRICTION.get(),
    gameConfig.GRAVITY.get(),
    gameConfig.MAX_FALL_SPEED.get(),
    gameConfig.TILE_SIZE.get(),
    gameConfig.WORLD_HEIGHT.get(),
    gameConfig.WORLD_WIDTH.get(),
  );
}

import localForage from "../deps/localforage.mjs";
import { configSignals, initState } from "./state.mjs";
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

  setupGlobalEventListeners(globalThis);
  setupDocumentEventListeners(globalThis);
  setupElementEventListeners(doc);
  setupEffects(doc);
  setupTouchControls(globalThis);
  setupTileInspection(cnvs);

  initMapEditor(doc);

  resizeCanvas(doc, configSignals);
  generateNewWorld(doc);

  localForage
    .setItem("sprite-garden-version", version)
    .then((v) => console.log(`Sprite Garden version: ${v}`));

  gameLoop(globalThis);
}

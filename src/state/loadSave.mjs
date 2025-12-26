import { base64toBlob } from "../util/conversion.mjs";
import { extractAttachments } from "../util/extractAttachments.mjs";
import { extractJsonFromPng } from "../util/canvasToPngWithState.mjs";

/**
 * Restores game state and config from a save file.
 *
 * Reconstructs complex objects like world maps and fog maps from serialized data.
 * Updates all Signal values to restore previous game state.
 *
 * @param {typeof globalThis} gThis - Global this or window object with blockGarden property
 * @param {ShadowRoot} shadow - Shadow root for canvas resizing
 * @param {Object} state - Save state object created by createSaveState
 *
 * @returns {Promise<void>}
 */
export async function loadSaveState(gThis, shadow, state) {
  let saveState = state;

  // handle loading pdfs
  if (saveState?.type === "pdf") {
    const blob = base64toBlob(gThis, saveState.contents, "application/pdf");

    const [results] = await extractAttachments(
      new File([blob], "block-garden-game-card.png"),
    );

    saveState = JSON.parse(await extractJsonFromPng(new Blob([results.data])));
  }

  const saveData = saveState;

  // Clear existing world
  const world = globalThis.blockGarden.state.world;
  world.clear();

  // Populate chunks from save data
  globalThis.Object.entries(saveData).forEach(([x, xz]) => {
    globalThis.Object.entries(xz).forEach(([z, ys]) => {
      globalThis.Object.entries(ys).forEach(([y, type]) => {
        // Use ChunkManager's set method (Map-compatible interface)
        world.set(`${x},${y},${z}`, Number(type));
      });
    });
  });

  // Reposition player to the top-most block at current x,z
  const gameState = globalThis.blockGarden.state;
  const playerX = Math.floor(gameState.x);
  const playerZ = Math.floor(gameState.z);
  let foundY = -Infinity;

  // Scan downwards from a high point to find the first solid block
  for (let y = 255; y >= 0; y--) {
    if (world.get(`${playerX},${y},${playerZ}`)) {
      foundY = y;
      break;
    }
  }

  // Place player on top of the found block, at eye height
  // foundY is the coordinate of the block, so foundY + 1 is the surface
  if (foundY > -Infinity) {
    gameState.y = foundY + 1 + 1.62;
    gameState.dy = 0;
    gameState.onGround = false;
  }

  console.log("Save state loaded successfully");

  // "Reset" to enable updated state / config
  shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
}

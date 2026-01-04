import { base64toBlob } from "../util/conversion.mjs";
import { extractAttachments } from "../util/extractAttachments.mjs";
import { extractJsonFromPng } from "../util/canvasToPngWithState.mjs";
import { initNoise } from "../util/noise.mjs";
import { worldToChunk } from "../util/chunk.mjs";

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

  // Support both old and new save formats
  const worldData = saveState.world || saveState;
  const config = saveState.config || {};
  const stateData = saveState.state || {};

  const world = gThis.blockGarden.state.world;

  // Restore config/state values
  const gameState = gThis.blockGarden.state;
  if (config.seed !== undefined) {
    gameState.seed = config.seed;
  }

  if (config.version !== undefined) {
    gameState.version = config.version;
  }

  // Restore granular generation settings to gameConfig Signals
  const configSignals = gThis.blockGarden.config;
  if (config.terrainOctaves !== undefined)
    configSignals.terrainOctaves.set(config.terrainOctaves);
  if (config.mountainScale !== undefined)
    configSignals.mountainScale.set(config.mountainScale);
  if (config.decorationDensity !== undefined)
    configSignals.decorationDensity.set(config.decorationDensity);
  if (config.caveThreshold !== undefined)
    configSignals.caveThreshold.set(config.caveThreshold);
  if (config.useCaves !== undefined)
    configSignals.useCaves.set(config.useCaves);
  if (config.cloudDensity !== undefined)
    configSignals.cloudDensity.set(config.cloudDensity);

  if (stateData.x !== undefined) {
    gameState.x = stateData.x;
  }

  if (stateData.y !== undefined) {
    gameState.y = stateData.y;
  }

  if (stateData.z !== undefined) {
    gameState.z = stateData.z;
  }

  if (stateData.dx !== undefined) {
    gameState.dx = stateData.dx;
  }

  if (stateData.dy !== undefined) {
    gameState.dy = stateData.dy;
  }

  if (stateData.dz !== undefined) {
    gameState.dz = stateData.dz;
  }

  if (stateData.onGround !== undefined) {
    gameState.onGround = stateData.onGround;
  }

  // Validate and initialize inventory
  if (!stateData.inventory || typeof stateData.inventory !== "object") {
    // Initialize to empty inventory if missing
    gameState.inventory = {};

    console.warn(
      "Inventory missing or invalid in save, initializing to empty object.",
    );
  } else {
    gameState.inventory = stateData.inventory;
  }

  // Validate and initialize curBlock
  if (stateData.curBlock !== undefined && gameState.curBlock?.set) {
    gameState.curBlock.set(stateData.curBlock);
  } else if (gameState.curBlock?.set) {
    // Set to default block (e.g., Dirt)
    gameState.curBlock.set(1); // Replace 1 with your default block ID if needed
    console.warn("curBlock missing in save, set to default block.");
  }

  // Cancel any running game loop before reset (if available)
  if (typeof gThis.cancelGameLoop === "function") {
    gThis.cancelGameLoop();
  } else if (typeof globalThis.cancelGameLoop === "function") {
    globalThis.cancelGameLoop();
  }

  // Clear existing world
  world.clear();

  // Initialize noise generator with seed for proper chunk generation
  // This does NOT regenerate the world - it only sets up the noise for async chunk generation
  if (gameState.seed !== undefined) {
    initNoise(gameState.seed);

    // Instead of restoring plants directly to active state,
    // we move them to storedPlantStates so they are handled
    // by the chunk restoration logic during generation.
    const structures = stateData.plantStructures || {};
    const timers = stateData.growthTimers || {};

    // Clear existing active state
    gameState.plantStructures = {};
    gameState.growthTimers = {};

    // Partition by chunk and add to storedPlantStates
    const partitioned = new Map();

    for (const key of Object.keys(structures)) {
      const [x, y, z] = key.split(",").map(Number);
      const { chunkX, chunkZ } = worldToChunk(x, z);
      const chunkKey = `${chunkX},${chunkZ}`;

      if (!partitioned.has(chunkKey)) {
        partitioned.set(chunkKey, { timers: {}, structures: {} });
      }

      const chunkData = partitioned.get(chunkKey);
      chunkData.structures[key] = structures[key];
      if (timers[key] !== undefined) {
        chunkData.timers[key] = timers[key];
      }
    }

    // Apply to world
    for (const [key, data] of partitioned) {
      world.storedPlantStates.set(key, data);
    }

    console.log("Noise initialized for saved world with seed:", gameState.seed);
  }

  // Profile world loading
  const t0 = performance.now();

  // Validate world data size
  const worldKeys = Object.keys(worldData);
  if (worldKeys.length > 1000) {
    console.warn(
      `World data is very large (${worldKeys.length} x columns), may cause slow loading.`,
    );
  }

  // Populate chunks from save data
  globalThis.Object.entries(worldData).forEach(([x, xz]) => {
    globalThis.Object.entries(xz).forEach(([z, ys]) => {
      globalThis.Object.entries(ys).forEach(([y, blockId]) => {
        // Load block by its ID, not by array index
        world.set(`${x},${y},${z}`, Number(blockId));
      });
    });
  });

  // Restore stored chunks modifications
  if (saveState.storedChunks) {
    world.storedChunks = new Map();
    globalThis.Object.entries(saveState.storedChunks).forEach(
      ([key, modsObj]) => {
        const mods = new Map();
        globalThis.Object.entries(modsObj).forEach(([idx, type]) => {
          mods.set(Number(idx), Number(type));
        });
        world.storedChunks.set(key, mods);
      },
    );
    console.log(
      `Restored ${world.storedChunks.size} chunks with player modifications.`,
    );
  }

  // Restore stored plant states
  if (saveState.storedPlantStates) {
    if (!world.storedPlantStates) {
      world.storedPlantStates = new Map();
    }
    globalThis.Object.entries(saveState.storedPlantStates).forEach(
      ([key, state]) => {
        world.storedPlantStates.set(key, state);
      },
    );
  }

  const t1 = performance.now();
  console.log(
    `World loaded in ${(t1 - t0).toFixed(2)} ms. World size: ${worldKeys.length} columns.`,
  );

  // Reposition player to the top-most block at current x,z if not present in save
  let playerX = Math.floor(gameState.x);
  let playerZ = Math.floor(gameState.z);

  let foundY = -Infinity;

  for (let y = 255; y >= 0; y--) {
    if (world.get(`${playerX},${y},${playerZ}`)) {
      foundY = y;
      break;
    }
  }

  if (foundY > -Infinity && stateData.y === undefined) {
    gameState.y = foundY + 1 + 1.62;
    gameState.dy = 0;
    gameState.onGround = false;
  }

  console.log("Save state loaded successfully");

  // "Reset" to enable updated state / config
  shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
}

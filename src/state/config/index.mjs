import { Signal } from "signal-polyfill";

import { getRandomSeed } from "../../misc/getRandomSeed.mjs";

import { BIOMES } from "./biomes.mjs";
import { TILES, TileName } from "./tiles.mjs";

let initialWorldSeed;

const params = new URLSearchParams(globalThis.location?.search);

if (params.has("seed")) {
  initialWorldSeed = params.get("seed");
} else {
  initialWorldSeed = getRandomSeed();
}

export const gameConfig = {
  // Fog mode setting - "fog" || "clear"
  fogMode: new Signal.State("fog"),
  fogScale: new Signal.State(8),
  isFogScaled: new Signal.State(true),
  // Break mode setting
  breakMode: new Signal.State("regular"),
  canvasScale: new Signal.State(1),
  currentResolution: new Signal.State("400"),
  version: new Signal.State("1"),
  worldSeed: new Signal.State(initialWorldSeed),
  waterPhysics: {
    // Update every 10 frames
    updateInterval: 10,
    // Count for water updates
    frameCounter: 0,
    // Maximum iterations per update to prevent CPU overload
    maxIterationsPerUpdate: 5,
    // How many tiles around changed areas to check
    checkRadius: 15,
    // Track areas that need water physics updates
    dirtyRegions: new Set(),
  },
  TILE_SIZE: new Signal.State(8),
  WORLD_WIDTH: new Signal.State(500),
  WORLD_HEIGHT: new Signal.State(300),
  SURFACE_LEVEL: new Signal.State(90),
  // Physics constants
  GRAVITY: new Signal.State(0.7),
  FRICTION: new Signal.State(0.8),
  MAX_FALL_SPEED: new Signal.State(15),
  BIOMES,
  TILES,
  TileName,
};

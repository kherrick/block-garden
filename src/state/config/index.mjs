import { Signal } from "signal-polyfill";

import { blockNames, blocks } from "./blocks.mjs";

/**
 * @typedef {import('./blocks.mjs').BlockArray} BlockArray
 */

/**
 * Game configuration store.
 *
 * @typedef {Object} GameConfig
 *
 * @property {Object} blockNames - Names of all blocks
 * @property {BlockArray} blocks - All block definitions
 * @property {Signal.State} cacheRadius
 * @property {Signal.State} caveThreshold - Cave generation threshold state
 * @property {Signal.State} cloudDensity
 * @property {Signal.State} currentResolution - Signal State for current resolution
 * @property {Signal.State} decorationDensity
 * @property {Signal.State} linkGameSave
 * @property {Signal.State} mountainScale
 * @property {Signal.State} renderRadius
 * @property {Signal.State} terrainOctaves
 * @property {Signal.State} useAmbientOcclusion
 * @property {Signal.State} useAODebug
 * @property {Signal.State} useCaves
 * @property {Signal.State} useDynamicLighting
 * @property {Signal.State} usePerFaceLighting
 * @property {Signal.State} useSplitControls - Use split controls toggle state
 * @property {Signal.State} useTextureAtlas
 * @property {Signal.State} useTouchControls - Use touch controls toggle state
 * @property {Signal.State} version - Signal State for game version string
 * @property {Signal.State} viewRadius
 * @property {Signal.State} worldRadius
 */

/**
 * Global game configuration and constants.
 *
 * @type {GameConfig}
 *
 * @constant
 */
export const gameConfig = {
  blockNames,
  blocks,
  cacheRadius: new Signal.State(4),
  caveThreshold: new Signal.State(80),
  cloudDensity: new Signal.State(20),
  currentResolution: new Signal.State("600"),
  decorationDensity: new Signal.State(40),
  linkGameSave: new Signal.State(false),
  mountainScale: new Signal.State(25),
  renderRadius: new Signal.State(4),
  terrainOctaves: new Signal.State(2),
  useAmbientOcclusion: new Signal.State(false),
  useAODebug: new Signal.State(false),
  useCaves: new Signal.State(true),
  useDynamicLighting: new Signal.State(false),
  usePerFaceLighting: new Signal.State(true),
  useSplitControls: new Signal.State(false),
  useTextureAtlas: new Signal.State(false),
  useTouchControls: new Signal.State(true),
  version: new Signal.State("1"),
  viewRadius: new Signal.State(128),
  worldRadius: new Signal.State(384),
};

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
 * @property {Signal.State} renderRadius
 * @property {Signal.State} worldRadius
 * @property {Signal.State} viewRadius
 * @property {Signal.State} currentResolution - Signal State for current resolution
 * @property {Signal.State} version - Signal State for game version string
 * @property {Signal.State} useTouchControls - Use touch controls toggle state
 * @property {Signal.State} useSplitControls - Use split controls toggle state
 * @property {Signal.State} terrainOctaves
 * @property {Signal.State} mountainScale
 * @property {Signal.State} decorationDensity
 * @property {Signal.State} caveThreshold - Cave generation threshold state
 * @property {Signal.State} useCaves
 * @property {Signal.State} cloudDensity
 * @property {Signal.State} useTextureAtlas
 * @property {Signal.State} useAmbientOcclusion
 * @property {Signal.State} useDynamicLighting
 * @property {Signal.State} usePerFaceLighting
 * @property {Signal.State} useAODebug
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
  viewRadius: new Signal.State(128),
  cacheRadius: new Signal.State(4),
  renderRadius: new Signal.State(4),
  worldRadius: new Signal.State(384),
  currentResolution: new Signal.State("600"),
  version: new Signal.State("1"),
  useTouchControls: new Signal.State(true),
  useSplitControls: new Signal.State(false),
  terrainOctaves: new Signal.State(2),
  mountainScale: new Signal.State(25),
  decorationDensity: new Signal.State(40),
  caveThreshold: new Signal.State(80),
  useCaves: new Signal.State(true),
  cloudDensity: new Signal.State(20),
  useTextureAtlas: new Signal.State(false),
  useAmbientOcclusion: new Signal.State(false),
  useDynamicLighting: new Signal.State(false),
  usePerFaceLighting: new Signal.State(true),
  useAODebug: new Signal.State(false),
};

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
 * @property {Signal.State} useAutoJump - Auto jump toggle state
 * @property {Signal.State} useBlockHighlight - Block highlight toggle state
 * @property {Signal.State} useCaves
 * @property {Signal.State} useDamageAnimation - Damage animation toggle state
 * @property {Signal.State} useDynamicLighting
 * @property {Signal.State} usePerFaceLighting
 * @property {Signal.State} useSplitControls - Use split controls toggle state
 * @property {Signal.State} useTextureAtlas
 * @property {Signal.State} useTouchControls - Use touch controls toggle state
 * @property {Signal.State} version - Signal State for game version string
 * @property {Signal.State} viewRadius
 * @property {Signal.State} worldRadius
 * @property {Signal.State} dayLength - Full day/night cycle duration in seconds (default 1200)
 * @property {Signal.State} timeScale - Multiplier for time progression (default 1.0)
 * @property {Signal.State} useTimeCycle - Enable day/night cycle (default true)
 * @property {Signal.State} manualTimeOfDay - Manual sun position override when cycle disabled (0-1, default 0.5 = noon)
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
  dayLength: new Signal.State(1440),
  decorationDensity: new Signal.State(40),
  linkGameSave: new Signal.State(false),
  manualTimeOfDay: new Signal.State(0.5),
  mountainScale: new Signal.State(25),
  renderRadius: new Signal.State(4),
  terrainOctaves: new Signal.State(2),
  timeScale: new Signal.State(1.0),
  useAmbientOcclusion: new Signal.State(false),
  useAODebug: new Signal.State(false),
  useAutoJump: new Signal.State(true),
  useBlockHighlight: new Signal.State(true),
  useCaves: new Signal.State(true),
  useDamageAnimation: new Signal.State(true),
  useDynamicLighting: new Signal.State(false),
  usePerFaceLighting: new Signal.State(true),
  useSplitControls: new Signal.State(false),
  useTextureAtlas: new Signal.State(false),
  useTimeCycle: new Signal.State(false),
  useTouchControls: new Signal.State(true),
  version: new Signal.State("1"),
  viewRadius: new Signal.State(128),
  worldRadius: new Signal.State(384),
};

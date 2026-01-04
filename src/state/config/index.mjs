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
  viewRadius: new Signal.State(192),
  cacheRadius: new Signal.State(8),
  renderRadius: new Signal.State(8),
  worldRadius: new Signal.State(2072),
  currentResolution: new Signal.State("600"),
  version: new Signal.State("1"),
  useTouchControls: new Signal.State(true),
  useSplitControls: new Signal.State(false),
};

import { Signal } from "signal-polyfill";

import { blockNames, blocks } from "./blocks.mjs";

/**
 * @typedef {import('./blocks.mjs').BlockDefinition} BlockDefinition
 * @typedef {import('./blocks.mjs').BlockPlacement} BlockPlacement
 */

/**
 * Game configuration store.
 *
 * @typedef {Object} GameConfig
 *
 * @property {Object} blockNames - Names of all blocks
 * @property {BlockDefinition[]} blocks - All block definitions
 * @property {Signal.State} currentResolution - Signal State for current resolution
 * @property {Signal.State} version - Signal State for game version string
 * @property {Signal.State} useTouchControls - Use touch controls toggle state
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
  currentResolution: new Signal.State("400"),
  version: new Signal.State("1"),
  useTouchControls: new Signal.State(true),
};

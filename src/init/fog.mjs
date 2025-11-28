import { FogMap } from "../map/fog.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../util/colors/index.mjs').CombinedColorMap} CombinedColorMap */

/**
 * Initialize fog
 *
 * @param {Signal.State} isFogScaled
 * @param {number} worldHeight
 * @param {number} worldWidth
 * @param {CombinedColorMap} colors
 *
 * @returns {FogMap}
 */
export function initFog(isFogScaled, worldHeight, worldWidth, colors) {
  isFogScaled.set(false);

  return new FogMap(worldWidth, worldHeight, colors);
}

import { FogMap } from "../map/fog.mjs";

/**
 * Initialize fog
 *
 * @param {any} isFogScaled
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} colors
 *
 * @returns {FogMap}
 */
export function initFog(isFogScaled, worldHeight, worldWidth, colors) {
  isFogScaled.set(false);

  return new FogMap(worldWidth, worldHeight, colors);
}

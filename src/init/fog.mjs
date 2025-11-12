import { FogMap } from "../map/fog.mjs";

// Initialize fog
export function initFog(isFogScaled, worldHeight, worldWidth, colors) {
  isFogScaled.set(false);

  return new FogMap(worldWidth, worldHeight, colors);
}

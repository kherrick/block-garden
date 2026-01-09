/**
 * Biome determination based on temperature and humidity noise.
 *
 * Uses noise at X,Z position to select biome type.
 */

import { biomeNoise } from "./noise.mjs";
import { BIOMES } from "../state/config/biomes.mjs";

/**
 * Get the biome for a given world position.
 *
 * Uses temperature and humidity noise to determine biome:
 * - Temperature < -0.4: TUNDRA
 * - Temperature > 0.4 AND humidity < -0.2: DESERT
 * - Humidity > 0.3: SWAMP
 * - Otherwise: FOREST
 *
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @param {number} seed - World seed
 *
 * @returns {import('../state/config/biomes.mjs').Biome} Biome definition
 */
export function getBiome(x, z, seed) {
  // Use different seed offsets for temperature and humidity
  const temperature = biomeNoise(x, z, seed + 600);
  const humidity = biomeNoise(x, z, seed + 700);

  // Biome selection based on temperature and humidity
  if (temperature < -0.4) {
    // Cold regions
    return BIOMES.TUNDRA;
  } else if (temperature > 0.4 && humidity < -0.2) {
    // Hot and dry
    return BIOMES.DESERT;
  } else if (humidity > 0.3) {
    // Wet regions
    return BIOMES.SWAMP;
  } else {
    // Temperate regions
    return BIOMES.FOREST;
  }
}

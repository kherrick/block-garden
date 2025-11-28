import { biomeNoise, initNoise } from "../util/noise.mjs";

/** @typedef {import('../state/config/biomes.mjs').BiomeMap} BiomeMap */

/**
 * Determines the biome type at a given X coordinate using Perlin noise.
 *
 * Combines temperature and humidity noise to select between four biome types.
 * Uses temperature range -1 (cold) to 1 (hot) and humidity range -1 (dry) to 1 (wet).
 *
 * Biome selection rules:
 * - Temperature < -0.4: TUNDRA
 * - Temperature > 0.4 AND humidity < -0.2: DESERT
 * - Humidity > 0.3: SWAMP
 * - Otherwise: FOREST
 *
 * @param {number} x - X coordinate to get biome for
 * @param {BiomeMap} biomes - Biome definitions map
 * @param {number} seed - Seed for noise generation
 *
 * @returns {Object} The biome object for this coordinate
 */
export function getBiome(x, biomes, seed) {
  // Initialize noise with seed
  initNoise(seed);

  const temperatureNoise = biomeNoise(x, seed + 600);
  const humidityNoise = biomeNoise(x, seed + 700);

  // Create more interesting biome distribution
  // Temperature: -1 (cold) to 1 (hot)
  const temperature = temperatureNoise;

  // Humidity: -1 (dry) to 1 (wet)
  const humidity = humidityNoise;

  // Biome selection based on temperature and humidity
  if (temperature < -0.4) {
    // Cold regions
    return biomes.TUNDRA;
  } else if (temperature > 0.4 && humidity < -0.2) {
    // Hot and dry
    return biomes.DESERT;
  } else if (humidity > 0.3) {
    // Wet regions
    return biomes.SWAMP;
  } else {
    // Temperate regions
    return biomes.FOREST;
  }
}

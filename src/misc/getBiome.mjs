import { biomeNoise, initNoise } from "../util/noise.mjs";

/**
 * @param {any} x
 * @param {any} biomes
 * @param {any} seed
 *
 * @returns {any}
 */
export function getBiome(x, biomes, seed) {
  // Initialize noise with seed
  initNoise(seed);

  const temperatureNoise = biomeNoise(x, parseInt(seed) + 600);
  const humidityNoise = biomeNoise(x, parseInt(seed) + 700);

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

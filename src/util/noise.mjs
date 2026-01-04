// noise is used in chunk generator, also consumed in terrain.worker
// get dependencies from 'deps' folder to avoid bundling issues
import { createNoise3D } from "../../deps/simplex-noise.mjs";
import alea from "../../deps/alea.mjs";

// Global noise function with seeded generator
let noise3D = null;
let currentSeed = null;

// Cache of noise functions by seed to avoid re-initialization overhead
const noiseCache = new Map();
const MAX_CACHE_SIZE = 20;

/**
 * @param {number} seed
 *
 * @returns {void}
 */
export function initNoise(seed) {
  if (seed === currentSeed && noise3D) {
    return;
  }

  currentSeed = seed;

  if (noiseCache.has(seed)) {
    noise3D = noiseCache.get(seed);
    return;
  }

  // Create new noise generator
  noise3D = createNoise3D(alea(seed));

  // Add to cache
  noiseCache.set(seed, noise3D);

  // Maintain cache size
  if (noiseCache.size > MAX_CACHE_SIZE) {
    const firstKey = noiseCache.keys().next().value;
    noiseCache.delete(firstKey);
  }
}

/**
 * Enhanced noise function that combines multiple octaves for more natural terrain
 *
 * @param {number} x
 * @param {number} y
 * @param {number} [seed=0]
 * @param {number} [octaves=3]
 * @param {number} [persistence=0.5]
 * @param {number} [scale=0.02]
 *
 * @returns {number}
 */
export function noise(
  x,
  y,
  seed = 0,
  octaves = 3,
  persistence = 0.5,
  scale = 0.02,
) {
  // Initialize noise if not already done or seed changed
  if (!noise3D || currentSeed !== seed) {
    initNoise(seed);
  }

  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  // Combine multiple octaves for more interesting terrain
  for (let i = 0; i < octaves; i++) {
    value += noise3D(x * frequency, y * frequency, 0) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  // Normalize to [-1, 1] range
  return value / maxValue;
}

/**
 * 3D Noise function
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} [seed=0]
 * @param {number} [octaves=3]
 * @param {number} [persistence=0.5]
 * @param {number} [scale=0.02]
 *
 * @returns {number}
 */
export function noise3d(
  x,
  y,
  z,
  seed = 0,
  octaves = 3,
  persistence = 0.5,
  scale = 0.02,
) {
  if (!noise3D || currentSeed !== seed) {
    initNoise(seed);
  }

  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return value / maxValue;
}

/**
 * Specialized terrain noise for height maps
 *
 * @param {number} x
 * @param {number} [seed=0]
 *
 * @returns {number}
 */
export function terrainNoise(x, y, seed = 0) {
  return noise(x, y, seed, 4, 0.5, 0.01);
}

/**
 * Biome noise for determining biome types (temperature/humidity).
 * Uses slower variation for larger biome regions.
 *
 * @param {number} x
 * @param {number} z
 * @param {number} [seed=500]
 *
 * @returns {number} -1 to 1 range
 */
export function biomeNoise(x, z, seed = 500) {
  return noise(x, z, seed, 2, 0.8, 0.005);
}

/**
 * Cave noise for 3D underground carving.
 * Higher frequency for cave tunnels.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} [seed=1000]
 *
 * @returns {number} -1 to 1 range
 */
export function caveNoise(x, y, z, seed = 1000) {
  return noise3d(x, y, z, seed, 2, 0.5, 0.04);
}

/**
 * Ore distribution noise for placing minerals.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} [seed=3000]
 *
 * @returns {number} -1 to 1 range
 */
export function oreNoise(x, y, z, seed = 3000) {
  return noise3d(x, y, z, seed, 2, 0.4, 0.08);
}

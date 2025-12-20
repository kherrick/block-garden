import { createNoise3D } from "simplex-noise";
import alea from "alea";

// Global noise function with seeded generator
let noise3D = null;
let currentSeed = null;

/**
 * @param {number} seed
 *
 * @returns {void}
 */
export function initNoise(seed) {
  if (seed !== currentSeed) {
    currentSeed = seed;
    noise3D = createNoise3D(alea(seed));
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
  // const seedString = seed.toString();
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

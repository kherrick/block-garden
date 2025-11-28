import { terrainNoise, initNoise } from "../util/noise.mjs";

/**
 * Generates a height map for terrain using multi-octave Perlin noise.
 *
 * Combines multiple noise frequencies to create natural-looking rolling terrain with peaks.
 * Results are smoothed and clamped to reasonable bounds.
 *
 * @param {number} worldWidth - Width of the world in tiles
 * @param {number} surfaceLevel - Base surface level Y coordinate
 * @param {number} seed - Seed for deterministic noise generation
 *
 * @returns {number[]} Array of height values, one per column
 */
export function generateHeightMap(worldWidth, surfaceLevel, seed) {
  // Initialize the seeded noise generator
  initNoise(seed);

  const heights = [];

  for (let x = 0; x < worldWidth; x++) {
    let height = surfaceLevel;

    // Main terrain shape - large rolling hills
    height += terrainNoise(x, seed) * 15;

    // Add medium frequency variation for more interesting terrain
    height += terrainNoise(x, seed + 100) * 8;

    // Add small details
    height += terrainNoise(x, seed + 200) * 4;

    // Add some sharper features occasionally
    const sharpNoise = terrainNoise(x, seed + 300);

    if (sharpNoise > 0.6) {
      height += (sharpNoise - 0.6) * 20; // Create occasional peaks
    }

    // Ensure height is within reasonable bounds
    height = Math.max(10, Math.min(surfaceLevel * 1.5, height));

    heights[x] = Math.floor(height);
  }

  // Smooth out any extreme variations to make terrain more pleasant
  return smoothHeights(heights, 2);
}

/**
 * Smooths a height map using multi-pass averaging.
 *
 * Reduces jagged terrain variations while preserving major features.
 * Uses 3-point averaging (weighted center).
 *
 * @param {number[]} heights - Array of height values to smooth
 * @param {number} [passes=1] - Number of smoothing passes to apply
 *
 * @returns {number[]} Smoothed height array
 */
function smoothHeights(heights, passes = 1) {
  const smoothed = [...heights];

  for (let pass = 0; pass < passes; pass++) {
    for (let x = 1; x < heights.length - 1; x++) {
      // Simple 3-point smoothing
      smoothed[x] = Math.floor(
        (heights[x - 1] + heights[x] * 2 + heights[x + 1]) / 4,
      );
    }

    heights.splice(0, heights.length, ...smoothed);
  }

  return heights;
}

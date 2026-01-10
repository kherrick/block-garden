/**
 * @jest-environment node
 */
import {
  initNoise,
  noise,
  noise3d,
  terrainNoise,
  biomeNoise,
} from "./noise.mjs";

describe("Noise utility with caching", () => {
  test("initNoise should be idempotent for the same seed", () => {
    // This is hard to test directly without exposing internals,
    // but we can verify consistency.
    initNoise(12345);
    const val1 = noise(10, 20, 12345);
    initNoise(12345);
    const val2 = noise(10, 20, 12345);
    expect(val1).toBe(val2);
  });

  test("noise functions should return consistent values for the same seed", () => {
    const val1 = noise(1, 2, 123);
    const val2 = noise(1, 2, 123);
    expect(val1).toBe(val2);
  });

  test("noise functions should switch between seeds correctly (cache hits)", () => {
    const seed1 = 1001;
    const seed2 = 2002;

    const val1_a = noise(5, 5, seed1);
    const val2_a = noise(5, 5, seed2);

    // Switch back to seed 1
    const val1_b = noise(5, 5, seed1);
    // Switch back to seed 2
    const val2_b = noise(5, 5, seed2);

    expect(val1_a).toBe(val1_b);
    expect(val2_a).toBe(val2_b);
    expect(val1_a).not.toBe(val2_a);
  });

  test("specialized noise functions should use correct offsets without breaking cache", () => {
    const baseSeed = 5000;

    // These call noise() with seed + offset
    const tn = terrainNoise(10, 10, baseSeed);
    const bn = biomeNoise(10, 10, baseSeed);

    // Verify consistency
    expect(terrainNoise(10, 10, baseSeed)).toBe(tn);
    expect(biomeNoise(10, 10, baseSeed)).toBe(bn);
  });

  test("noise3d should be consistent", () => {
    const val1 = noise3d(1, 2, 3, 777);
    const val2 = noise3d(1, 2, 3, 777);
    expect(val1).toBe(val2);
  });
});

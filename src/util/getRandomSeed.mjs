/**
 * Generates a random integer within specified range using Math.random().
 *
 * Returns inclusive range [min, max].
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 *
 * @returns {number} Random integer in range
 */
export function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a cryptographically secure random integer within specified range.
 *
 * Uses Web Crypto API to avoid modulo bias for high-security use cases.
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 *
 * @returns {number} Cryptographically random integer in range
 */
export function getCryptoRandomInt(min, max) {
  const range = max - min + 1;
  const maxUint32 = 0xffffffff;

  let rand32, limit;

  // Avoid modulo bias by finding largest multiple of range below maxUint32
  limit = maxUint32 - (maxUint32 % range);

  do {
    rand32 = globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  } while (rand32 > limit);

  return min + (rand32 % range);
}

/**
 * Generates a random seed for world generation.
 *
 * Prefers crypto-secure random if available, falls back to Math.random().
 * Useful for ensuring different worlds on each playthrough.
 *
 * @param {number} [minValue=1] - Minimum seed value (inclusive)
 * @param {number} [maxValue=4294967295] - Maximum seed value (inclusive), 32-bit max
 *
 * @returns {number} Random seed suitable for world generation
 */
export function getRandomSeed(minValue = 1, maxValue = 4294967295) {
  return typeof globalThis.crypto === "object" &&
    typeof globalThis.crypto.getRandomValues === "function"
    ? getCryptoRandomInt(minValue, maxValue)
    : getRandomInRange(minValue, maxValue);
}

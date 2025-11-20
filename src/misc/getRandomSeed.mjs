/**
 * @param {any} min
 * @param {any} max
 *
 * @returns {any}
 */
export function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {any} min
 * @param {any} max
 *
 * @returns {any}
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
 * @param {number} [minValue=1]
 * @param {number} [maxValue=4294967295]
 *
 * @returns {any}
 */
export function getRandomSeed(minValue = 1, maxValue = 4294967295) {
  return typeof globalThis.crypto === "object" &&
    typeof globalThis.crypto.getRandomValues === "function"
    ? getCryptoRandomInt(minValue, maxValue)
    : getRandomInRange(minValue, maxValue).toString();
}

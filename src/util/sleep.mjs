/**
 * Pauses execution for a given number of milliseconds.
 *
 * This utility returns a promise that resolves after the specified
 * delay, allowing callers to use it with await for clean asynchronous
 * timing control.
 *
 * @param {number} ms - The delay duration in milliseconds. Must be a non-negative integer.
 *
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 *
 * @throws {TypeError} If ms is not a number or is NaN.
 * @throws {RangeError} If ms is negative.
 */
export async function sleep(ms) {
  if (typeof ms !== "number" || Number.isNaN(ms)) {
    throw new TypeError("ms must be a valid number");
  }

  if (ms < 0) {
    throw new RangeError("ms must be non-negative");
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

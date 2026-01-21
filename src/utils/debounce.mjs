/**
 * Debounces a function call by delaying its execution until after the specified delay has elapsed since the last
 * invocation.
 *
 * The returned function, when invoked repeatedly, will postpone its execution until delay milliseconds have passed
 * without another invocation. This is useful for rate-limiting events such as keystrokes or window resizing.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds to wait after the last call.
 *
 * @returns {Function} A debounced version of the input function.
 *
 * @example
 * const log = debounce((msg) => console.log(msg), 300);
 * log('a'); log('b'); // Only 'b' will be logged after 300ms
 */
export function debounce(func, delay) {
  let timeout;

  return function (...args) {
    clearTimeout(timeout);

    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

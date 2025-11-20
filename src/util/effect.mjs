import { Signal } from "signal-polyfill";

/**
 * effect implementation from: https://github.com/proposal-signals/signal-polyfill/blob/4cf87cef28aa89e938f079e4d82e9bf10f6d0a4c/README.md
 * @type {boolean}
 */
let needsEnqueue = true;

const watcher = new Signal.subtle.Watcher(() => {
  if (needsEnqueue) {
    needsEnqueue = false;
    globalThis.queueMicrotask(processPending);
  }
});

/** @returns {void} */
function processPending() {
  needsEnqueue = true;

  for (const pendingSignals of watcher.getPending()) {
    pendingSignals.get();
  }

  watcher.watch();
}

/**
 * Registers a reactive side effect that is executed whenever any signals accessed
 * within the `callback` are updated. If the `callback` returns a cleanup function,
 * it will be called before the next effect execution and when the effect is disposed.
 *
 * Caution: Mutating a signal within its own effect may produce an infinite loop.
 * See the README for details.
 * @example
 * import { effect, Signal } from 'signal.mjs';
 *
 * const counter = new Signal.State(0);
 * const isEven = new Signal.Computed(() => (counter.get() & 1) === 0);
 * const parity = new Signal.Computed(() => (isEven.get() ? "even" : "odd"));
 *
 * // Logs "even" immediately, then on every counter change
 * const dispose = effect(() => {
 *   console.log(parity.get());
 * });
 *
 * setInterval(() => counter.set(counter.get() + 1), 1000);
 *
 * // To clean up:
 * // dispose();
 * @param {any} callback -
 * Function executed when dependent signals change. If it returns a function,
 * that function is used as a cleanup and called before the next invocation or disposal.
 *
 * @returns {() => void} Dispose function: when called, the effect stops reacting
 * and any registered cleanup is invoked.
 */
export function effect(callback) {
  let cleanup;

  const computed = new Signal.Computed(() => {
    typeof cleanup === "function" && cleanup();
    cleanup = callback();
  });

  watcher.watch(computed);

  computed.get();

  return () => {
    watcher.unwatch(computed);

    typeof cleanup === "function" && cleanup();

    cleanup = undefined;
  };
}

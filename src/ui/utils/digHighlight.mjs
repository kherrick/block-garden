/**
 * @typedef {import('../../core/systems/game/state.mjs').GameState} GameState
 */

let digHighlightTimeout = null;

/**
 * Starts the dig highlight timer.
 *
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
export function startDigHighlight(shadow) {
  if (digHighlightTimeout) {
    return;
  }

  digHighlightTimeout = setTimeout(() => {
    shadow.getElementById("dig")?.classList.add("is-pressed");

    digHighlightTimeout = null;
  }, 500);
}

/**
 * Stops the dig highlight timer and removes the highlight.
 *
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
export function stopDigHighlight(shadow) {
  if (digHighlightTimeout) {
    clearTimeout(digHighlightTimeout);

    digHighlightTimeout = null;
  }

  shadow.getElementById("dig")?.classList.remove("is-pressed");
}

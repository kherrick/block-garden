/**
 * Enum-like object representing possible player actions.
 * Each action corresponds to a numerical identifier.
 *
 * @readonly
 *
 * @enum {number}
 */
export const ACTIONS = {
  /** Move up (W key). */
  UP: 0,
  /** Move down (S key). */
  DOWN: 1,
  /** Move left (A key). */
  LEFT: 2,
  /** Move right (D key). */
  RIGHT: 3,
  /** Plant a seed (F key). */
  PLANT: 4,
  /** Select a seed from inventory. */
  SELECT_SEED: 5,
  /** Toggle movement or game speed (X key). */
  TOGGLE_SPEED: 6,
  /** No operation (idle action). */
  NOOP: 7,
};

/**
 * Mapping of action IDs to their corresponding display symbols.
 * Useful for creating UI hints or visual overlays.
 *
 * @readonly
 *
 * @type {Object<number, string>}
 */
export const ACTION_NAMES = {
  0: "↑",
  1: "↓",
  2: "←",
  3: "→",
  4: "🌱",
  5: "🎒",
  6: "⚡",
  7: "⸺",
};

/**
 * Mapping of action IDs to their associated keyboard key codes.
 * These codes can be used for input handling.
 *
 * @readonly
 *
 * @type {Object<number, number[]>}
 */
export const ACTION_KEYS = {
  0: [87], // W
  1: [83], // S
  2: [65], // A
  3: [68], // D
  4: [70], // F
  5: [],
  6: [88], // X
  7: [],
};

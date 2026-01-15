/**
 * Enum-like object representing possible player actions.
 * Each action corresponds to a numerical identifier.
 *
 * @readonly
 *
 * @enum {number}
 */
export const ACTIONS = {
  /** Move foward (W key). */
  MOVE_FORWARD: 0,
  /** Move backward (S key). */
  MOVE_BACKWARD: 1,
  /** Move left (A key). */
  MOVE_LEFT: 2,
  /** Move right (D key). */
  MOVE_RIGHT: 3,
  /** Look up (up arrow). */
  LOOK_UP: 4,
  /** Look down (down arrow). */
  LOOK_DOWN: 5,
  /** Look left (left arrow). */
  LOOK_LEFT: 6,
  /** Look right (right arrow). */
  LOOK_RIGHT: 7,
  /** Action (Enter key). */
  ACTION: 8,
  /** Jump (Spacebar). */
  JUMP: 9,
  /** Flight Mode (Double Spacebar). */
  FLIGHT_MODE: 10,
  /** Descend (Shift). */
  DESCEND: 11,
  /** No operation (idle action). */
  NOOP: 12,
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
  0: "w",
  1: "s",
  2: "a",
  3: "d",
  4: "↑",
  5: "↓",
  6: "←",
  7: "→",
  8: "💥",
  9: "🦘",
  10: "🪽",
  11: "📉",
  12: "⸺",
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
  0: [87], // w
  1: [83], // s
  2: [65], // a
  3: [68], // d
  4: [38], // ↑
  5: [40], // ↓
  6: [37], // ←
  7: [38], // →
  8: [13], // enter
  9: [32], // space bar
  10: [32, 32], // flight mode
  11: [16], // descend
  12: [], // noop
};

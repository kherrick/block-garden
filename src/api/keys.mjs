/**
 * Key code to key name mapping.
 *
 * @typedef {{ [code: number]: string }} KeyNameMap
 */

/**
 * Maps legacy key codes (keyCode property) to key names.
 *
 * Used for older keyboard event handling. Note: deprecated but still supported for compatibility.
 *
 * @type {KeyNameMap}
 *
 * @constant
 */
export const keyMap = {
  13: "Enter",
  17: "Control",
  32: " ",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",

  48: "0",
  49: "1",
  50: "2",
  51: "3",
  52: "4",
  53: "5",
  54: "6",
  55: "7",
  56: "8",
  57: "9",

  65: "a",
  66: "b",
  67: "c",
  68: "d",
  69: "e",
  70: "f",
  71: "g",
  72: "h",
  73: "i",
  74: "j",
  75: "k",
  76: "l",
  77: "m",
  78: "n",
  79: "o",
  80: "p",
  81: "q",
  82: "r",
  83: "s",
  84: "t",
  85: "u",
  86: "v",
  87: "w",
  88: "x",
  89: "y",
  90: "z",
};

/**
 * Maps keyboard event codes to their key name strings.
 *
 * Uses the modern keyboard event code property.
 * Extends keyMap with code-specific naming conventions (e.g., 'KeyA', 'Digit1').
 *
 * @type {KeyNameMap}
 *
 * @constant
 */
export const codeMap = {
  ...keyMap,
  13: "Enter",
  17: "ControlLeft",
  32: "Space",

  48: "Digit0",
  49: "Digit1",
  50: "Digit2",
  51: "Digit3",
  52: "Digit4",
  53: "Digit5",
  54: "Digit6",
  55: "Digit7",
  56: "Digit8",
  57: "Digit9",

  65: "KeyA",
  66: "KeyB",
  67: "KeyC",
  68: "KeyD",
  69: "KeyE",
  70: "KeyF",
  71: "KeyG",
  72: "KeyH",
  73: "KeyI",
  74: "KeyJ",
  75: "KeyK",
  76: "KeyL",
  77: "KeyM",
  78: "KeyN",
  79: "KeyO",
  80: "KeyP",
  81: "KeyQ",
  82: "KeyR",
  83: "KeyS",
  84: "KeyT",
  85: "KeyU",
  86: "KeyV",
  87: "KeyW",
  88: "KeyX",
  89: "KeyY",
  90: "KeyZ",
};

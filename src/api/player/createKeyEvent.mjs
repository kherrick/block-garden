import { codeMap as CodeMap, keyMap as KeyMap } from "../misc/keys.mjs";

/**
 * Creates a synthetic KeyboardEvent with specified type and keyCode, mapping
 * key and code values from provided maps or using defaults.
 *
 * @param {string} type - The event type ('keydown', 'keyup', etc.).
 * @param {number} keyCode - The numeric key code for the event.
 * @param {Record<number, string>} [codeMap=CodeMap] - Map from keyCode to code string.
 * @param {Record<number, string>} [keyMap=KeyMap] - Map from keyCode to key string.
 *
 * @returns {KeyboardEvent} The constructed KeyboardEvent object.
 */
export function createKeyEvent(
  type,
  keyCode,
  codeMap = CodeMap,
  keyMap = KeyMap,
) {
  return new KeyboardEvent(type, {
    key: keyMap[keyCode] || "",
    code: codeMap[keyCode] || "",
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
}

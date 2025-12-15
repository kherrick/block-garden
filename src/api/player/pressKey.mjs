import { sleep } from "../misc/sleep.mjs";

import { createKeyEvent } from "./createKeyEvent.mjs";

/**
 * Simulates a key press by dispatching a 'keydown' event, awaiting a hold time,
 * then dispatching a corresponding 'keyup' event.
 *
 * @param {ShadowRoot} shadow - The ShadowRoot of Sprite Garden
 * @param {number} keyCode - The keyCode of the key to press.
 * @param {number} [holdTime=100] - Time in milliseconds to hold the key down.
 *
 * @returns {Promise<void>}
 */
export async function pressKey(shadow, keyCode, holdTime = 100) {
  shadow.dispatchEvent(createKeyEvent("keydown", keyCode));

  await sleep(holdTime);

  shadow.dispatchEvent(createKeyEvent("keyup", keyCode));
}

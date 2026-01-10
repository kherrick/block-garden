import { pressKey } from "./pressKey.mjs";

import { ACTION_KEYS, ACTIONS } from "../misc/actions.mjs";

/**
 * Move the player left
 *
 * @param {ShadowRoot} shadow - The ShadowRoot of Block Garden
 * @param {number} holdTime - The length of time to hold the move left key
 *
 * @returns {Promise<void>}
 */
export async function moveLeft(shadow, holdTime = 200) {
  const [keyA] = ACTION_KEYS[ACTIONS.MOVE_LEFT];

  await pressKey(shadow, keyA, holdTime);
}

/**
 * Move the player right
 *
 * @param {ShadowRoot} shadow - The ShadowRoot of Block Garden
 * @param {number} holdTime - The length of time to hold the move right key
 *
 * @returns {Promise<void>}
 */
export async function moveRight(shadow, holdTime = 200) {
  const [keyD] = ACTION_KEYS[ACTIONS.MOVE_RIGHT];

  await pressKey(shadow, keyD, holdTime);
}

/**
 * Jump up
 *
 * @param {ShadowRoot} shadow - The ShadowRoot of Block Garden
 * @param {number} holdTime - The length of time to hold the jump key
 *
 * @returns {Promise<void>}
 */
export async function jumpUp(shadow, holdTime = 200) {
  const [keyW] = ACTION_KEYS[ACTIONS.MOVE_FORWARD];

  await pressKey(shadow, keyW, holdTime);
}

/**
 * Jump to left
 *
 * @param {ShadowRoot} shadow - The ShadowRoot of Block Garden
 * @param {number} moveLeftDelay - The length of time to wait until the left key is pressed
 * @param {number} holdTime - The length of time to hold the jump and move left keys
 *
 * @returns {Promise<void>}
 */
export async function jumpUpLeft(shadow, moveLeftDelay = 50, holdTime = 200) {
  await jumpUp(shadow, holdTime);

  setTimeout(() => moveLeft(shadow, holdTime), moveLeftDelay);
}

/**
 * Jump to right
 *
 * @param {ShadowRoot} shadow - The ShadowRoot of Block Garden
 * @param {number} moveRightDelay - The length of time to wait until the right key is pressed
 * @param {number} holdTime - The length of time to hold the jump and right keys
 *
 * @returns {Promise<void>}
 */
export async function jumpUpRight(shadow, moveRightDelay = 50, holdTime = 200) {
  await jumpUp(shadow, holdTime);

  setTimeout(() => moveRight(shadow, holdTime), moveRightDelay);
}

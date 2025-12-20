import { isKeyPressed } from "../util/isKeyPressed.mjs";

/** @typedef {import('../init/game.mjs').CustomShadowHost} CustomShadowHost */
/** @typedef {import('../state/state.mjs').GameState} GameState */

/**
 *
 * @param {ShadowRoot} shadow
 * @param {GameState} state
 * @param {number} dt
 *
 * @returns {void}
 */
export function updatePlayer(shadow, state, dt) {
  const { yaw, flying } = state;
  const speed = flying ? 12 : 8; // Faster when flying

  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);

  let targetDx = 0,
    targetDz = 0;

  if (isKeyPressed(shadow, "w")) {
    targetDx += fx * speed;
    targetDz += fz * speed;
  } else if (isKeyPressed(shadow, "a")) {
    targetDx += fz * speed;
    targetDz -= fx * speed;
  } else if (isKeyPressed(shadow, "s")) {
    targetDx -= fx * speed;
    targetDz -= fz * speed;
  } else if (isKeyPressed(shadow, "d")) {
    targetDx -= fz * speed;
    targetDz += fx * speed;
  } else if (isKeyPressed(shadow, "upleft")) {
    // W + A
    targetDx += (fx + fz) * speed;
    targetDz += (fz - fx) * speed;
  } else if (isKeyPressed(shadow, "upright")) {
    // W + D
    targetDx += (fx - fz) * speed;
    targetDz += (fz + fx) * speed;
  } else if (isKeyPressed(shadow, "downleft")) {
    // S + A
    targetDx += (-fx + fz) * speed;
    targetDz += (-fz - fx) * speed;
  } else if (isKeyPressed(shadow, "downright")) {
    // S + D
    targetDx += (-fx - fz) * speed;
    targetDz += (-fz + fx) * speed;
  }

  // Smooth acceleration
  state.dx += (targetDx - state.dx) * (flying ? 15 : 10) * dt;
  state.dz += (targetDz - state.dz) * (flying ? 15 : 10) * dt;

  // Friction (less in air/flying)
  const friction = flying ? 0.95 : 0.92;
  state.dx *= friction;
  state.dz *= friction;
}

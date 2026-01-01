import { isKeyPressed } from "../util/isKeyPressed.mjs";
import { placeBlock, removeBlock } from "../util/interaction.mjs";

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
  if (isKeyPressed(shadow, "control")) {
    return;
  }

  const { yaw, flying } = state;
  const speed = flying ? 12 : 8; // Faster when flying

  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);

  let targetDx = 0,
    targetDz = 0;

  if (isKeyPressed(shadow, "w")) {
    targetDx += fx * speed;
    targetDz += fz * speed;
  }

  if (isKeyPressed(shadow, "a")) {
    targetDx += fz * speed;
    targetDz -= fx * speed;
  }

  if (isKeyPressed(shadow, "s")) {
    targetDx -= fx * speed;
    targetDz -= fz * speed;
  }

  if (isKeyPressed(shadow, "d")) {
    targetDx -= fz * speed;
    targetDz += fx * speed;
  }

  if (isKeyPressed(shadow, "upleft")) {
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

  if (state.arrowsControlCamera.get()) {
    // CAMERA ROTATION
    const ROTATION_SPEED = 2.0;

    if (isKeyPressed(shadow, "arrowleft")) {
      state.yaw += ROTATION_SPEED * dt;
    }
    if (isKeyPressed(shadow, "arrowright")) {
      state.yaw -= ROTATION_SPEED * dt;
    }

    if (isKeyPressed(shadow, "arrowup")) {
      state.pitch += ROTATION_SPEED * dt;
    }
    if (isKeyPressed(shadow, "arrowdown")) {
      state.pitch -= ROTATION_SPEED * dt;
    }

    // Clamp pitch
    const MAX_PITCH = Math.PI / 2 - 0.01;
    state.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, state.pitch));
  } else {
    if (isKeyPressed(shadow, "arrowup")) {
      targetDx += fx * speed;
      targetDz += fz * speed;
    } else if (isKeyPressed(shadow, "arrowleft")) {
      targetDx += fz * speed;
      targetDz -= fx * speed;
    } else if (isKeyPressed(shadow, "arrowdown")) {
      targetDx -= fx * speed;
      targetDz -= fz * speed;
    } else if (isKeyPressed(shadow, "arrowright")) {
      targetDx -= fz * speed;
      targetDz += fx * speed;
    }
  }

  // action key interaction
  if (isKeyPressed(shadow, "enter")) {
    if (state.actionKeyPressTime === 0) {
      // Just started pressing
      state.actionKeyPressTime = performance.now();
    } else if (state.actionKeyPressTime > 0) {
      // Key is being held (not already handled)
      const holdDuration = performance.now() - state.actionKeyPressTime;
      if (holdDuration > 500) {
        // Long press: remove block
        removeBlock(state);

        // Mark as handled and store time for repeat removal (negative = removal mode)
        state.actionKeyPressTime = -performance.now();
      }
    } else {
      // actionKeyPressTime < 0 means we're in removal mode, check for repeat
      const lastRemoveTime = -state.actionKeyPressTime;
      if (performance.now() - lastRemoveTime > 300) {
        removeBlock(state);
        state.actionKeyPressTime = -performance.now();
      }
    }
    // If actionKeyPressTime === -1, do nothing (already handled this press)
  } else {
    // Key released
    if (state.actionKeyPressTime > 0) {
      const holdDuration = performance.now() - state.actionKeyPressTime;
      if (holdDuration <= 500) {
        // Short press: place block
        placeBlock(state);
      }
    }

    // Reset for next press (whether it was handled or not)
    state.actionKeyPressTime = 0;
  }

  // Smooth acceleration
  state.dx += (targetDx - state.dx) * (flying ? 15 : 10) * dt;
  state.dz += (targetDz - state.dz) * (flying ? 15 : 10) * dt;

  // Friction (less in air/flying)
  const friction = flying ? 0.95 : 0.92;
  state.dx *= friction;
  state.dz *= friction;
}

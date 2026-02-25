import { isKeyPressed } from "../../utils/isKeyPressed.mjs";
import { placeBlock } from "../../utils/interaction.mjs";
import { gameConfig } from "../world/config/index.mjs";

/** @typedef {import('../../core/systems/game/init.mjs').CustomShadowHost} CustomShadowHost */
/** @typedef {import('../../core/systems/game/state.mjs').GameState} GameState */

/**
 * @param {ShadowRoot} shadow
 * @param {GameState} state
 * @param {number} dt
 *
 * @returns {void}
 */
export function updatePlayer(shadow, state, dt) {
  if (state.isCanvasActionDisabled) {
    return;
  }

  const { yaw, flying } = state;
  const movementMultiplier = gameConfig.useFastMovement.get() ? 3 : 1;
  const isFlying = flying.get();
  const speed = (isFlying ? 12 : 8) * movementMultiplier; // Faster when flying

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
        // Long press: start breaking input
        state.breakingInput.isHeld = true;
        state.breakingInput.mode = "center";

        // Mark as handled (negative) but keep reference time
        state.actionKeyPressTime = -state.actionKeyPressTime;
      }
    } else {
      // Already breaking (negative time), ensure we keep input held
      state.breakingInput.isHeld = true;
      state.breakingInput.mode = "center";
    }
  } else {
    // Key released
    if (state.actionKeyPressTime < 0) {
      state.breakingInput.isHeld = false;
    } else if (state.actionKeyPressTime > 0) {
      const holdDuration = performance.now() - state.actionKeyPressTime;
      if (holdDuration <= 500) {
        // Short press: place block
        placeBlock(state);
      }
    }

    // Reset for next press
    state.actionKeyPressTime = 0;
  }

  // Smooth acceleration
  state.dx += (targetDx - state.dx) * (isFlying ? 15 : 10) * dt;
  state.dz += (targetDz - state.dz) * (isFlying ? 15 : 10) * dt;

  // Friction (less in air/flying, more in water)
  const friction = isFlying ? 0.95 : state.isSubmerged ? 0.85 : 0.92;
  state.dx *= friction;
  state.dz *= friction;

  // Reduce horizontal speed when submerged
  if (state.isSubmerged && !isFlying) {
    state.dx *= 0.6;
    state.dz *= 0.6;
  }
}

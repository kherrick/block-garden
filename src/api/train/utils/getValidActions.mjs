import { ACTIONS } from "../../misc/actions.mjs";

/** @typedef {import("../Train.types.mjs").EnvState} EnvState */

/**
 * Get list of valid actions for current state.
 * Filters out actions that violate constraints (like jump cooldown).
 *
 * @param {EnvState} state - Current environment state.
 * @returns {number[]} Array of valid action indices.
 */
export function getValidActions(state) {
  const validActions = [];

  // Check if UP (jump) is valid
  if (state.canJump && state.onGround) {
    validActions.push(ACTIONS.UP);
  }

  // Conditionally allow PLANT
  if (state.hasSeeds && state.farmableBelow && !state.alreadyPlanted) {
    validActions.push(ACTIONS.PLANT);
  }

  // Conditionally allow SELECT_SEED
  if (
    state.hasSeeds &&
    (!state.seedSelected || state.selectedSeedCount === 0)
  ) {
    validActions.push(ACTIONS.SELECT_SEED);
  }

  // Always allow other actions
  validActions.push(ACTIONS.LEFT);
  validActions.push(ACTIONS.RIGHT);
  validActions.push(ACTIONS.TOGGLE_SPEED);
  validActions.push(ACTIONS.NOOP);

  return validActions;
}

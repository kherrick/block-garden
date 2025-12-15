import { ACTIONS } from "../misc/actions.mjs";

/**
 * @typedef {Object} State
 *
 * @property {number} [x] - X-coordinate of the agent.
 * @property {number} [y] - Y-coordinate of the agent.
 * @property {boolean} [onGround] - Whether the agent is touching the ground.
 * @property {boolean} [hasSeeds] - Whether the agent currently has seeds.
 * @property {boolean} [seedSelected] - Whether a seed is currently selected.
 * @property {boolean} [farmableBelow] - Whether the tile below can be farmed.
 * @property {boolean} [airAbove] - Whether there is air above the agent.
 * @property {boolean} [alreadyPlanted] - Whether the current tile has already been planted.
 * @property {boolean} [canJump] - Whether the agent should be allowed to jump.
 * @property {number} [progress] - A normalized growth or progress value (0–1).
 * @property {number} [consecutiveJumps] - Number of consecutive jumps made by the agent.
 */

/**
 * Q-Learning agent for sprite garden automation.
 *
 * Implements a tabular Q-learning algorithm for reinforcement learning.
 * The agent learns value estimates for each (state, action) pair and
 * updates them using experience from interactions with the environment.
 */
export class QLearning {
  /**
   * Create a new Q-learning agent.
   *
   * @param {number} nActions - Total number of possible actions.
   * @param {number} alpha - Learning rate (0 < α ≤ 1).
   * @param {number} gamma - Discount factor for future rewards (0 ≤ γ ≤ 1).
   * @param {number} epsilon - Exploration rate (0 ≤ ε ≤ 1).
   */
  constructor(nActions, alpha, gamma, epsilon) {
    /** @type {number} */
    this.nActions = nActions;

    /** @type {number} */
    this.alpha = alpha;

    /** @type {number} */
    this.gamma = gamma;

    /** @type {number} */
    this.epsilon = epsilon;

    /**
     * The Q-table mapping serialized state keys to numeric Q-value arrays.
     *
     * @type {Map<string, number[]>}
     */
    this.q = new Map();
  }

  /**
   * Convert a `State` object into a stable, normalized key string.
   * Ensures that invalid values don't corrupt the Q-table.
   *
   * @param {State} s - Current environment state.
   *
   * @returns {string} A unique and consistent key for the Q-table.
   */
  stateKey(s) {
    if (!s || typeof s !== "object") {
      return "invalid_state";
    }

    const safeState = {
      x: isFinite(s.x) ? Math.floor(s.x) : 0,
      y: isFinite(s.y) ? Math.floor(s.y) : 0,
      g: !!s.onGround ? 1 : 0,
      cjmp: !!s.canJump ? 1 : 0,
      hs: !!s.hasSeeds ? 1 : 0,
      sel: !!s.seedSelected ? 1 : 0,
      f: !!s.farmableBelow ? 1 : 0,
      a: !!s.airAbove ? 1 : 0,
      p: !!s.alreadyPlanted ? 1 : 0,
      prog: isFinite(s.progress) ? Math.floor(s.progress * 10) : 0,
      cj: Math.min(s.consecutiveJumps || 0, 5),
    };

    return JSON.stringify(safeState);
  }

  /**
   * Return the Q-value array for the given state key.
   * Initializes it with zeros if unseen.
   *
   * @param {string} k - State key string.
   *
   * @returns {number[]} Q-values for all possible actions.
   */
  getQ(k) {
    if (!this.q.has(k)) {
      this.q.set(k, Array(this.nActions).fill(0));
    }

    return this.q.get(k);
  }

  /**
   * Choose an action using an epsilon-greedy policy with action masking.
   *
   * With probability ε, a random VALID action is chosen (exploration).
   * Otherwise, the VALID action with the highest Q-value is selected (exploitation).
   *
   * @param {State} s - Current state.
   * @param {number[]} [validActions=null] - Array of valid action indices. If null, all actions are valid.
   *
   * @returns {number} The chosen action index.
   */
  selectAction(s, validActions = null) {
    const k = this.stateKey(s);
    const q = this.getQ(k);

    if (!validActions || validActions.length === 0) {
      validActions = Array.from({ length: this.nActions }, (_, i) => i);
    }

    // BEHAVIORAL CONSTRAINT: Discourage (but don't forbid) jumping on plantable ground
    // Only remove jump if we're REALLY in perfect planting position
    if (
      s.onGround &&
      s.farmableBelow &&
      !s.alreadyPlanted &&
      s.hasSeeds &&
      s.seedSelected &&
      s.consecutiveJumps < 2 // Allow some jumping to escape stuck states
    ) {
      // During exploration, allow occasional jumps
      if (Math.random() > this.epsilon) {
        validActions = validActions.filter((a) => a !== 0);
      }
    }

    // Ensure we have at least one valid action
    if (validActions.length === 0) {
      validActions = [ACTIONS.PLANT, ACTIONS.NOOP]; // Allow PLANT or NOOP as fallback
    }

    // EXPLORATION
    if (Math.random() < this.epsilon) {
      return validActions[Math.floor(Math.random() * validActions.length)];
    }

    // Choose best valid action
    let bestAction = validActions[0];
    let bestValue = q[bestAction];

    for (const action of validActions) {
      if (q[action] > bestValue) {
        bestValue = q[action];
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Perform a single Q-learning update given a transition.
   *
   * @param {State} s - Current state.
   * @param {number} a - Action index taken in the current state.
   * @param {number} r - Reward received after performing the action.
   * @param {State} ns - Next state observed after performing the action.
   * @param {boolean} done - Whether the episode has ended.
   */
  learn(s, a, r, ns, done) {
    const sk = this.stateKey(s);
    const nsk = this.stateKey(ns);
    const q = this.getQ(sk);
    const nq = this.getQ(nsk);

    const safeR = isFinite(r) ? r : 0;
    const maxNext = done ? 0 : Math.max(...nq);

    q[a] = isFinite(q[a]) ? q[a] : 0;

    const target = safeR + this.gamma * maxNext;
    q[a] += this.alpha * (target - q[a]);

    if (!isFinite(q[a])) {
      q[a] = 0;
    }
  }

  /**
   * Export the internal Q-table and hyperparameters for persistence.
   *
   * @returns {{ q: [string, number[]][], alpha: number, gamma: number, epsilon: number }} - Serializable object that can be saved to a file or localStorage.
   */
  exportQ() {
    return {
      q: Array.from(this.q.entries()),
      alpha: this.alpha,
      gamma: this.gamma,
      epsilon: this.epsilon,
    };
  }

  /**
   * Import a previously saved Q-table and hyperparameters.
   * Safely clamps parameter values to valid ranges.
   *
   * @param {{ q: [string, number[]][], alpha?: number, gamma?: number, epsilon?: number }} data - Q-table and hyperparameter data to import.
   *
   * @returns {boolean} True if successfully imported, false otherwise.
   */
  importQ(data) {
    try {
      if (!data?.q) {
        throw new Error("No Q-table data");
      }

      this.q.clear();

      for (const [k, v] of data.q) {
        if (Array.isArray(v) && v.length === this.nActions) {
          const safeV = v.map((x) => (isFinite(x) ? x : 0));
          this.q.set(k, safeV);
        }
      }

      if (typeof data.alpha === "number") {
        this.alpha = Math.max(0.01, Math.min(1, data.alpha));
      }

      if (typeof data.gamma === "number") {
        this.gamma = Math.max(0.8, Math.min(0.99, data.gamma));
      }

      if (typeof data.epsilon === "number") {
        this.epsilon = Math.max(0, Math.min(1, data.epsilon));
      }

      return true;
    } catch (e) {
      console.error("Import failed:", e);

      this.q.clear();

      return false;
    }
  }
}

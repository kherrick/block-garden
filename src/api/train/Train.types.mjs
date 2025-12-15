/**
 * All UI references used by the training panel.
 *
 * @typedef {Object} TrainUI
 *
 * @property {HTMLElement} panel
 * @property {HTMLElement|null} episode
 * @property {HTMLElement|null} totalEpisodes
 * @property {HTMLElement|null} bestTime
 * @property {HTMLElement|null} qTableSize
 * @property {HTMLElement|null} epsilon
 * @property {HTMLElement|null} seedsPlanted
 * @property {HTMLElement|null} seedsLeftToPlant
 * @property {HTMLElement|null} successStreak
 * @property {HTMLElement|null} trainAction
 * @property {HTMLElement|null} consecutiveFailures
 * @property {HTMLElement|null} logs
 * @property {HTMLInputElement|null} episodesInput
 * @property {HTMLInputElement|null} maxStepsInput
 * @property {HTMLInputElement|null} alphaInput
 * @property {HTMLInputElement|null} gammaInput
 * @property {HTMLInputElement|null} epsilonInput
 * @property {HTMLInputElement|null} testEpsilonInput
 * @property {HTMLInputElement|null} decayInput
 * @property {HTMLButtonElement|null} startBtn
 * @property {HTMLButtonElement|null} stopBtn
 * @property {HTMLButtonElement|null} testBtn
 * @property {HTMLButtonElement|null} exportBtn
 * @property {HTMLButtonElement|null} importBtn
 * @property {HTMLButtonElement|null} clearLogsBtn
 * @property {HTMLButtonElement|null} copyLogsBtn
 */

/**
 * A single training log entry.
 *
 * @typedef {Object} TrainingLogEntry
 * @property {string} time - Human-readable time string.
 * @property {string} message - Log message.
 * @property {"info"|"success"|"warning"|"error"} type - Log severity/style.
 */

/**
 * Top-level training statistics exposed by {@link Train#getStats}.
 *
 * @typedef {Object} TrainingStats
 *
 * @property {number} episode
 * @property {number} totalEpisodes
 * @property {number} bestTime
 * @property {boolean} isTraining
 * @property {boolean} isTesting
 * @property {boolean} isHalfSpeed
 * @property {number} qTableSize
 * @property {number} epsilon
 * @property {number} consecutiveFailures
 * @property {number} successStreak
 * @property {number} seedsPlanted
 * @property {number} seedsLeftToPlant
 * @property {number} jumpCount
 * @property {number} failedPlantAttempts
 * @property {number} lastReward
 */

/**
 * Training configuration for the reinforcement learning agent.
 *
 * Each property controls an aspect of the training loop, such as the learning rate,
 * discount factor, or exploration behavior.
 *
 * @typedef {Object} AgentConfig
 *
 * @property {number} episodes - Number of full training episodes (from reset to termination or timeout).
 * @property {number} maxSteps - Maximum number of steps per episode before forcing a reset.
 * @property {number} alpha - Learning rate (α). Controls how quickly the value function updates.
 * @property {number} gamma - Discount factor (γ). Determines the importance of future rewards.
 * @property {number} epsilon - Initial exploration rate (ϵ) for an ϵ-greedy policy.
 * @property {number} decay - Multiplicative decay factor applied to ϵ across episodes.
 */

/**
 * Environment state used by the Q-learning agent.
 *
 * This is the compact, feature-based representation of the current game state.
 *
 * @typedef {Object} EnvState
 *
 * @property {number} x - Player tile X coordinate.
 * @property {number} y - Player tile Y coordinate.
 * @property {boolean} onGround - Whether the player is on solid ground.
 * @property {boolean} farmableBelow - Whether the tile directly below can be farmed.
 * @property {boolean} airAbove - Whether the tile directly above is empty/air.
 * @property {boolean} canJump - Whether the agent should be allowed to jump.
 * @property {number} consecutiveJumps - How many jumps in a row have occurred.
 *
 * @property {boolean} hasSeeds - Whether there are any seeds remaining to plant.
 * @property {boolean} seedSelected - Whether a seed is currently selected.
 * @property {string|null} selectedSeedType - The type of seed currently selected.
 * @property {number} selectedSeedCount - The count of the currently selected seed.
 * @property {number} seedsPlanted - Count of seeds planted so far in this episode.
 * @property {number} seedsLeftToPlant - Total seeds remaining to be planted.
 * @property {number} progress - Fraction of seeds planted in [0, 1].
 * @property {boolean} alreadyPlanted - Whether the current tile has already been planted.
 *
 * @property {boolean} isHalfSpeed = Whether the agent is at 0.5 or 1x
 * @property {number} stepCount - Steps taken so far in this episode.
 */

/**
 * Step result from the environment.
 *
 * @typedef {Object} StepResult
 *
 * @property {EnvState} state - Next environment state.
 * @property {number} reward - Scalar reward for the transition.
 * @property {boolean} done - Whether the episode has terminated.
 */

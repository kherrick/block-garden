import { Signal } from "signal-polyfill";
import localForage from "localforage";

import { effect } from "../../util/effect.mjs";
import { sleep } from "../misc/sleep.mjs";

import { updateMovementScaleValue } from "../../update/ui/movementScale.mjs";

import { pressKey } from "../player/pressKey.mjs";
import { ACTION_KEYS, ACTION_NAMES, ACTIONS } from "../misc/actions.mjs";
import { keyMap } from "../misc/keys.mjs";

import { SpriteGarden } from "../SpriteGarden.mjs";
import { QLearning } from "./QLearning.mjs";

import { getSelectedSeed } from "./utils/getSelectedSeed.mjs";
import { handleExport } from "./utils/handleExport.mjs";
import { handleImport } from "./utils/handleImport.mjs";
import { handleCopyLogs } from "./utils/handleCopyLogs.mjs";
import { getValidActions } from "./utils/getValidActions.mjs";
import { selectNextSeed } from "./utils/selectNextSeed.mjs";
import { getSeedButtons } from "./utils/getSeedButtons.mjs";

/** @typedef {import("./Train.types.mjs").AgentConfig} AgentConfig */
/** @typedef {import("./Train.types.mjs").EnvState} EnvState */
/** @typedef {import("./Train.types.mjs").StepResult} StepResult */
/** @typedef {import("./Train.types.mjs").TrainingLogEntry} TrainingLogEntry */
/** @typedef {import("./Train.types.mjs").TrainingStats} TrainingStats */
/** @typedef {import("./Train.types.mjs").TrainUI} TrainUI */

/**
 * Reinforcement Learning training extension for SpriteGarden.
 *
 * Manages environment interaction, reward computation, logging, and UI integration
 * for a Q-learning agent that learns to plant seeds efficiently.
 *
 * @extends SpriteGarden
 */
export class Train extends SpriteGarden {
  /**
   * Flag indicating whether training should be stopped.
   * @type {boolean}
   */
  #shouldStop = false;

  /**
   * Toast event listener used to track game feedback.
   * @type {((e: CustomEvent) => void) | null}
   */
  #toastListener = null;

  /**
   * Cached references to UI elements in the training panel.
   * @type {TrainUI|null}
   */
  #ui = null;

  constructor() {
    super();

    /**
     * Wehther the agent is at half speed.
     * @type {Signal.State<boolean>}
     */
    this.isHalfSpeed = new Signal.State(false);

    /**
     * Whether training is currently active.
     * @type {Signal.State<boolean>}
     */
    this.isTraining = new Signal.State(false);

    /**
     * Whether test is currently active.
     * @type {Signal.State<boolean>}
     */
    this.isTesting = new Signal.State(false);

    /**
     * The Q-learning agent instance.
     * @type {QLearning|null}
     */
    this.agent = null;

    /**
     * Best completion time (in seconds) across episodes.
     * @type {Signal.State<number>}
     */
    this.bestTime = new Signal.State(Infinity);

    /**
     * Current episode index (1-based when training).
     * @type {Signal.State<number>}
     */
    this.episode = new Signal.State(0);

    /**
     * Total number of episodes scheduled for the current training run.
     * @type {Signal.State<number>}
     */
    this.totalEpisodes = new Signal.State(0);

    /**
     * Number of consecutive failed (incomplete) episodes.
     * @type {Signal.State<number>}
     */
    this.consecutiveFailures = new Signal.State(0);

    /**
     * Number of consecutive successful episodes.
     * @type {Signal.State<number>}
     */
    this.successStreak = new Signal.State(0);

    /**
     * List of structured training log entries.
     * @type {Signal.State<TrainingLogEntry[]>}
     */
    this.logs = new Signal.State([]);

    // Environment state

    /**
     * Episode start timestamp in milliseconds since epoch.
     * @type {Signal.State<number>}
     */
    this.startTime = new Signal.State(0);

    /**
     * Number of environment steps taken in the current episode.
     * @type {Signal.State<number>}
     */
    this.stepCount = new Signal.State(0);

    /**
     * Set of tile keys (e.g. "x,y") where seeds were planted.
     * @type {Signal.State<Set<string>>}
     */
    this.plantedTiles = new Signal.State(new Set());

    /**
     * Last known tile position of the agent.
     * @type {Signal.State<{x:number,y:number} | null>}
     */
    this.lastPos = new Signal.State(null);

    /**
     * Number of steps spent at the same tile without moving.
     * @type {Signal.State<number>}
     */
    this.stillStepsAtTile = new Signal.State(0);

    /**
     * Total number of jumps in the current episode.
     * @type {Signal.State<number>}
     */
    this.jumpCount = new Signal.State(0);

    /**
     * Number of consecutive jumps without another action.
     * @type {Signal.State<number>}
     */
    this.consecutiveJumps = new Signal.State(0);

    /**
     * Whether the last action performed was a jump.
     * @type {Signal.State<boolean>}
     */
    this.lastActionWasJump = new Signal.State(false);

    /**
     * Number of times speed toggle was used in the current episode.
     * @type {Signal.State<number>}
     */
    this.speedToggleCount = new Signal.State(0);

    /**
     * Number of failed planting attempts detected via toast events.
     * @type {Signal.State<number>}
     */
    this.failedPlantAttempts = new Signal.State(0);

    /**
     * Timestamp of the last failed plant attempt.
     * @type {Signal.State<number>}
     */
    this.lastFailedPlantTime = new Signal.State(0);

    /**
     * Reactive source for remaining seeds to plant, from computed game state.
     * @type {Signal.State<number>}
     */
    this.seedsLeftToPlant = this.computed.totalSeeds;

    /**
     * Last executed training action label for display.
     * @type {Signal.State<string|null>}
     */
    this.trainAction = new Signal.State(null);

    /**
     * Number of seeds planted so far in this episode.
     * @type {Signal.State<number>}
     */
    this.seedsPlanted = new Signal.State(0);

    /**
     * Most recently computed reward value.
     * @type {Signal.State<number>}
     */
    this.lastReward = new Signal.State(0);

    /**
     * Timestamp of the last jump action (in milliseconds).
     * @type {number}
     */
    this.lastJumpTime = 0;
  }

  /**
   * Initialize the training environment and UI if necessary.
   *
   * Ensures the training UI is created.
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    // Initialize UI
    if (!this.#ui?.panel) {
      this.#initializeUI();
    }

    this.log("✅ Environment initialized", "success");
  }

  /**
   * Initialize the Train UI and wire up DOM event handlers and reactive effects.
   *
   * Looks up elements inside the shadow root and binds button click handlers
   * and signal-based UI updates.
   *
   * @returns {void}
   */
  #initializeUI() {
    const panel = this.shadow?.querySelector("#trainPanel");
    if (!panel) return;

    /** @type {TrainUI} */
    this.#ui = {
      panel: /** @type {HTMLElement|null} */ (panel),
      episode: /** @type {HTMLElement|null} */ (
        this.shadow.querySelector("#trainEpisode")
      ),
      totalEpisodes: this.shadow.querySelector("#trainTotalEpisodes"),
      bestTime: this.shadow.querySelector("#trainBestTime"),
      qTableSize: this.shadow.querySelector("#trainQTableSize"),
      epsilon: this.shadow.querySelector("#trainEpsilon"),
      seedsPlanted: this.shadow.querySelector("#seedsPlanted"),
      seedsLeftToPlant: this.shadow.querySelector("#seedsLeftToPlant"),
      successStreak: this.shadow.querySelector("#trainSuccessStreak"),
      trainAction: this.shadow.querySelector("#trainAction"),
      consecutiveFailures: this.shadow.querySelector(
        "#trainConsecutiveFailures",
      ),
      logs: this.shadow.querySelector("#trainLogs"),

      // Config inputs
      episodesInput: /** @type {HTMLInputElement|null} */ (
        this.shadow.querySelector("#trainEpisodes")
      ),
      maxStepsInput: this.shadow.querySelector("#trainMaxSteps"),
      alphaInput: this.shadow.querySelector("#trainAlpha"),
      gammaInput: this.shadow.querySelector("#trainGamma"),
      epsilonInput: this.shadow.querySelector("#trainEpsilonInput"),
      decayInput: this.shadow.querySelector("#trainDecay"),
      testEpsilonInput: this.shadow.querySelector("#testEpsilonInput"),

      // Buttons
      startBtn: this.shadow.querySelector("#trainStartBtn"),
      stopBtn: this.shadow.querySelector("#trainStopBtn"),
      testBtn: this.shadow.querySelector("#trainTestBtn"),
      exportBtn: this.shadow.querySelector("#trainExportBtn"),
      importBtn: this.shadow.querySelector("#trainImportBtn"),
      clearLogsBtn: this.shadow.querySelector("#trainClearLogsBtn"),
      copyLogsBtn: this.shadow.querySelector("#trainCopyLogsBtn"),
    };

    // Setup button handlers
    this.#ui.stopBtn?.addEventListener("click", () => this.stop());
    this.#ui.testBtn?.addEventListener("click", () => this.test());
    this.#ui.clearLogsBtn?.addEventListener("click", () => this.clearLogs());
    this.#ui.startBtn?.addEventListener("click", () =>
      this.handleStartTraining(),
    );

    this.#ui.exportBtn?.addEventListener("click", () =>
      handleExport({ getExportData: this.exportAgent.bind(this) }),
    );

    this.#ui.importBtn?.addEventListener("click", () =>
      handleImport({
        importAgent: this.importAgent.bind(this),
        log: this.log.bind(this),
      }),
    );

    this.#ui.copyLogsBtn?.addEventListener("click", () =>
      handleCopyLogs({
        logsContainer: this.#ui?.logs,
        log: this.log.bind(this),
      }),
    );

    // Initialize reactive effects for UI updates
    this.#initEffects();
  }

  /**
   * Sets up reactive effects to sync signal state into the UI.
   *
   * Ties internal signals (episode, epsilon, seedsPlanted, etc.) to DOM text
   * content so the panel stays up-to-date.
   *
   * @returns {void}
   */
  #initEffects() {
    const ui = this.#ui;
    if (!ui) {
      return;
    }

    // Status
    effect(() => {
      if (ui.trainAction) {
        ui.trainAction.textContent = this.trainAction.get() ?? "";
      }
    });

    // Training state buttons
    effect(() => {
      const isTraining = this.isTraining.get();
      const isTesting = this.isTesting.get();

      if (ui.startBtn) {
        ui.startBtn.disabled = isTraining;
      }

      if (ui.stopBtn) {
        ui.stopBtn.disabled = !isTraining && !isTesting;
      }

      if (ui.testBtn) {
        ui.testBtn.disabled = isTraining;
      }
    });

    // Episode progress
    effect(() => {
      if (ui.episode) {
        ui.episode.textContent = String(this.episode.get());
      }

      if (ui.totalEpisodes) {
        ui.totalEpisodes.textContent = String(this.totalEpisodes.get());
      }
    });

    // Best time
    effect(() => {
      const time = this.bestTime.get();
      if (ui.bestTime) {
        ui.bestTime.textContent = time === Infinity ? "--" : time.toFixed(1);
      }
    });

    // Seeds planted / total seeds
    effect(() => {
      if (ui.seedsPlanted) {
        ui.seedsPlanted.textContent = String(this.seedsPlanted.get());
      }

      if (ui.seedsLeftToPlant) {
        const val = this.seedsLeftToPlant.get();

        ui.seedsLeftToPlant.textContent = String(val ?? 0);
      }
    });

    // Streaks
    effect(() => {
      if (ui.successStreak) {
        ui.successStreak.textContent = String(this.successStreak.get());
      }

      if (ui.consecutiveFailures) {
        ui.consecutiveFailures.textContent = String(
          this.consecutiveFailures.get(),
        );
      }
    });

    // Q-learning stats (conditional on agent existing)
    effect(() => {
      this.isTraining.get();
      this.episode.get();

      if (!this.agent) {
        return;
      }

      if (ui.qTableSize) {
        ui.qTableSize.textContent = String(this.agent.q.size);
      }

      if (ui.epsilon) {
        ui.epsilon.textContent = this.agent.epsilon.toFixed(3);
      }
    });
  }

  /**
   * Parse UI input values into an {@link AgentConfig} and start training.
   *
   * @returns {Promise<void>}
   */
  async handleStartTraining() {
    /** @type {AgentConfig} */
    const config = {
      episodes: parseInt(this.#ui.episodesInput?.value ?? "") || 50,
      maxSteps: parseInt(this.#ui.maxStepsInput?.value ?? "") || 100,
      alpha: parseFloat(this.#ui.alphaInput?.value ?? "") || 0.2,
      gamma: parseFloat(this.#ui.gammaInput?.value ?? "") || 0.95,
      epsilon: parseFloat(this.#ui.epsilonInput?.value ?? "") || 0.2,
      decay: parseFloat(this.#ui.decayInput?.value ?? "") || 0.995,
    };

    await this.startTraining(config);
  }

  /**
   * Clear all logs from the internal log state and UI.
   *
   * @returns {void}
   */
  clearLogs() {
    this.logs.set([]);
  }

  /**
   * Update the logs area in the UI with the latest entry.
   *
   * @param {TrainingLogEntry} entry - Latest log entry to display.
   *
   * @returns {void}
   */
  updateLogsDisplay(entry) {
    if (!this.#ui?.logs) {
      return;
    }

    const logElement = document.createElement("div");
    logElement.className = `train-log-entry train-log-entry--${entry.type}`;
    logElement.innerHTML = `
      <span class="train-log-time">${entry.time}</span>
      <span class="train-log-message">${entry.message}</span>
    `;

    this.#ui.logs.prepend(logElement);
  }

  /**
   * Setup toast event listener for game events used to update training metrics.
   *
   * Listens to "sprite-garden-toast" events for feedback like "cannot plant"
   * or "planted", updating counters and logs accordingly.
   *
   * @returns {void}
   */
  #setupToastListener() {
    if (this.#toastListener) {
      return;
    }

    /**
     * @param {CustomEvent & {detail?: {message?: string}}} e
     */
    this.#toastListener = (e) => {
      if (!e.detail?.message) {
        return;
      }

      const msg = e.detail.message;
      this.log(`🍞 ${msg}`);
    };

    this.shadow?.addEventListener("sprite-garden-toast", this.#toastListener);
  }

  #removeToastListener() {
    if (!this.#toastListener) {
      return;
    }

    this.shadow?.removeEventListener(
      "sprite-garden-toast",
      this.#toastListener,
    );
    this.#toastListener = null;
  }

  /**
   * Get current environment state.
   *
   * Queries the player and world information, normalizes it into an {@link EnvState}
   * object. If state cannot be computed, returns a zeroed fallback state.
   *
   * @returns {EnvState}
   */
  getState() {
    try {
      const player = this.state?.player?.get();
      if (!player) {
        throw new Error("Player state not available");
      }

      const world = this.getWorld();
      const tileSize = this.config?.TILE_SIZE?.get() || 16;
      const x = Math.floor((player.x + player.width / 2) / tileSize);
      const y = Math.floor((player.y + player.height / 2) / tileSize);
      const below = world?.getTile?.(x, y + 1);
      const above = world?.getTile?.(x, y - 1);
      const total = this.computed?.totalSeeds?.get() ?? 0;

      const hasSeeds = total > 0;

      // logic for selected seed info
      const seedButtons = getSeedButtons(this.shadow);
      const selectedButton = seedButtons.find((b) =>
        b.classList.contains("selected"),
      );

      const seedSelected = !!selectedButton;
      let selectedSeedType = null;
      let selectedSeedCount = 0;

      if (selectedButton) {
        selectedSeedType = Object.keys(selectedButton.dataset)[0] || null;
        const text = selectedButton.textContent || "";
        selectedSeedCount = parseInt(text.match(/\d+/)?.[0] || "0");
      }

      const progress = total > 0 ? this.seedsPlanted.get() / total : 0;
      const tile = `${x},${y}`;
      const alreadyPlanted = this.plantedTiles.get().has(tile);

      const now = Date.now();
      const canJump = now - this.lastJumpTime >= 1000;

      /** @type {EnvState} */
      const state = {
        x: isFinite(x) ? x : 0,
        y: isFinite(y) ? y : 0,
        airAbove: !above || above.id === 0,
        alreadyPlanted,
        canJump: canJump,
        consecutiveJumps: this.consecutiveJumps.get(),
        farmableBelow: !!below?.farmable,
        hasSeeds,
        isHalfSpeed: this.isHalfSpeed.get(),
        onGround: !!player.onGround,
        progress,
        seedSelected,
        selectedSeedType,
        selectedSeedCount,
        seedsLeftToPlant: total,
        seedsPlanted: this.seedsPlanted.get(),
        stepCount: this.stepCount.get(),
      };

      return state;
    } catch (e) {
      this.log("State error:", "error");

      /** @type {EnvState} */
      const fallback = {
        x: 0,
        y: 0,
        airAbove: false,
        alreadyPlanted: false,
        canJump: true,
        consecutiveJumps: 0,
        farmableBelow: false,
        hasSeeds: false,
        isHalfSpeed: false,
        onGround: false,
        progress: 0,
        seedSelected: false,
        selectedSeedType: null,
        selectedSeedCount: 0,
        seedsLeftToPlant: 0,
        seedsPlanted: 0,
        stepCount: 0,
      };

      return fallback;
    }
  }

  /**
   * Execute one step in the environment given an action.
   *
   * Applies the action, waits for the simulation to update, computes reward,
   * and returns the new state and termination flag.
   *
   * @param {number} action - Action ID corresponding to {@link ACTIONS}.
   *
   * @returns {Promise<StepResult>}
   */
  async step(action) {
    this.trainAction.set(ACTION_NAMES[action]);
    const prev = this.getState();

    const shouldEndBeforeAction = this.computed?.totalSeeds?.get() === 0;
    if (shouldEndBeforeAction) {
      await this.releaseAllKeys(Object.keys(keyMap));

      return { state: prev, reward: 0, done: true };
    }

    const failedPlantsBefore = this.failedPlantAttempts.get();
    const isInvalidJump =
      action === ACTIONS.UP && (!prev.canJump || !prev.onGround);

    await this.#executeAction(action);
    await sleep(30);

    const next = this.getState();
    const failedPlantsAfter = this.failedPlantAttempts.get();
    const plantFailedThisStep = failedPlantsAfter > failedPlantsBefore;

    // check for force end
    if (
      this.stepCount.get() > 200 &&
      next.seedsPlanted === 0 &&
      next.hasSeeds
    ) {
      this.log(
        `⚠️ Ep ${this.episode.get()} Force End: no planting after 200 steps`,
        "warning",
      );
      return { state: next, reward: -500, done: true };
    }

    const reward = this.#computeReward(
      prev,
      next,
      action,
      plantFailedThisStep,
      isInvalidJump,
    );

    const lastPosVal = this.lastPos.get();
    const stuck =
      lastPosVal &&
      next.x === lastPosVal.x &&
      next.y === lastPosVal.y &&
      this.stillStepsAtTile.get() > 300;

    const allPlanted = this.computed?.totalSeeds?.get() === 0;

    const done =
      allPlanted ||
      this.stepCount.get() >= 800 ||
      (!next.hasSeeds && this.stepCount.get() > 150) ||
      stuck ||
      (next.progress >= 0.95 && this.stepCount.get() > 400);

    if (done) {
      await this.releaseAllKeys(Object.keys(keyMap));
    }

    this.stepCount.set(this.stepCount.get() + 1);
    this.lastReward.set(reward);

    return { state: next, reward, done };
  }

  /**
   * Execute an action in the environment by simulating key presses or UI interactions.
   *
   * Handles jumping, speed toggling, seed selection, planting, or directional moves.
   *
   * @param {number} action - Action ID.
   *
   * @returns {Promise<void>}
   */
  async #executeAction(action) {
    try {
      if (action === ACTIONS.UP) {
        const now = Date.now();
        const timeSinceLastJump = now - this.lastJumpTime;

        // Log jump attempts
        this.log(
          `🦘 Jump attempt: cooldown=${timeSinceLastJump}ms, onGround=${this.getState().onGround}`,
        );

        // Enforce cooldown
        if (timeSinceLastJump < 1000) {
          this.log(`❌ Jump blocked: cooldown`);

          return sleep(50);
        }

        // Check if on ground
        const state = this.getState();
        if (!state.onGround) {
          return sleep(50);
        }

        // Valid jump - update tracking
        this.lastJumpTime = now;
        this.jumpCount.set(this.jumpCount.get() + 1);
        this.consecutiveJumps.set(this.consecutiveJumps.get() + 1);
        this.lastActionWasJump.set(true);
      } else {
        if (this.lastActionWasJump.get()) {
          this.consecutiveJumps.set(0);
        }

        this.lastActionWasJump.set(false);
      }

      if (action === ACTIONS.SELECT_SEED) {
        selectNextSeed(this.shadow);

        return await sleep(100);
      }

      if (action === ACTIONS.TOGGLE_SPEED) {
        this.speedToggleCount.set(this.speedToggleCount.get() + 1);

        const isHalfSpeed = this.isHalfSpeed.get();
        if (isHalfSpeed) {
          await localForage.setItem(`sprite-garden-movement-scale`, 0.885);
          await updateMovementScaleValue(this.shadow);

          this.isHalfSpeed.set(false);

          return await sleep(100);
        }

        // set movement scale to 1
        await localForage.setItem(`sprite-garden-movement-scale`, 1);
        await updateMovementScaleValue(this.shadow);

        this.isHalfSpeed.set(true);

        return await sleep(100);
      }

      if (action === ACTIONS.PLANT) {
        if (!getSelectedSeed(this.shadow)) {
          selectNextSeed(this.shadow);

          await sleep(100);
        }

        await this.releaseAllKeys(Object.keys(keyMap));

        await sleep(50);
        await this.holdKey(70);
        await sleep(250);
        await this.releaseKey(70);

        return sleep(50);
      }

      if (action === ACTIONS.NOOP) {
        return sleep(50);
      }

      const keys = ACTION_KEYS[action];
      if (keys?.length) {
        const duration = action === ACTIONS.UP ? 90 : 130;

        for (const k of keys) {
          await pressKey(this.shadow, k, duration);
        }
      }
    } catch (e) {
      this.log("Action error:", "error");
    }
  }

  /**
   * Reset environment state for a new episode.
   *
   * Resets counters and sets up a fresh planted tile set, then computes and returns
   * an initial {@link EnvState}.
   *
   * @returns {EnvState}
   */
  resetEnvironment() {
    this.consecutiveJumps.set(0);
    this.failedPlantAttempts.set(0);
    this.jumpCount.set(0);
    this.lastActionWasJump.set(false);
    this.lastFailedPlantTime.set(0);
    this.lastJumpTime = 0;
    this.lastPos.set(null);
    this.plantedTiles.set(new Set());
    this.seedsPlanted.set(0);
    this.speedToggleCount.set(0);
    this.startTime.set(Date.now());
    this.stepCount.set(0);
    this.stillStepsAtTile.set(0);
    this.isHalfSpeed.set(false);

    return this.getState();
  }

  /**
   * Compute reward for a state transition.
   *
   * Combines dense shaping (movement, seed selection, exploring new tiles)
   * with sparse rewards for planting and penalties for bad or redundant actions.
   *
   * @param {EnvState} prev - Previous state.
   * @param {EnvState} next - Next state.
   * @param {number} action - Action taken.
   * @param {boolean} [plantFailedThisStep=false] - Whether planting failed this step.
   * @param {boolean} [isInvalidJump=false] - Whether the jump was valid.
   *
   * @returns {number} Reward value for this transition.
   */
  #computeReward(
    prev,
    next,
    action,
    plantFailedThisStep = false,
    isInvalidJump = false,
  ) {
    let r = 0;

    // === SPARSE REWARDS (Big events) ===
    // SUCCESS! A seed was planted
    if (next.seedsPlanted > prev.seedsPlanted) {
      r += 500;

      // Mark this tile as planted
      const tiles = new Set(this.plantedTiles.get());
      tiles.add(`${next.x},${next.y}`);
      this.plantedTiles.set(tiles);
      this.lastPos.set({ x: next.x, y: next.y });

      // Bonus for efficiency (planting quickly)
      const efficiency = Math.max(0, 1 - this.stepCount.get() / 200);
      r += efficiency * 100;

      return r; // Return immediately - planting is the goal!
    }

    // === PENALTIES (Kept reasonable) ===
    // Invalid jump penalty
    if (isInvalidJump) {
      return -50;
    }

    // Failed plant penalty
    if (plantFailedThisStep) {
      return -40;
    }

    // === DENSE SHAPING (Guiding the agent toward planting) ===
    const tile = `${next.x},${next.y}`;
    const newSpot = !this.plantedTiles.get().has(tile);
    const lastPosVal = this.lastPos.get();
    const moved =
      !lastPosVal || next.x !== lastPosVal.x || next.y !== lastPosVal.y;

    // STEP 1: Encourage seed selection
    if (!prev.seedSelected && next.seedSelected) {
      r += 50; // Good! Seed selected
    }

    if (next.hasSeeds && next.seedSelected) {
      r += 2; // Small continuous reward for having a seed ready
    } else if (next.hasSeeds && !next.seedSelected) {
      r -= 5; // Gentle nudge to select a seed
    }

    // STEP 2: Reward being in a good planting position
    const inGoodPosition =
      next.onGround && next.farmableBelow && !next.alreadyPlanted;

    if (inGoodPosition && next.seedSelected && next.hasSeeds) {
      r += 40; // We're ready to plant!

      if (newSpot) {
        r += 20; // Extra bonus for new plantable spots
      }
    }

    // STEP 3: Reward PLANT action when conditions are right
    if (action === ACTIONS.PLANT) {
      if (
        prev.onGround &&
        prev.farmableBelow &&
        !prev.alreadyPlanted &&
        prev.seedSelected &&
        prev.hasSeeds
      ) {
        r += 80; // Good attempt to plant!
      } else {
        r -= 15; // Mild penalty for bad timing (reduced from -50/-30)
      }
    }

    // STEP 4: Exploration and movement encouraged
    if (moved && newSpot) {
      r += 10; // Exploring new ground
    }

    // Horizontal movement on ground is good
    if (
      (action === ACTIONS.LEFT || action === ACTIONS.RIGHT) &&
      next.onGround
    ) {
      r += 8; // Encourage moving around

      if (next.hasSeeds && next.seedSelected) {
        r += 7; // Extra bonus when ready to plant
      }
    }

    // STEP 5: Jumping - be more lenient
    if (action === ACTIONS.UP) {
      // Only penalize if jumping over perfect planting spot
      if (inGoodPosition && prev.seedSelected && prev.hasSeeds) {
        r -= 100; // This is bad - you should plant, not jump
      } else if (this.consecutiveJumps.get() >= 2) {
        // Escalating penalty for excessive jumping
        r -= 20 * this.consecutiveJumps.get();
      } else {
        // Otherwise jumping is okay - might be necessary
        r -= 2; // Very small penalty
      }
    }

    // STEP 6: Staying still penalty (gentle)
    const stillSteps = this.stillStepsAtTile.get();
    if (!moved) {
      if (stillSteps > 20) {
        r -= Math.min(20, stillSteps / 3); // Gentle escalation
      } else {
        r -= 1; // Very small penalty
      }
    } else {
      // Reset still counter
      this.lastPos.set({ x: next.x, y: next.y });
      this.stillStepsAtTile.set(0);
    }

    // STEP 7: NOOP penalty
    if (action === ACTIONS.NOOP) {
      r -= 10; // Discourage doing nothing
    }

    // STEP 8: Progress-based reward
    const deltaProgress =
      isFinite(next.progress) && isFinite(prev.progress)
        ? next.progress - prev.progress
        : 0;

    if (deltaProgress > 0) {
      r += deltaProgress * 500; // Reward overall progress
    }

    // STEP 9: Time-based penalties for no progress
    if (next.stepCount > 50 && next.seedsPlanted === 0 && next.hasSeeds) {
      r -= 10; // Not making progress
    }

    // Update position tracking
    if (moved) {
      this.lastPos.set({ x: next.x, y: next.y });
      this.stillStepsAtTile.set(0);
    } else {
      this.stillStepsAtTile.set(stillSteps + 1);
    }

    return isFinite(r) ? r : 0;
  }

  /**
   * Get elapsed time since episode start in seconds.
   *
   * @returns {number} Seconds since the episode was reset.
   */
  getEpisodeTime() {
    return (Date.now() - this.startTime.get()) / 1000;
  }

  /**
   * Create a new Q-learning agent.
   *
   * @param {number} [alpha=0.15] - Learning rate.
   * @param {number} [gamma=0.98] - Discount factor.
   * @param {number} [epsilon=0.4] - Initial exploration rate.
   * @returns {void}
   */
  createAgent(alpha = 0.15, gamma = 0.98, epsilon = 0.4) {
    this.agent = new QLearning(8, alpha, gamma, epsilon);

    this.log(`🤖 Agent created (α=${alpha}, γ=${gamma}, ε=${epsilon})`, "info");
  }

  /**
   * Log a training message.
   *
   * Adds the message to internal logs and writes a formatted line to the console.
   *
   * @param {string} message - Text of the log message.
   * @param {"info"|"success"|"warning"|"error"} [type="info"] - Type of message.
   * @returns {void}
   */
  log(message, type = "info") {
    /** @type {TrainingLogEntry} */
    const entry = {
      time: new Date().toLocaleTimeString(),
      message,
      type,
    };

    this.logWatcher(entry);
    const currentLogs = this.logs.get();

    this.logs.set([...currentLogs, entry]);
    this.updateLogsDisplay(entry);
    console.log(`[${entry.time}] ${message}`);
  }

  /**
   * Watch the logs and take action
   *
   * @param {TrainingLogEntry} entry
   */
  logWatcher(entry) {
    const msg = entry.message.toLowerCase();
    if (msg.includes("cannot plant")) {
      const failedPlantAttemptsCount = this.failedPlantAttempts.get() + 1;
      this.failedPlantAttempts.set(failedPlantAttemptsCount);
      this.lastFailedPlantTime.set(Date.now());
    }

    if (msg.includes("cannot farm")) {
      const failedPlantAttemptsCount = this.failedPlantAttempts.get() + 1;
      this.failedPlantAttempts.set(failedPlantAttemptsCount);
      this.lastFailedPlantTime.set(Date.now());
    }

    if (msg.includes("planted")) {
      const plantedCount = this.seedsPlanted.get() + 1;

      this.seedsPlanted.set(plantedCount);
    }
  }

  /**
   * Start multi-episode training loop.
   *
   * Creates an agent if needed, then runs episodes of at most `maxSteps` each,
   * updating the Q-table via {@link QLearning#learn}.
   *
   * @param {AgentConfig} [config={}] - Training configuration.
   * @returns {Promise<void>}
   */
  async startTraining(
    config = {
      episodes: 50,
      maxSteps: 100,
      alpha: 0.2,
      gamma: 0.95,
      epsilon: 0.2,
      decay: 0.995,
    },
  ) {
    const { episodes, maxSteps, alpha, gamma, epsilon, decay } = config;

    this.#shouldStop = false;

    if (!this.#toastListener) {
      this.#setupToastListener();
    }

    if (!this.agent) {
      this.createAgent(alpha, gamma, epsilon);
    }

    if (this.agent.q.size < 100) {
      // Keep configured exploration
      this.agent.epsilon = epsilon;
    }

    this.isTraining.set(true);
    this.totalEpisodes.set(episodes);
    this.log(`🚀 Starting training: ${episodes} episodes`);

    // Hardcoded initial action sequence
    const jumpLeft = Math.random() < 0.5;
    this.log(
      `Executing initial jump sequence Up / ${jumpLeft ? "Left" : "Right"}`,
    );

    // 65=A (left), 68=D (right)
    const [keyA] = ACTION_KEYS[ACTIONS.LEFT];
    const [keyD] = ACTION_KEYS[ACTIONS.RIGHT];
    const [keyW] = ACTION_KEYS[ACTIONS.UP];
    const directionKey = jumpLeft ? keyA : keyD;

    // Hold W (UP)
    await this.holdKey(keyW);
    await this.holdKey(directionKey);
    await sleep(200);
    await this.releaseKey(keyW);
    await this.releaseKey(directionKey);
    await sleep(100);

    for (let ep = 0; ep < episodes && !this.#shouldStop; ep++) {
      this.episode.set(ep + 1);

      let state = this.resetEnvironment();
      let totalReward = 0;

      for (let step = 0; step < maxSteps; step++) {
        if (this.#shouldStop) {
          this.log("⏹ Stopped mid-training", "warning");

          return;
        }

        // Get valid actions based on current state
        const validActions = getValidActions(state);
        const action = this.agent.selectAction(state, validActions);

        const { state: nextState, reward, done } = await this.step(action);

        this.agent.learn(state, action, reward, nextState, done);

        totalReward += reward;
        state = nextState;

        if (done) {
          const time = this.getEpisodeTime();
          const planted = this.seedsPlanted.get();
          const total = this.computed?.totalSeeds?.get() ?? 0;
          const complete = planted >= total && total === 0;

          if (complete && time < this.bestTime.get()) {
            this.bestTime.set(time);
            this.log(
              `🏆 New best time: ${time.toFixed(1)}s (${planted}/${total})`,
              "success",
            );
          }

          const avgReward = totalReward / (step + 1);

          this.log(
            `Episode ${ep + 1}: ${planted}/${total} (${(
              (planted / Math.max(total, 1)) *
              100
            ).toFixed(0)}%) ` +
              `${time.toFixed(1)}s ${complete ? "✅" : "❌"} | ` +
              `Jumps: ${this.jumpCount.get()} | ` +
              `FailedPlants: ${this.failedPlantAttempts.get()} | ` +
              `AvgR: ${avgReward.toFixed(1)}`,
            complete ? "success" : "warning",
          );

          if (complete) {
            this.consecutiveFailures.set(0);
            this.successStreak.set(this.successStreak.get() + 1);

            this.log("✅ All seeds planted. Training goal reached.", "success");

            // Set flag to stop outer loop
            this.#shouldStop = true;
          } else {
            this.consecutiveFailures.set(this.consecutiveFailures.get() + 1);
            this.successStreak.set(0);

            if (this.consecutiveFailures.get() >= 5) {
              this.agent.epsilon = Math.min(0.75, this.agent.epsilon + 0.15);

              this.log(
                `🔥 Exploration boost: ε=${this.agent.epsilon.toFixed(3)}`,
                "warning",
              );
              this.consecutiveFailures.set(0);
            }
          }

          break;
        }
      }

      if (this.#shouldStop) {
        this.log("⏹ Training stopped.", "success");
      }

      // Epsilon decay
      this.agent.epsilon = Math.max(0.15, this.agent.epsilon * decay);

      await sleep(30);
    }

    this.isTraining.set(false);
    this.log("✅ Training complete!", "success");
  }

  /**
   * Fully reset environment (not world state) before evaluation.
   *
   * @returns {Promise<void>}
   */
  async hardResetEnvironment() {
    // Release any held keys
    await this.releaseAllKeys(Object.keys(keyMap));

    // Deselect any selected seeds in the UI
    const seedButtons = getSeedButtons(this.shadow);
    seedButtons.forEach((button) => button.classList.remove("selected"));

    // Reset movement speed to default
    await localForage.setItem(`sprite-garden-movement-scale`, 0.885);
    await updateMovementScaleValue(this.shadow);

    // Reset internal episode state/signals
    this.consecutiveJumps.set(0);
    this.failedPlantAttempts.set(0);
    this.jumpCount.set(0);
    this.lastActionWasJump.set(false);
    this.lastFailedPlantTime.set(0);
    this.lastJumpTime = 0;
    this.lastPos.set(null);
    this.plantedTiles.set(new Set());
    this.speedToggleCount.set(0);
    this.startTime.set(Date.now());
    this.stepCount.set(0);
    this.stillStepsAtTile.set(0);
    this.isHalfSpeed.set(false);
    this.lastReward.set(0);
  }

  /**
   * Stop.
   *
   * Sets a stop flag checked by the training and testing loops and updates visible state.
   *
   * @returns {void}
   */
  stop() {
    this.#shouldStop = true;

    this.isTraining.set(false);
    this.isTesting.set(false);

    this.#removeToastListener();

    this.log("⏹ Stopped", "warning");
  }

  /**
   * Test the trained agent.
   *
   * @param {number} [maxSteps=100] - Maximum steps to run the test.
   * @returns {Promise<void>}
   */
  async test(maxSteps = 100) {
    this.hardResetEnvironment();
    this.#shouldStop = false;
    this.isTesting.set(true);

    if (!this.agent) {
      this.log("❌ No trained agent available", "error");

      return;
    }

    const oldEpsilon = this.agent.epsilon;
    const testEpsilon =
      parseFloat(this.#ui.testEpsilonInput?.value ?? "") || 0.25;
    this.agent.epsilon = testEpsilon;

    if (!this.#toastListener) {
      this.#setupToastListener();
    }

    let state = this.resetEnvironment();
    this.log(`🧪 Testing trained agent (ε=${testEpsilon})...`, "info");

    for (let i = 0; i < maxSteps; i++) {
      if (this.#shouldStop) {
        this.log("🛑 Test stopped", "warning");

        await this.releaseAllKeys(Object.keys(keyMap));

        return;
      }

      // Get valid actions and select from them
      const validActions = getValidActions(state);
      const action = this.agent.selectAction(state, validActions);

      const { state: nextState, done } = await this.step(action);

      state = nextState;

      if (done) {
        await this.releaseAllKeys(Object.keys(keyMap));

        break;
      }
    }

    const time = this.getEpisodeTime();
    const planted = this.seedsPlanted.get();
    const remainingSeedsToPlant = this.computed.totalSeeds.get();

    this.log(
      `TEST: ${planted} in ${time.toFixed(1)}s | ` +
        `Jumps: ${this.jumpCount.get()} | ` +
        `Failed Plants: ${this.failedPlantAttempts.get()} | ` +
        `Remaining Seeds: ${remainingSeedsToPlant}`,
      remainingSeedsToPlant === 0 ? "success" : "warning",
    );

    this.agent.epsilon = oldEpsilon;
    this.isTesting.set(false);
  }

  /**
   * Export the trained Q-table.
   *
   * Returns the agent's serialized Q-table, ready to be stringified and saved.
   *
   * @returns {any|null} Q-table export data, or null if no agent exists.
   */
  exportAgent() {
    if (!this.agent) {
      this.log("❌ No agent to export", "error");

      return null;
    }

    const data = this.agent.exportQ();
    this.log("💾 Agent exported", "success");

    return data;
  }

  /**
   * Import a trained Q-table.
   *
   * Creates an agent if necessary and loads the given data into its Q-table.
   *
   * @param {any} data - Parsed Q-table data.
   *
   * @returns {boolean} True if import succeeded, false otherwise.
   */
  importAgent(data) {
    if (!this.agent) {
      this.createAgent();
    }

    const success = this.agent.importQ(data);
    if (success) {
      this.log(`📥 Imported Q-table: ${this.agent.q.size} states`, "success");
    } else {
      this.log("❌ Import failed", "error");
    }

    return success;
  }

  /**
   * Get current training statistics.
   *
   * Returns a summary of the most relevant numeric and boolean training
   * indicators for external inspection or UI display.
   *
   * @returns {TrainingStats}
   */
  getStats() {
    return {
      episode: this.episode.get(),
      totalEpisodes: this.totalEpisodes.get(),
      bestTime: this.bestTime.get(),
      isTraining: this.isTraining.get(),
      isTesting: this.isTesting.get(),
      isHalfSpeed: this.isHalfSpeed.get(),
      qTableSize: this.agent?.q.size || 0,
      epsilon: this.agent?.epsilon || 0,
      consecutiveFailures: this.consecutiveFailures.get(),
      successStreak: this.successStreak.get(),
      seedsPlanted: this.seedsPlanted.get(),
      seedsLeftToPlant: this.seedsLeftToPlant.get(),
      jumpCount: this.jumpCount.get(),
      failedPlantAttempts: this.failedPlantAttempts.get(),
      lastReward: this.lastReward.get(),
    };
  }

  /**
   * Clean up resources.
   *
   * Removes the toast listener, sets training to false, and logs a cleanup message.
   *
   * @returns {void}
   */
  dispose() {
    if (this.#toastListener) {
      this.shadow?.removeEventListener(
        "sprite-garden-toast",
        this.#toastListener,
      );

      this.#toastListener = null;
    }

    this.isTraining.set(false);
    this.log("🧹 Resources cleaned up", "info");
  }
}

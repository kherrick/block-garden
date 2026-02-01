import { persistValue } from "../../../core/systems/persistence.mjs";

import { effect } from "../../../utils/effect.mjs";

/**
 * Initializes listeners for granular world generation controls.
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 */
export function initGenerationControlListeners(shadow, cnvs) {
  const gameConfig = globalThis.blockGarden.config;
  const gameState = globalThis.blockGarden.state;

  const generationSettings = [
    { id: "terrainOctaves", signal: gameConfig.terrainOctaves, unit: "" },
    { id: "mountainScale", signal: gameConfig.mountainScale, unit: "%" },
    {
      id: "caveThreshold",
      signal: gameConfig.caveThreshold,
      unit: "%",
      displayId: "caveDensity",
    },
    {
      id: "decorationDensity",
      signal: gameConfig.decorationDensity,
      unit: "%",
    },
    { id: "cloudDensity", signal: gameConfig.cloudDensity, unit: "%" },
  ];

  generationSettings.forEach(({ id, signal, unit, displayId }) => {
    const input = shadow.getElementById(`${id}Input`);
    const display = shadow.getElementById(`${displayId || id}Display`);

    if (input instanceof HTMLInputElement && display) {
      // Synchronize slider and display with signal
      effect(() => {
        const val = signal.get();
        input.value = String(val);

        display.textContent = `${val}${unit}`;
      });

      input.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
          signal.set(parseInt(e.target.value, 10));
        }
      });
    }
  });

  // Manual Length of Day Slider
  const dayLengthInput = shadow.getElementById("dayLengthInput");
  const dayLengthDisplay = shadow.getElementById("dayLengthDisplay");
  const dayLengthContainer = shadow.getElementById("dayLengthContainer");

  if (
    dayLengthInput instanceof HTMLInputElement &&
    dayLengthDisplay &&
    dayLengthContainer
  ) {
    // Keep slider and display in sync
    effect(() => {
      const val = gameConfig.dayLength.get();
      dayLengthInput.value = String(val);

      // Just show the number, no math
      dayLengthDisplay.textContent = String(val);

      // Enable/disable depending on mode
      const isCycleEnabled = gameConfig.useTimeCycle.get();
      if (isCycleEnabled) {
        dayLengthInput.removeAttribute("disabled");
        dayLengthContainer.removeAttribute("hidden");
      } else {
        dayLengthInput.setAttribute("disabled", "disabled");
        dayLengthContainer.setAttribute("hidden", "hidden");
      }
    });

    // Update gameConfig on slider change with raw value
    dayLengthInput.addEventListener("input", async (e) => {
      if (e.target instanceof HTMLInputElement) {
        const newValue = Number(e.target.value);
        gameConfig.dayLength.set(newValue);

        await persistValue("config", "dayLength", newValue);
      }
    });
  }

  // Manual Time of Day Slider
  const manualTimeInput = shadow.getElementById("manualTimeOfDayInput");
  const manualTimeDisplay = shadow.getElementById("manualTimeOfDayDisplay");
  const manualTimeContainer = shadow.getElementById("manualTimeOfDayContainer");

  if (
    manualTimeInput instanceof HTMLInputElement &&
    manualTimeDisplay &&
    manualTimeContainer
  ) {
    // Synchronize slider and display with signal
    effect(() => {
      const val = gameConfig.manualTimeOfDay.get();
      manualTimeInput.value = String(val);

      // Convert 0-1 to 0:00-24:00 for display
      const hours = Math.floor(val * 24);
      const minutes = Math.floor((val * 24 - hours) * 60);
      manualTimeDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      // Enable/disable based on useTimeCycle
      const isCycleEnabled = gameConfig.useTimeCycle.get();
      if (isCycleEnabled) {
        manualTimeInput.setAttribute("disabled", "disabled");
        manualTimeContainer.setAttribute("hidden", "hidden");
      } else {
        manualTimeInput.removeAttribute("disabled");
        manualTimeContainer.removeAttribute("hidden");
      }
    });

    manualTimeInput.addEventListener("input", async (e) => {
      if (e.target instanceof HTMLInputElement) {
        const newValue = parseFloat(e.target.value);
        const val = Math.max(0, Math.min(1, newValue));

        gameConfig.manualTimeOfDay.set(val);
        gameState.worldTime = val;

        await persistValue("config", "manualTimeOfDay", newValue);
        await persistValue("state", "worldTime", newValue);
      }
    });
  }

  const toggleCaves = shadow.getElementById("toggleCaves");
  const caveThresholdInput = shadow.getElementById("caveThresholdInput");
  const caveThresholdInputContainer = shadow.getElementById(
    "caveThresholdInputContainer",
  );

  if (toggleCaves) {
    effect(() => {
      const val = gameConfig.useCaves.get();

      toggleCaves.textContent = val ? "Disable Caves" : "Enable Caves";

      toggleCaves.style.backgroundColor = val
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      toggleCaves.style.color = "var(--bg-color-white)";

      if (val) {
        caveThresholdInput.removeAttribute("disabled");
        caveThresholdInputContainer.removeAttribute("hidden");
      } else {
        caveThresholdInput.setAttribute("disabled", "disabled");
        caveThresholdInputContainer.setAttribute("hidden", "hidden");
      }
    });

    toggleCaves.addEventListener("click", () => {
      const val = gameConfig.useCaves.get();
      gameConfig.useCaves.set(!val);

      if (val) {
        caveThresholdInput.removeAttribute("disabled");
        caveThresholdInputContainer.removeAttribute("hidden");
      } else {
        caveThresholdInput.setAttribute("disabled", "disabled");
        caveThresholdInputContainer.setAttribute("hidden", "hidden");
      }
    });
  }
}

import { configSignals, stateSignals } from "./state.mjs";
import { copyToClipboard } from "./copyToClipboard.mjs";
import { generateNewWorld } from "./generateWorld.mjs";
import { getCurrentGameState } from "./getCurrentGameState.mjs";
import { getRandomSeed } from "./getRandomSeed.mjs";
import { handleBreakBlock } from "./handleBreakBlock.mjs";
import { handleFarmAction } from "./handleFarmAction.mjs";
import { handlePlaceBlock } from "./handlePlaceBlock.mjs";
import { resizeCanvas } from "./resizeCanvas.mjs";
import { runCompress } from "./compression.mjs";
import { selectMaterial } from "./selectMaterial.mjs";
import { selectSeed } from "./selectSeed.mjs";
import { toggleBreakMode } from "./toggleBreakMode.mjs";
import { toggleView } from "./toggleView.mjs";

import editHandler from "../deps/konami-code-js.mjs";

export function setupGlobalEventListeners(gThis) {
  // Setup event listeners
  gThis.addEventListener("resize", () => {
    resizeCanvas(gThis.document, configSignals);
  });

  // Input handling
  gThis.spriteGarden.keys = {};
  gThis.spriteGarden.touchKeys = {};
}

function handleCornerClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const heading = e.currentTarget;

  const cornerContainer = heading.nextElementSibling;
  if (cornerContainer.getAttribute("hidden") !== null) {
    cornerContainer.removeAttribute("hidden");

    return;
  }

  cornerContainer.setAttribute("hidden", "hidden");
}

export function setupDocumentEventListeners(gThis) {
  const doc = gThis.document;

  // Edit
  new editHandler((handler) => {
    doc.getElementById("mapEditor").removeAttribute("hidden");

    handler.disable();
  });

  // Keyboard events
  doc.addEventListener("keydown", (e) => {
    gThis.spriteGarden.keys[e.key.toLowerCase()] = true;

    // Allow digits 0-9, enter, and delete
    if (e.key.toLowerCase() === "enter") {
      if (e.target.getAttribute("id") === "worldSeedInput") {
        handleGenerateButton();
      }
    }
    if (
      (e.key.toLowerCase() >= "0" && e.key.toLowerCase() <= "9") ||
      e.key.toLowerCase() === "backspace" ||
      e.key.toLowerCase() === "delete"
    ) {
      return;
    }

    // Add 'R' key to regenerate world with random seed
    if (e.key.toLowerCase() === "r" && e.ctrlKey) {
      e.preventDefault();

      handleRandomSeedButton();
    }

    // Add 'S' key to show / hide the world generation panel
    if (e.key.toLowerCase() === "s" && e.ctrlKey) {
      e.preventDefault();
      document
        .querySelector('[class="seed-controls"]')
        .toggleAttribute("hidden");
    }

    // Add 'G' key to regenerate world with current seed (to see changes)
    if (e.key.toLowerCase() === "g" && e.ctrlKey) {
      e.preventDefault();

      handleGenerateButton();
    }

    // Handle farming actions
    if (e.key.toLowerCase() === "f") {
      handleFarmAction(
        getCurrentGameState(stateSignals, configSignals),
        gThis.spriteGarden,
        doc,
      );
    } else if (e.key.toLowerCase() === "r") {
      handleBreakBlock(
        getCurrentGameState(stateSignals, configSignals),
        gThis.spriteGarden,
        doc,
        configSignals.breakMode.get(),
      );
    }

    // Handle block placement keys
    const blockKeys = ["u", "i", "o", "j", "k", "l", "m", ",", "."];
    if (blockKeys.includes(e.key.toLowerCase())) {
      handlePlaceBlock(
        getCurrentGameState(stateSignals, configSignals),
        gThis.spriteGarden,
        doc,
        e.key.toLowerCase(),
      );
    }

    e.preventDefault();
  });

  // Handle block placement mobile controls
  document.querySelectorAll(".touch-btn.place-block").forEach((pb) => {
    pb.addEventListener("touchstart", () =>
      handlePlaceBlock(
        getCurrentGameState(stateSignals, configSignals),
        gThis.spriteGarden,
        doc,
        pb.dataset.key,
      ),
    );

    pb.addEventListener("click", () =>
      handlePlaceBlock(
        getCurrentGameState(stateSignals, configSignals),
        gThis.spriteGarden,
        doc,
        pb.dataset.key,
      ),
    );
  });

  doc.addEventListener("keyup", (e) => {
    gThis.spriteGarden.keys[e.key.toLowerCase()] = false;

    e.preventDefault();
  });

  // Prevent default touch behaviors
  doc.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  doc.addEventListener(
    "touchmove",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  doc.addEventListener(
    "touchend",
    (e) => {
      if (e.target.closest("#touchControls") || e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  // Prevent context menu on long press
  doc.addEventListener("contextmenu", (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  });

  // Prevent zoom on double tap
  doc.addEventListener("dblclick", (e) => {
    if (e.target.closest("#touchControls") || e.target === canvas) {
      e.preventDefault();
    }
  });

  const fogButton = doc.getElementById("toggleFog");
  fogButton.addEventListener("click", function toggleFog() {
    const fogModeText = doc.getElementById("fogModeText");

    if (fogModeText.textContent === "Clear") {
      configSignals.fogMode.set("fog");

      return;
    }

    configSignals.fogMode.set("clear");
  });

  function handleWorldStateButton() {
    doc.querySelector('[class="seed-controls"]').toggleAttribute("hidden");
  }

  const worldStateBtn = doc.getElementById("worldState");
  worldStateBtn.addEventListener("click", handleWorldStateButton);

  function handleGenerateButton() {
    const seedInput = doc.getElementById("worldSeedInput");
    const currentSeedDisplay = doc.getElementById("currentSeed");

    generateNewWorld(doc, seedInput.value);

    console.log(`Generated new world with seed: ${seedInput.value}`);

    currentSeedDisplay.textContent = seedInput.value;
  }

  function handleRandomSeedButton() {
    const currentSeedDisplay = doc.getElementById("currentSeed");
    const seedInput = doc.getElementById("worldSeedInput");
    const randomSeed = getRandomSeed();

    generateNewWorld(doc, randomSeed);

    console.log(`Generated new world with random seed: ${randomSeed}`);

    seedInput.value = randomSeed;
    currentSeedDisplay.textContent = randomSeed;
  }

  const generateBtn = doc.getElementById("generateWithSeed");
  generateBtn.addEventListener("click", handleGenerateButton);

  const randomBtn = doc.getElementById("randomSeed");
  randomBtn.addEventListener("click", handleRandomSeedButton);

  const copySeedBtn = doc.getElementById("copySeed");
  copySeedBtn.addEventListener("click", async function () {
    const seedInput = doc.getElementById("worldSeedInput");

    await copyToClipboard(gThis, seedInput.value);
  });

  const saveCompressedBtn = doc.getElementById("saveCompressedState");
  saveCompressedBtn.addEventListener("click", async function () {
    try {
      const saveState = gThis.spriteGarden.createSaveState(gThis);
      const stateJSON = JSON.stringify(saveState);

      await runCompress(gThis, stateJSON);
      console.log("Game state saved successfully");
    } catch (error) {
      console.error("Failed to save game state:", error);
      alert("Failed to save game state. Check console for details.");
    }
  });

  const loadCompressedBtn = doc.getElementById("loadCompressedState");
  loadCompressedBtn.addEventListener("click", async function () {
    try {
      const currentSeedDisplay = doc.getElementById("currentSeed");
      const seedInput = doc.getElementById("worldSeedInput");

      let file;

      // Feature detection for showOpenFilePicker
      if (gThis.showOpenFilePicker) {
        const [fileHandle] = await gThis.showOpenFilePicker({
          types: [
            {
              description: "Sprite Garden Save Game Files",
              accept: { "application/gzip": [".sgs"] },
            },
          ],
        });

        file = await fileHandle.getFile();
      } else {
        // Fallback for browsers without showOpenFilePicker
        const input = doc.createElement("input");
        input.type = "file";
        input.accept = ".sgs";
        input.style.display = "none";

        doc.body.appendChild(input);

        const filePromise = new Promise((resolve) => {
          input.onchange = () => resolve(input.files[0]);
        });

        input.click();

        file = await filePromise;

        doc.body.removeChild(input);
      }

      let stateJSON;
      // Feature detection for DecompressionStream
      if ("DecompressionStream" in gThis) {
        const decompressedStream = file
          .stream()
          .pipeThrough(new DecompressionStream("gzip"));

        const decompressedBlob = await new Response(decompressedStream).blob();

        stateJSON = await decompressedBlob.text();
      }

      const saveState = JSON.parse(stateJSON);

      gThis.spriteGarden.loadSaveState(gThis, saveState);

      const { worldSeed } = saveState.config;
      seedInput.value = worldSeed;
      currentSeedDisplay.textContent = worldSeed;

      console.log("Game state loaded successfully");
    } catch (error) {
      console.error("Failed to load game state:", error);
      alert("Failed to load game state. Check console for details.");
    }
  });

  const corners = doc.querySelectorAll(".ui-grid__corner");

  corners.forEach((corner) => {
    const heading = corner.querySelector(".ui-grid__corner--heading");

    heading.addEventListener("click", (e) => handleCornerClick(e));
  });
}

export function setupElementEventListeners(doc) {
  doc.getElementById("controls").addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    doc.getElementById("touchControls").toggleAttribute("hidden");
  });

  const resolutionSelectEl = doc.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener("change", (e) => {
      configSignals.currentResolution.set(e.currentTarget.value);

      resizeCanvas(doc, configSignals);
    });
  }

  const genBtn = doc.getElementById("generateNewWorld");
  if (genBtn)
    genBtn.addEventListener("click", () => {
      const seedInput = doc.getElementById("worldSeedInput");
      const currentSeedDisplay = doc.getElementById("currentSeed");
      currentSeedDisplay.textContent = seedInput.value;

      generateNewWorld(doc, seedInput.value);
    });

  // Seed button event listeners
  doc.querySelectorAll(".seed-btn").forEach((seedBtn) => {
    seedBtn.addEventListener("click", (e) => selectSeed(doc, stateSignals, e));
  });

  // Material button event listeners
  doc.querySelectorAll(".material-btn").forEach((materialBtn) => {
    materialBtn.addEventListener("click", (e) =>
      selectMaterial(doc, stateSignals, e),
    );
  });

  const toggleBtn = doc.getElementById("toggleView");
  if (toggleBtn) toggleBtn.addEventListener("click", () => toggleView(doc));

  const toggleBreakBtn = doc.getElementById("toggleBreakMode");
  if (toggleBreakBtn)
    toggleBreakBtn.addEventListener("click", () => toggleBreakMode());

  // Set default to 400x400 and update the select element
  const sel = doc.getElementById("resolutionSelect");
  if (sel) sel.value = "400";
}

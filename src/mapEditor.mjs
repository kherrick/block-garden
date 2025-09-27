import { configSignals, stateSignals } from "./state.mjs";
import { generateNewWorld } from "./generateWorld.mjs";

export const mapEditorState = {
  isEnabled: false,
  selectedTile: null,
  brushSize: 1,
  isDragging: false,
  lastPaintedTile: null,
};

// Initialize map editor mode
export function initMapEditor(doc) {
  // Add map editor UI to the existing UI
  setupMapEditorControls(doc);
}

// Setup map editor controls
function setupMapEditorControls(doc) {
  // Toggle map editor mode
  const toggleBtn = doc.getElementById("toggleMapEditor");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      mapEditorState.isEnabled = !mapEditorState.isEnabled;

      updateMapEditorUI(doc);
    });
  }

  // Brush size selector
  const brushSizeSelect = doc.getElementById("brushSizeSelect");
  if (brushSizeSelect) {
    brushSizeSelect.addEventListener("change", (e) => {
      mapEditorState.brushSize = parseInt(e.target.value);
    });
  }

  // Tile selection buttons
  doc.querySelectorAll(".tile-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tileType = e.target.dataset.tile;
      selectTile(doc, tileType);
    });
  });

  // Clear all button
  const clearBtn = doc.getElementById("clearMapEditor");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear the entire map? This cannot be undone.")) {
        clearMap();
      }
    });
  }

  // Fill layer button
  const fillBtn = doc.getElementById("fillMapEditor");
  if (fillBtn) {
    fillBtn.addEventListener("click", () => {
      if (
        mapEditorState.selectedTile &&
        confirm(`Fill current layer with ${mapEditorState.selectedTile}?`)
      ) {
        fillCurrentLayer();
      }
    });
  }

  // Save as state button
  const saveBtn = doc.getElementById("saveMapAsState");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveMapAsState();
    });
  }

  // Reset to generated world button
  const resetBtn = doc.getElementById("resetToGenerated");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (
        confirm("Reset to generated world? This will lose all editor changes.")
      ) {
        generateNewWorld(doc);
      }
    });
  }
}

// Update map editor UI state
function updateMapEditorUI(doc) {
  const mapEditorText = doc.getElementById("mapEditorText");
  const mapEditorControls = doc.getElementById("mapEditorControls");

  if (mapEditorText && mapEditorControls) {
    if (mapEditorState.isEnabled) {
      mapEditorText.textContent = "Disable Editor";
      mapEditorControls.removeAttribute("hidden");

      // Disable fog in editor mode for better visibility
      configSignals.fogMode.set("clear");

      // Switch to normal view mode for editing
      stateSignals.viewMode.set("normal");
    } else {
      mapEditorText.textContent = "Enable Editor";
      mapEditorControls.setAttribute("hidden", "");
    }
  }
}

// Select a tile type for painting
function selectTile(doc, tileType) {
  mapEditorState.selectedTile = tileType;

  console.log(
    "Selected tile:",
    tileType,
    "Editor enabled:",
    mapEditorState.isEnabled,
  );

  // Update UI to show selected tile
  doc.querySelectorAll(".tile-btn").forEach((btn) => {
    btn.classList.remove("selected");
  });

  const selectedBtn = doc.querySelector(`[data-tile="${tileType}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add("selected");
  }
}

// Handle canvas clicks for tile placement
export function handleMapEditorClick(x, y) {
  if (!mapEditorState.isEnabled || !mapEditorState.selectedTile) {
    // Not in editor mode or no tile selected
    return false;
  }

  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const camera = stateSignals.camera.get();

  // Convert screen coordinates to world tile coordinates
  const worldX = Math.floor((x + camera.x) / TILE_SIZE);
  const worldY = Math.floor((y + camera.y) / TILE_SIZE);

  paintTiles(worldX, worldY);

  // Handled by map editor
  return true;
}

// Handle dragging for continuous painting
export function handleMapEditorDrag(x, y, isStart = false) {
  if (!mapEditorState.isEnabled || !mapEditorState.selectedTile) {
    return false;
  }

  if (isStart) {
    mapEditorState.isDragging = true;
    mapEditorState.lastPaintedTile = null;
  }

  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const camera = stateSignals.camera.get();

  const worldX = Math.floor((x + camera.x) / TILE_SIZE);
  const worldY = Math.floor((y + camera.y) / TILE_SIZE);

  // Only paint if we've moved to a different tile
  const currentTileKey = `${worldX},${worldY}`;
  if (mapEditorState.lastPaintedTile !== currentTileKey) {
    paintTiles(worldX, worldY);

    mapEditorState.lastPaintedTile = currentTileKey;
  }

  return true;
}

export function handleMapEditorDragEnd() {
  mapEditorState.isDragging = false;
  mapEditorState.lastPaintedTile = null;
}

// Paint tiles at the specified location with current brush size
function paintTiles(centerX, centerY) {
  const TILES = configSignals.TILES;
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const selectedTileType = TILES[mapEditorState.selectedTile];

  if (!selectedTileType) {
    return;
  }

  const currentWorld = stateSignals.world.get();
  const brushRadius = Math.floor(mapEditorState.brushSize / 2);

  let hasChanges = false;

  for (let dx = -brushRadius; dx <= brushRadius; dx++) {
    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      const x = centerX + dx;
      const y = centerY + dy;

      // Check bounds
      if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
        continue;
      }

      // For circular brush
      if (mapEditorState.brushSize > 1) {
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > brushRadius + 0.5) {
          continue;
        }
      }

      // Paint the tile
      if (currentWorld[x][y] !== selectedTileType) {
        currentWorld[x][y] = selectedTileType;

        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    // Update the world state
    stateSignals.world.set([...currentWorld]);
  }
}

// Clear the entire map
function clearMap() {
  const TILES = configSignals.TILES;
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();

  const world = [];
  for (let x = 0; x < WORLD_WIDTH; x++) {
    world[x] = [];

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      world[x][y] = TILES.AIR;
    }
  }

  stateSignals.world.set(world);

  // Clear plant structures and timers
  stateSignals.plantStructures.set({});
  stateSignals.growthTimers.set({});
}

// Fill current visible layer with selected tile
function fillCurrentLayer() {
  if (!mapEditorState.selectedTile) {
    return;
  }

  const camera = stateSignals.camera.get();
  const currentWorld = stateSignals.world.get();
  const selectedTileType = TILES[mapEditorState.selectedTile];
  const TILE_SIZE = configSignals.TILE_SIZE.get();
  const TILES = configSignals.TILES;
  const WORLD_HEIGHT = configSignals.WORLD_HEIGHT.get();
  const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();

  // Get visible area
  const canvas = document.getElementById("canvas");
  const startX = Math.floor(camera.x / TILE_SIZE);
  const startY = Math.floor(camera.y / TILE_SIZE);
  const endX = Math.min(
    WORLD_WIDTH,
    startX + Math.ceil(canvas.width / TILE_SIZE),
  );

  const endY = Math.min(
    WORLD_HEIGHT,
    startY + Math.ceil(canvas.height / TILE_SIZE),
  );

  for (let x = Math.max(0, startX); x < endX; x++) {
    for (let y = Math.max(0, startY); y < endY; y++) {
      currentWorld[x][y] = selectedTileType;
    }
  }

  stateSignals.world.set([...currentWorld]);
}

// Save the current map as a game state file
async function saveMapAsState() {
  try {
    // Create a save state with current world and reset fog
    const saveState = globalThis.spriteGarden.createSaveState(globalThis);

    // Reset explored map for fresh fog
    saveState.state.exploredMap = {};

    // Set player to a safe spawn location
    const WORLD_WIDTH = configSignals.WORLD_WIDTH.get();
    const SURFACE_LEVEL = configSignals.SURFACE_LEVEL.get();
    const TILE_SIZE = configSignals.TILE_SIZE.get();

    saveState.state.player = {
      x: (WORLD_WIDTH / 2) * TILE_SIZE,
      y: SURFACE_LEVEL * TILE_SIZE - 50,
      width: 6,
      height: 8,
      velocityX: 0,
      velocityY: 0,
      speed: 3,
      jumpPower: 12,
      onGround: false,
      color: "#FF69B4",
      lastDirection: 0,
    };

    // Reset game state
    saveState.state.gameTime = 0;
    saveState.state.growthTimers = {};
    saveState.state.plantStructures = {};

    const stateJSON = JSON.stringify(saveState);

    // Create and download the file
    const blob = new Blob([stateJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sprite-garden-map-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    console.log("Map saved as game state file");
    alert(
      'Map saved successfully! You can load this file using the "Load Game File" button.',
    );
  } catch (error) {
    console.error("Failed to save map as state:", error);
    alert("Failed to save map. Check console for details.");
  }
}

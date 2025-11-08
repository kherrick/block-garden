import { Signal } from "../../deps/signal.mjs";

import { createSaveState } from "../state/createSave.mjs";
import { gameConfig, gameState } from "../state/state.mjs";
import { initNewWorld } from "../init/newWorld.mjs";

export const mapEditorState = {
  isEnabled: false,
  selectedTile: null,
  brushSize: 1,
  isDragging: false,
  lastPaintedTile: null,
};

// Initialize map editor mode
export function initMapEditor(doc, shadow, fogMode, viewMode) {
  // Add map editor UI to the existing UI
  setupMapEditorControls({
    doc,
    shadow,
    fogMode,
    viewMode,
  });
}

// Setup map editor controls
function setupMapEditorControls({ doc, shadow, fogMode, viewMode }) {
  // Toggle map editor mode
  const toggleBtn = shadow.getElementById("toggleMapEditor");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      mapEditorState.isEnabled = !mapEditorState.isEnabled;

      updateMapEditorUI({
        shadow,
        fogMode,
        viewMode,
      });
    });
  }

  // Brush size selector
  const brushSizeSelect = shadow.getElementById("brushSizeSelect");
  if (brushSizeSelect) {
    brushSizeSelect.addEventListener("change", (e) => {
      mapEditorState.brushSize = parseInt(e.target.value);
    });
  }

  // Tile selection buttons
  shadow.querySelectorAll(".tile-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tileType = e.target.dataset.tile;
      selectTile(shadow, tileType);
    });
  });

  // Clear all button
  const clearBtn = shadow.getElementById("clearMapEditor");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear the entire map? This cannot be undone.")) {
        clearMap();
      }
    });
  }

  // Fill layer button
  const fillBtn = shadow.getElementById("fillMapEditor");
  if (fillBtn) {
    fillBtn.addEventListener("click", () => {
      if (
        mapEditorState.selectedTile &&
        confirm(`Fill current layer with ${mapEditorState.selectedTile}?`)
      ) {
        fillCurrentLayer(shadow.getElementById("canvas"));
      }
    });
  }

  // Save as state button
  const saveBtn = shadow.getElementById("saveMapAsState");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveMapAsState();
    });
  }

  // Regenerate world button
  const regenerateBtn = shadow.getElementById("regenerateMap");
  if (regenerateBtn) {
    regenerateBtn.addEventListener("click", () => {
      if (confirm("Regenerated world? This will lose all editor changes.")) {
        const currentWorld = initNewWorld(
          gameConfig.BIOMES,
          gameConfig.SURFACE_LEVEL.get(),
          gameConfig.TILE_SIZE.get(),
          gameConfig.TILES,
          gameConfig.WORLD_HEIGHT.get(),
          gameConfig.WORLD_WIDTH.get(),
          gameConfig.worldSeed,
          gameState.gameTime,
          gameState.growthTimers,
          gameState.plantStructures,
          gameState.player,
          gameState.seedInventory,
        );

        // Set the world in state
        gameState.world.set(currentWorld);
      }
    });
  }
}

// Update map editor UI state
function updateMapEditorUI({ shadow, fogMode, viewMode }) {
  const mapEditorText = shadow.getElementById("mapEditorText");
  const mapEditorControls = shadow.getElementById("mapEditorControls");

  if (mapEditorText && mapEditorControls) {
    if (mapEditorState.isEnabled) {
      mapEditorText.textContent = "Disable Editor";
      mapEditorControls.removeAttribute("hidden");

      // Disable fog in editor mode for better visibility
      fogMode.set("clear");

      // Switch to normal view mode for editing
      viewMode.set("normal");
    } else {
      fogMode.set("fog");

      mapEditorText.textContent = "Enable Editor";
      mapEditorControls.setAttribute("hidden", "");
    }
  }
}

// Select a tile type for painting
function selectTile(shadow, tileType) {
  mapEditorState.selectedTile = tileType;

  console.log(
    "Selected tile:",
    tileType,
    "Editor enabled:",
    mapEditorState.isEnabled,
  );

  // Update UI to show selected tile
  shadow.querySelectorAll(".tile-btn").forEach((btn) => {
    btn.classList.remove("selected");
  });

  const selectedBtn = shadow.querySelector(`[data-tile="${tileType}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add("selected");
  }
}

// Handle canvas clicks for tile placement
export function handleMapEditorClick({
  x,
  y,
  camera,
  tiles,
  tileSize,
  worldHeight,
  worldWidth,
  world,
}) {
  if (
    !mapEditorState.isEnabled ||
    !mapEditorState.selectedTile ||
    typeof camera?.get !== "function"
  ) {
    // Not in editor mode or no tile selected, or camera unavailable
    return false;
  }

  // Convert screen coordinates to world tile coordinates
  const currentCamera = camera.get();
  const worldX = Math.floor((x + currentCamera.x) / tileSize);
  const worldY = Math.floor((y + currentCamera.y) / tileSize);

  paintTiles({
    centerX: worldX,
    centerY: worldY,
    tiles,
    worldHeight,
    worldWidth,
    world,
  });

  // Handled by map editor
  return true;
}

// Handle dragging for continuous painting
export function handleMapEditorDrag({
  x,
  y,
  isStart = false,
  camera,
  tiles,
  tileSize,
  worldHeight,
  worldWidth,
  world,
}) {
  if (!mapEditorState.isEnabled || !mapEditorState.selectedTile) {
    return false;
  }

  if (isStart) {
    mapEditorState.isDragging = true;
    mapEditorState.lastPaintedTile = null;
  }

  const currentCamera = camera.get();
  const worldX = Math.floor((x + currentCamera.x) / tileSize);
  const worldY = Math.floor((y + currentCamera.y) / tileSize);

  // Only paint if we've moved to a different tile
  const currentTileKey = `${worldX},${worldY}`;
  if (mapEditorState.lastPaintedTile !== currentTileKey) {
    paintTiles({
      centerX: worldX,
      centerY: worldY,
      tiles,
      worldHeight,
      worldWidth,
      world,
    });

    mapEditorState.lastPaintedTile = currentTileKey;
  }

  return true;
}

export function handleMapEditorDragEnd() {
  mapEditorState.isDragging = false;
  mapEditorState.lastPaintedTile = null;
}

// Paint tiles at the specified location with current brush size
function paintTiles({
  centerX,
  centerY,
  tiles,
  worldHeight,
  worldWidth,
  world,
}) {
  const selectedTileType = tiles[mapEditorState.selectedTile];

  if (!selectedTileType) {
    return;
  }

  const currentWorld = world.get();
  const brushRadius = Math.floor(mapEditorState.brushSize / 2);

  let hasChanges = false;

  for (let dx = -brushRadius; dx <= brushRadius; dx++) {
    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      const x = centerX + dx;
      const y = centerY + dy;

      // Check bounds
      if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
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
      if (currentWorld.getTile(x, y) !== selectedTileType) {
        currentWorld.setTile(x, y, selectedTileType);

        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    // Update the world state
    gameState.world.set(currentWorld);
  }
}

// Clear the entire map
function clearMap() {
  const currentWorld = gameState.world.get();
  const tiles = gameConfig.TILES;
  const worldWidth = gameConfig.WORLD_WIDTH.get();
  const worldHeight = gameConfig.WORLD_HEIGHT.get();

  for (let x = 0; x < worldWidth; x++) {
    for (let y = 0; y < worldHeight; y++) {
      currentWorld.setTile(x, y, tiles.AIR);
    }
  }

  gameState.world.set(currentWorld);

  // Clear plant structures and timers
  gameState.plantStructures.set({});
  gameState.growthTimers.set({});
}

// Fill current visible layer with selected tile
function fillCurrentLayer(canvas) {
  if (!mapEditorState.selectedTile) {
    return;
  }

  const camera = gameState.camera.get();
  const currentWorld = gameState.world.get();
  const tiles = gameConfig.TILES;
  const tileSize = gameConfig.TILE_SIZE.get();
  const selectedTileType = tiles[mapEditorState.selectedTile];
  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const worldWidth = gameConfig.WORLD_WIDTH.get();

  // Get visible area
  const startX = Math.floor(camera.x / tileSize);
  const startY = Math.floor(camera.y / tileSize);
  const endX = Math.min(
    worldWidth,
    startX + Math.ceil(canvas.width / tileSize),
  );

  const endY = Math.min(
    worldHeight,
    startY + Math.ceil(canvas.height / tileSize),
  );

  for (let x = Math.max(0, startX); x < endX; x++) {
    for (let y = Math.max(0, startY); y < endY; y++) {
      currentWorld.setTile(x, y, selectedTileType);
    }
  }

  gameState.world.set(currentWorld);
}

// Save the current map as a game state file
async function saveMapAsState() {
  try {
    // Create a save state with current world and reset fog
    const saveState = createSaveState(globalThis);

    // Reset explored map for fresh fog
    saveState.state.exploredMap = new Signal.State({});

    // Set player to a safe spawn location
    const worldWidth = gameConfig.WORLD_WIDTH.get();
    const surfaceLevel = gameConfig.SURFACE_LEVEL.get();
    const tileSize = gameConfig.TILE_SIZE.get();

    saveState.state.player = {
      x: (worldWidth / 2) * tileSize,
      y: surfaceLevel * tileSize - 50,
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
    document.body.append(a);
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

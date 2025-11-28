import {
  handleMapEditorClick,
  handleMapEditorDrag,
  handleMapEditorDragEnd,
  mapEditorState,
} from "../map/editor.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {MouseEvent|TouchEvent} e - Pointer or touch event
 * @param {HTMLCanvasElement} el - Canvas element
 * @param {number} scale - Scale factor
 *
 * @returns {{ x: number; y: number; } | undefined} Returns undefined if position can't be determined
 */
function getPointerPosition(e, el, scale) {
  /** @type {number|undefined} */
  let clientX;
  /** @type {number|undefined} */
  let clientY;

  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    return; // unsupported event type
  }

  if (
    clientX === undefined ||
    clientY === undefined ||
    !isFinite(clientX) ||
    !isFinite(clientY) ||
    !isFinite(scale) ||
    scale <= 0
  ) {
    return; // invalid values, avoid NaN
  }

  const rect = el.getBoundingClientRect();

  const scaleX = (el.width / rect.width) * scale;
  const scaleY = (el.height / rect.height) * scale;

  if (!isFinite(scaleX) || !isFinite(scaleY)) {
    return; // invalid value, not finite
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/**
 * @param {MouseEvent|TouchEvent} e - Pointer or touch event
 * @param {HTMLCanvasElement} el - Canvas element
 * @param {Signal.State} camera - Signal State with camera position data
 * @param {number} scale - Scale factor
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {WorldMap} world - Signal State with world tile data
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 *
 * @returns {void}
 */
function inspectTile(
  e,
  el,
  camera,
  scale,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
) {
  const pos = getPointerPosition(e, el, scale);
  const currentCamera = camera.get();
  const worldX = Math.floor((pos.x + currentCamera.x) / tileSize);
  const worldY = Math.floor((pos.y + currentCamera.y) / tileSize);

  if (
    worldX >= 0 &&
    worldX < worldWidth &&
    worldY >= 0 &&
    worldY < worldHeight
  ) {
    // Use the WorldMap getTile method instead of array access
    const tile = world.getTile ? world.getTile(worldX, worldY) : null;

    if (!tile || tile === tiles.AIR) {
      el.title = `Tile: AIR (${worldX}, ${worldY})`;
      return;
    }

    const tileName =
      Object.keys(tiles).find((key) => tiles[key] === tile) || "Custom";

    el.title = `Tile: ${tileName} (${worldX}, ${worldY})`;
  }
}

/**
 * @param {MouseEvent} e - Mouse event
 * @param {Signal.State} camera - Signal State with camera position data
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {Signal.State} world - Signal State with world tile data
 *
 * @returns {void}
 */
export function handleMouseDown(
  e,
  camera,
  tiles,
  tileSize,
  worldHeight,
  worldWidth,
  world,
) {
  if (!(e.target instanceof HTMLCanvasElement)) {
    return;
  }

  const el = e.target;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Check if map editor should handle this click
  if (
    handleMapEditorClick(
      x,
      y,
      camera,
      tiles,
      tileSize,
      worldHeight,
      worldWidth,
      world,
    )
  ) {
    // Start drag for continuous painting
    handleMapEditorDrag(
      x,
      y,
      camera,
      tiles,
      tileSize,
      worldHeight,
      worldWidth,
      world,
      true,
    );

    e.preventDefault();

    // Don't process tile inspection
    return;
  }
}

/** @returns {void} */
function handleMouseUp() {
  // Always call this to clean up map editor state
  handleMapEditorDragEnd();
}

/**
 * @param {MouseEvent} e - Mouse event
 * @param {Signal.State} camera - Signal State with camera position data
 * @param {number} scale - Scale factor
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {Signal.State} world - Signal State with world tile data
 *
 * @returns {void}
 */
function handleMouseMove(
  e,
  camera,
  scale,
  tiles,
  tileSize,
  worldHeight,
  worldWidth,
  world,
) {
  if (!(e.target instanceof HTMLCanvasElement)) {
    return;
  }

  const el = e.target;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Handle map editor dragging
  if (e.buttons === 1 && mapEditorState.isEnabled) {
    // Left mouse button down
    if (
      handleMapEditorDrag(
        x,
        y,
        camera,
        tiles,
        tileSize,
        worldHeight,
        worldWidth,
        world,
        false,
      )
    ) {
      e.preventDefault();

      // Don't process tile inspection
      return;
    }
  }

  inspectTile(
    e,
    el,
    camera,
    scale,
    tiles,
    tileSize,
    world.get(),
    worldHeight,
    worldWidth,
  );
}

/**
 * @param {TouchEvent} e - Touch event
 * @param {Signal.State} camera - Signal State with camera position data
 * @param {number} scale - Scale factor
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {Signal.State} world - Signal State with world tile data
 *
 * @returns {void}
 */
function handleTouchStart(
  e,
  camera,
  scale,
  tiles,
  tileSize,
  worldHeight,
  worldWidth,
  world,
) {
  if (!(e.target instanceof HTMLCanvasElement)) {
    return;
  }

  const el = e.target;

  if (e.touches.length === 1) {
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (
      handleMapEditorClick(
        x,
        y,
        camera,
        tiles,
        tileSize,
        worldHeight,
        worldWidth,
        world,
      )
    ) {
      handleMapEditorDrag(
        x,
        y,
        camera,
        tiles,
        tileSize,
        worldHeight,
        worldWidth,
        world,
        true,
      );

      e.preventDefault();

      return;
    }
  }

  inspectTile(
    e,
    el,
    camera,
    scale,
    tiles,
    tileSize,
    world.get(),
    worldHeight,
    worldWidth,
  );
}

/**
 * @param {TouchEvent} e - Touch event
 * @param {Signal.State} camera - Signal State with camera position data
 * @param {number} scale - Scale factor
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {Signal.State} world - Signal State with world tile data
 *
 * @returns {void}
 */
function handleTouchMove(
  e,
  camera,
  scale,
  tiles,
  tileSize,
  worldHeight,
  worldWidth,
  world,
) {
  if (!(e.target instanceof HTMLCanvasElement)) {
    return;
  }

  const el = e.target;

  if (e.touches.length === 1) {
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (
      handleMapEditorDrag(
        x,
        y,
        camera,
        tiles,
        tileSize,
        worldHeight,
        worldWidth,
        world,
        false,
      )
    ) {
      e.preventDefault();

      return;
    }
  }

  inspectTile(
    e,
    el,
    camera,
    scale,
    tiles,
    tileSize,
    world.get(),
    worldHeight,
    worldWidth,
  );
}

/**
 * Mouse/touch handling for tile inspection
 *
 * @param {HTMLCanvasElement} cnvs - Canvas element
 * @param {Signal.State} camera - Signal State with camera position data
 * @param {number} scale - Scale factor
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {Signal.State} world - Signal State with world tile data
 *
 * @returns {void}
 */
export function initTileInspection(
  cnvs,
  camera,
  scale,
  tiles,
  tileSize,
  worldHeight,
  worldWidth,
  world,
) {
  cnvs.addEventListener("mousedown", (e) =>
    handleMouseDown(e, camera, tiles, tileSize, worldHeight, worldWidth, world),
  );

  cnvs.addEventListener("mousemove", (e) =>
    handleMouseMove(
      e,
      camera,
      scale,
      tiles,
      tileSize,
      worldHeight,
      worldWidth,
      world,
    ),
  );

  cnvs.addEventListener("mouseup", () => handleMouseUp());
  cnvs.addEventListener("touchmove", (e) =>
    handleTouchMove(
      e,
      camera,
      scale,
      tiles,
      tileSize,
      worldHeight,
      worldWidth,
      world,
    ),
  );

  cnvs.addEventListener("touchstart", (e) =>
    handleTouchStart(
      e,
      camera,
      scale,
      tiles,
      tileSize,
      worldHeight,
      worldWidth,
      world,
    ),
  );
}

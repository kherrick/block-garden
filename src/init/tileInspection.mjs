import {
  handleMapEditorClick,
  handleMapEditorDrag,
  handleMapEditorDragEnd,
  mapEditorState,
} from "../map/editor.mjs";

/**
 * @param {any} e
 * @param {any} el
 * @param {any} scale
 *
 * @returns {{ x: number; y: number; }}
 */
function getPointerPosition(e, el, scale) {
  const rect = el.getBoundingClientRect();

  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const scaleX = (el.width / rect.width) * scale;
  const scaleY = (el.height / rect.height) * scale;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/**
 * @param {any} e
 * @param {any} el
 * @param {any} camera
 * @param {any} scale
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} world
 * @param {any} worldHeight
 * @param {any} worldWidth
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
 * @param {any} e
 * @param {any} camera
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} world
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
 * @param {any} e
 * @param {any} camera
 * @param {any} scale
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} world
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
 * @param {any} e
 * @param {any} camera
 * @param {any} scale
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} world
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
 * @param {any} e
 * @param {any} camera
 * @param {any} scale
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} world
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
 * @param {any} cnvs
 * @param {any} camera
 * @param {any} scale
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} world
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

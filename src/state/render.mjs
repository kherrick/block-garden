import { Signal } from "signal-polyfill";

/** @typedef {import('../util/colors/index.mjs').TileColorMap} TileColorMap */
/** @typedef {import('./config/tiles.mjs').TileIdMap} TileIdMap */
/** @typedef {import('./config/tiles.mjs').TileMap} TileMap */

/** @typedef {{ x: number, y: number }} CameraState */
/** @typedef {{ x: number, y: number }} PlayerState */
/** @typedef {{ camera: CameraState, player: PlayerState }} PreviousState */

/**
 * Render world
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Signal.State} player
 * @param {Signal.State} camera
 * @param {TileMap} tiles
 * @param {number} tileSize
 * @param {Signal.State} viewMode
 * @param {Signal.State} world
 * @param {number} worldHeight
 * @param {number} worldWidth
 * @param {Signal.State} fogMode
 * @param {Signal.State} isFogScaled
 * @param {Signal.State} fogScale
 * @param {Signal.State} exploredMap
 * @param {PreviousState} previousState
 * @param {number} interpolation
 * @param {TileColorMap} tileColorMap
 * @param {TileIdMap} tileNameByIdMap
 *
 * @returns {void}
 */
export function render(
  canvas,
  player,
  camera,
  tiles,
  tileSize,
  viewMode,
  world,
  worldHeight,
  worldWidth,
  fogMode,
  isFogScaled,
  fogScale,
  exploredMap,
  previousState,
  interpolation,
  tileColorMap,
  tileNameByIdMap,
) {
  const currentPlayer = player.get();
  const currentCamera = camera.get();
  const currentWorld = world.get();
  const currentExploredMap = exploredMap.get();

  // Calculate interpolated positions
  const interpolatedPlayerX =
    previousState.player.x +
    (currentPlayer.x - previousState.player.x) * interpolation;
  const interpolatedPlayerY =
    previousState.player.y +
    (currentPlayer.y - previousState.player.y) * interpolation;
  const interpolatedCameraX =
    previousState.camera.x +
    (currentCamera.x - previousState.camera.x) * interpolation;
  const interpolatedCameraY =
    previousState.camera.y +
    (currentCamera.y - previousState.camera.y) * interpolation;

  // Clear canvas
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = tileColorMap["air"];
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render world tiles
  const tilesX = Math.ceil(canvas.width / tileSize) + 1;
  const tilesY = Math.ceil(canvas.height / tileSize) + 1;
  const startX = Math.floor(interpolatedCameraX / tileSize);
  const startY = Math.floor(interpolatedCameraY / tileSize);

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      const worldX = startX + x;
      const worldY = startY + y;

      if (
        worldX >= 0 &&
        worldX < worldWidth &&
        worldY >= 0 &&
        worldY < worldHeight
      ) {
        const tile = currentWorld.getTile(worldX, worldY);

        if (!tile || tile === tiles.AIR) {
          continue;
        }

        const shouldXray = new Signal.Computed(
          () =>
            viewMode.get() === "xray" &&
            tile.solid &&
            tile !== tiles.COAL &&
            tile !== tiles.IRON &&
            tile !== tiles.GOLD &&
            tile !== tiles.LAVA,
        );

        const tileName = shouldXray.get() ? "xray" : tileNameByIdMap[tile.id];
        ctx.fillStyle = tileColorMap[tileName];
        ctx.fillRect(
          Math.round(x * tileSize - (interpolatedCameraX % tileSize)),
          Math.round(y * tileSize - (interpolatedCameraY % tileSize)),
          tileSize,
          tileSize,
        );
      }
    }
  }

  // Render player with interpolated position
  const screenX = interpolatedPlayerX - interpolatedCameraX;
  const screenY = interpolatedPlayerY - interpolatedCameraY;

  ctx.fillStyle = tileColorMap["player-body"];
  ctx.fillRect(screenX, screenY, currentPlayer.width, currentPlayer.height);
  ctx.strokeStyle = tileColorMap["player-border"];
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX, screenY, currentPlayer.width, currentPlayer.height);

  // Player eyes
  ctx.fillStyle = tileColorMap["player-eyes"];
  ctx.fillRect(screenX + 1, screenY + 1, 1, 1);
  ctx.fillRect(screenX + 4, screenY + 1, 1, 1);

  const isFogEnabled = fogMode.get() === "fog";
  if (isFogEnabled) {
    // Update fog map based on actual player position (not interpolated)
    currentExploredMap.updateFromPlayer(player, tileSize);

    // Render fog overlay with interpolated camera
    const interpolatedCameraObj = {
      get: () => ({ x: interpolatedCameraX, y: interpolatedCameraY }),
    };

    if (isFogScaled.get()) {
      currentExploredMap.renderScaled(
        ctx,
        canvas,
        tileSize,
        interpolatedCameraObj,
        fogScale.get(),
      );

      return;
    }

    const { velocityX, velocityY } = currentPlayer;

    if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
      isFogScaled.set(true);
    }

    currentExploredMap.render(ctx, canvas, tileSize, interpolatedCameraObj);
  }
}

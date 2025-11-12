import { getTileNameById } from "./config/tiles.mjs";

function shouldXray(tile, tiles, viewMode) {
  return (
    viewMode.get() === "xray" &&
    tile.solid &&
    tile !== tiles.COAL &&
    tile !== tiles.IRON &&
    tile !== tiles.GOLD &&
    tile !== tiles.LAVA
  );
}

// Render world
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
  gameColorMap,
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

  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  // Clear canvas
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

        const tileName = shouldXray(tile, tiles, viewMode)
          ? "xray"
          : getTileNameById(tiles, tile.id);

        ctx.fillStyle = tileColorMap[tileName.toLowerCase().replace(/_/g, "-")];

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

  ctx.fillStyle = currentPlayer.color;
  ctx.fillRect(screenX, screenY, currentPlayer.width, currentPlayer.height);
  ctx.strokeStyle = gameColorMap["black"];
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX, screenY, currentPlayer.width, currentPlayer.height);

  // Player eyes
  ctx.fillStyle = gameColorMap["black"];
  ctx.fillRect(screenX + 1, screenY + 1, 1, 1);
  ctx.fillRect(screenX + 4, screenY + 1, 1, 1);

  // Update fog map based on actual player position (not interpolated)
  const isFogEnabled = fogMode.get() === "fog";
  if (isFogEnabled) {
    currentExploredMap.updateFromPlayer(player, tileSize);
  }

  // Render fog overlay with interpolated camera
  if (isFogEnabled && ctx && canvas) {
    // Create temporary camera object for fog rendering
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
    } else {
      const { velocityX, velocityY } = currentPlayer;
      if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
        isFogScaled.set(true);
      }
      currentExploredMap.render(ctx, canvas, tileSize, interpolatedCameraObj);
    }
  }
}

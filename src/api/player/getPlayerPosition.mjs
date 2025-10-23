export function getPlayerPosition(player, tileSize, worldHeight, worldWidth) {
  // Get pixel position
  const pixelX = player.x;
  const pixelY = player.y;

  // Calculate tile position (center of player sprite)
  const tileX = Math.floor((pixelX + player.width / 2) / tileSize);
  const tileY = Math.floor((pixelY + player.height / 2) / tileSize);

  // Calculate normalized position (0.0 to 1.0)
  const normalizedX = tileX / worldWidth;
  const normalizedY = tileY / worldHeight;

  // Determine general location
  const location = {
    horizontal:
      normalizedX < 0.33 ? "left" : normalizedX > 0.66 ? "right" : "center",
    vertical:
      normalizedY < 0.33 ? "top" : normalizedY > 0.66 ? "bottom" : "middle",
  };

  return {
    pixel: { x: pixelX, y: pixelY },
    tile: { x: tileX, y: tileY },
    normalized: { x: normalizedX, y: normalizedY },
    location: location,
    bounds: {
      isAtLeft: tileX < 5,
      isAtRight: tileX > worldWidth - 5,
      isAtTop: tileY < 5,
      isAtBottom: tileY > worldHeight - 5,
    },
  };
}

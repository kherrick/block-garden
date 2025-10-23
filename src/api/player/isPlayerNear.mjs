export function isPlayerNear(targetX, targetY, radius = 5, pos = null) {
  if (!pos) {
    return false;
  }

  const dx = Math.abs(pos.tile.x - targetX);
  const dy = Math.abs(pos.tile.y - targetY);

  return dx <= radius && dy <= radius;
}

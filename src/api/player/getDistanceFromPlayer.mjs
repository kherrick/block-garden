export function getDistanceFromPlayer(targetX, targetY, pos = null) {
  if (!pos) {
    return {};
  }

  const dx = pos.tile.x - targetX;
  const dy = pos.tile.y - targetY;

  return {
    manhattan: Math.abs(dx) + Math.abs(dy),
    euclidean: Math.sqrt(dx * dx + dy * dy),
    tiles: { x: dx, y: dy },
  };
}

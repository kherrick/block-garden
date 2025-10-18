export function getMaterialFromTile(tile, tiles) {
  return (
    tile?.drops ??
    Object.fromEntries(Object.entries(tiles).map(([k, v]) => [v.id, k]))[
      tile.id
    ]
  );
}

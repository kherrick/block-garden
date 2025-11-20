/**
 * @param {any} world
 * @param {any} worldWidth
 * @param {any} worldHeight
 * @param {any} tiles
 *
 * @returns {{}}
 */
export function registerTreeStructures(world, worldWidth, worldHeight, tiles) {
  const structures = {};

  // Scan the world for trees and register them
  for (let x = 0; x < worldWidth; x++) {
    for (let y = 0; y < worldHeight; y++) {
      const tile = world.getTile(x, y);

      // Look for tree trunks that have ground below and aren't already part of a structure
      if (tile === tiles.TREE_TRUNK) {
        const belowTile = world.getTile(x, y + 1);

        const aboveTile = world.getTile(x, y - 1);
        // This is the base of a tree if it has solid ground below and trunk/air above
        if (belowTile && belowTile.solid && belowTile !== tiles.TREE_TRUNK) {
          const plantKey = `${x},${y}`;

          // Collect all blocks for this tree
          const treeBlocks = [];

          // Collect trunk blocks going up
          let checkY = y;

          while (checkY >= 0 && world.getTile(x, checkY) === tiles.TREE_TRUNK) {
            treeBlocks.push({ x, y: checkY, tile: tiles.TREE_TRUNK });

            checkY--;
          }

          // Collect leaf blocks around the top
          const topY = checkY + 1; // Last trunk position
          const leafRadius = 3; // Search radius

          for (let dx = -leafRadius; dx <= leafRadius; dx++) {
            for (let dy = -leafRadius; dy <= leafRadius; dy++) {
              const leafX = x + dx;
              const leafY = topY + dy;

              if (
                leafX >= 0 &&
                leafX < worldWidth &&
                leafY >= 0 &&
                leafY < worldHeight
              ) {
                if (world.getTile(leafX, leafY) === tiles.TREE_LEAVES) {
                  treeBlocks.push({
                    x: leafX,
                    y: leafY,
                    tile: tiles.TREE_LEAVES,
                  });
                }
              }
            }
          }

          // Register this tree structure
          structures[plantKey] = {
            seedType: "WALNUT",
            mature: true,
            blocks: treeBlocks,
            baseX: x,
            baseY: y,
          };
        }
      }
    }
  }

  return structures;
}

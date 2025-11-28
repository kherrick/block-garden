/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import('../state/config/index.mjs').WaterPhysicsConfig} WaterPhysicsConfig */

/**
 * Runtime water physics update
 *
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {WaterPhysicsConfig} waterPhysicsConfig - Water physics configuration
 * @param {Signal.State} waterPhysicsQueue - Queue of water updates to process
 * @param {Signal.State} world - Signal State with world tile data
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 *
 * @returns {void}
 */
export function updateWaterPhysics(
  tiles,
  waterPhysicsConfig,
  waterPhysicsQueue,
  world,
  worldHeight,
  worldWidth,
) {
  const currentQueue = waterPhysicsQueue.get();

  // Skip if no regions need updating
  if (currentQueue.size === 0) return;

  // Only run periodically to save CPU
  waterPhysicsConfig.frameCounter++;

  if (waterPhysicsConfig.frameCounter < waterPhysicsConfig.updateInterval) {
    return;
  }

  waterPhysicsConfig.frameCounter = 0;

  const newQueue = new Set();

  // Process ALL tiles to ensure water settles completely
  let anyWaterMoved = false;

  const currentWorld = world.get();

  for (const key of currentQueue) {
    const [x, y] = key.split(",").map(Number);

    // Check if this tile has water that should flow
    const tile = currentWorld.getTile(x, y);

    if (tile === tiles.WATER) {
      // Check for lava interaction first
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ];

      let touchesLava = false;

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < worldWidth &&
          neighbor.y >= 0 &&
          neighbor.y < worldHeight
        ) {
          if (currentWorld.getTile(neighbor.x, neighbor.y) === tiles.LAVA) {
            touchesLava = true;

            break;
          }
        }
      }

      if (touchesLava) {
        // Water + Lava = Pumice
        currentWorld.setTile(x, y, tiles.PUMICE);

        // Check neighbors for more water that might interact
        for (const neighbor of neighbors) {
          if (
            neighbor.x >= 0 &&
            neighbor.x < worldWidth &&
            neighbor.y >= 0 &&
            neighbor.y < worldHeight
          ) {
            newQueue.add(`${neighbor.x},${neighbor.y}`);
          }
        }

        anyWaterMoved = true;

        continue;
      }

      // Try to flow water downward
      if (y + 1 < worldHeight) {
        const below = currentWorld.getTile(x, y + 1);

        if (below === tiles.AIR) {
          // Water flows down into air
          currentWorld.setTile(x, y, tiles.AIR);
          currentWorld.setTile(x, y + 1, tiles.WATER);

          // Add the new water position and surrounding tiles to check next
          newQueue.add(`${x},${y + 1}`);

          if (x > 0) {
            newQueue.add(`${x - 1},${y + 1}`);
          }

          if (x < worldWidth - 1) {
            newQueue.add(`${x + 1},${y + 1}`);
          }

          if (y + 2 < worldHeight) {
            newQueue.add(`${x},${y + 2}`);
          }

          anyWaterMoved = true;

          continue; // Skip sideways movement since we're falling
        } else if (below === tiles.LAVA) {
          // Water falling onto lava becomes pumice
          currentWorld.setTile(x, y, tiles.AIR);
          currentWorld.setTile(x, y + 1, tiles.PUMICE);

          anyWaterMoved = true;

          continue;
        } else if (below && below.solid) {
          // Water can't flow down, try sideways
          const leftEmpty =
            x > 0 && currentWorld.getTile(x - 1, y) === tiles.AIR;

          const rightEmpty =
            x < worldWidth - 1 && currentWorld.getTile(x + 1, y) === tiles.AIR;

          // Check if water can flow sideways and down
          const leftCanFall =
            leftEmpty &&
            y + 1 < worldHeight &&
            currentWorld.getTile(x - 1, y + 1) === tiles.AIR;

          const rightCanFall =
            rightEmpty &&
            y + 1 < worldHeight &&
            currentWorld.getTile(x + 1, y + 1) === tiles.AIR;

          if (leftCanFall || rightCanFall) {
            // Prefer flowing to a side where water can continue falling
            let flowDirection = 0;

            if (leftCanFall && rightCanFall) {
              flowDirection = Math.random() < 0.5 ? -1 : 1;
            } else if (leftCanFall) {
              flowDirection = -1;
            } else {
              flowDirection = 1;
            }

            const newX = x + flowDirection;

            currentWorld.setTile(x, y, tiles.AIR);
            currentWorld.setTile(newX, y, tiles.WATER);

            newQueue.add(`${newX},${y}`);
            newQueue.add(`${newX},${y + 1}`);

            anyWaterMoved = true;
          } else if (leftEmpty || rightEmpty) {
            // Flow sideways even if can't fall (spread on flat surface)
            let flowDirection = 0;

            if (leftEmpty && rightEmpty) {
              flowDirection = Math.random() < 0.5 ? -1 : 1;
            } else if (leftEmpty) {
              flowDirection = -1;
            } else {
              flowDirection = 1;
            }

            const newX = x + flowDirection;

            // Check if the destination has solid ground beneath it
            if (y + 1 < worldHeight) {
              const belowDest = currentWorld.getTile(newX, y + 1);

              if (belowDest && belowDest.solid) {
                currentWorld.setTile(x, y, tiles.AIR);
                currentWorld.setTile(newX, y, tiles.WATER);

                newQueue.add(`${newX},${y}`);

                anyWaterMoved = true;
              }
            }
          }
        }
      }
    } else if (tile !== tiles.WATER) {
      // This tile doesn't have water, but check if there's water above that needs to fall
      if (y > 0) {
        const above = currentWorld.getTile(x, y - 1);

        if (above === tiles.WATER) {
          newQueue.add(`${x},${y - 1}`);
        }
      }
    }
  }

  // Scan for any suspended water that might have been missed
  if (anyWaterMoved) {
    // Add a wider check around areas where water moved
    for (const key of newQueue) {
      const [x, y] = key.split(",").map(Number);

      // Check surrounding area for suspended water
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const checkX = x + dx;
          const checkY = y + dy;

          if (
            checkX >= 0 &&
            checkX < worldWidth &&
            checkY >= 0 &&
            checkY < worldHeight
          ) {
            const checkTile = currentWorld.getTile(checkX, checkY);

            if (checkTile === tiles.WATER) {
              // Check if this water has air below (suspended)
              if (checkY + 1 < worldHeight) {
                const below = currentWorld.getTile(checkX, checkY + 1);

                if (below === tiles.AIR) {
                  newQueue.add(`${checkX},${checkY}`);
                }
              }
            }
          }
        }
      }
    }
  }

  // If water moved, keep the queue active; otherwise clear it
  if (anyWaterMoved && newQueue.size > 0) {
    waterPhysicsQueue.set(newQueue);
  } else {
    // Water has fully settled, clear the queue
    waterPhysicsQueue.set(new Set());
  }
}

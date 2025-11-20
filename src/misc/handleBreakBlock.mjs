import { getHarvestMap } from "./getHarvestMap.mjs";
import { getMaterialFromTile } from "./getMaterialFromTile.mjs";
import { mapEditorState } from "../map/editor.mjs";
import { markWaterRegionDirty } from "../water/markWaterRegionDirty.mjs";
import { updateState } from "../state/state.mjs";

/**
 * Helper function to check if a tile position is part of a mature plant structure
 *
 * @param {any} x
 * @param {any} y
 * @param {any} plantStructures
 *
 * @returns {boolean}
 */
function isMaturePlantPart(x, y, plantStructures) {
  for (const [key, structure] of Object.entries(plantStructures.get())) {
    if (structure.mature && structure.blocks) {
      if (structure.blocks.find((b) => b.x === x && b.y === y)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * @param {any} tile
 * @param {any} tiles
 *
 * @returns {boolean}
 */
function isTreePart(tile, tiles) {
  return tile === tiles.TREE_TRUNK || tile === tiles.TREE_LEAVES;
}

/**
 * @param {any} growthTimers
 * @param {any} plantStructures
 * @param {any} player
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} world
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {string} [mode="regular"]
 *
 * @returns {void}
 */
function handleBreakBlock(
  growthTimers,
  plantStructures,
  player,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
  mode = "regular",
) {
  if (mapEditorState.isEnabled) {
    console.log("Breaking disabled in map editor mode");

    return;
  }

  const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
  const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

  let blocksToBreak = [];

  if (mode === "regular") {
    if (player.lastDirection !== 0) {
      // Horizontal travel → always break corridors 3 tiles tall:
      // the block directly in front of the player, and the 2 directly above.
      const dx = player.lastDirection > 0 ? 1 : -1;

      for (let dy = 0; dy < 3; dy++) {
        const targetX = playerTileX + dx; // one tile forward
        const targetY = playerTileY - dy; // player's tile (dy=0), +1 above, +2 above
        if (
          targetX < 0 ||
          targetX >= worldWidth ||
          targetY < 0 ||
          targetY >= worldHeight
        ) {
          continue;
        }

        const tile = world.getTile(targetX, targetY);

        if (
          tile &&
          tile !== tiles.AIR &&
          tile !== tiles.BEDROCK &&
          tile !== tiles.LAVA &&
          tile !== tiles.WATER && // Don't break water
          !isMaturePlantPart(targetX, targetY, plantStructures)
        ) {
          blocksToBreak.push({ x: targetX, y: targetY, tile, priority: dy });
        }
      }
    } else {
      // Idle → break directly under the player (1 tile downward)
      const targetX = playerTileX;
      const targetY = playerTileY + 1;

      if (
        targetX >= 0 &&
        targetX < worldWidth &&
        targetY >= 0 &&
        targetY < worldHeight
      ) {
        const tile = world.getTile(targetX, targetY);

        if (
          tile &&
          tile !== tiles.AIR &&
          tile !== tiles.BEDROCK &&
          tile !== tiles.LAVA &&
          tile !== tiles.WATER &&
          !isMaturePlantPart(targetX, targetY, plantStructures)
        ) {
          blocksToBreak.push({ x: targetX, y: targetY, tile, priority: 1 });
        }
      }
    }
  } else {
    // Break in an area around the player - adjust pattern based on movement direction
    const breakRadius = 1;

    // If player is moving horizontally, break in a horizontal line
    if (player.lastDirection !== 0) {
      // Horizontal breaking pattern
      for (let dx = -breakRadius; dx <= breakRadius; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const targetX = playerTileX + dx * (player.lastDirection > 0 ? 1 : 1);
          const targetY = playerTileY + dy;

          if (
            targetX < 0 ||
            targetX >= worldWidth ||
            targetY < 0 ||
            targetY >= worldHeight
          ) {
            continue;
          }

          const tile = world.getTile(targetX, targetY);

          // Can break most blocks except bedrock, air, lava, and water
          // Also exclude mature plant parts (they should be harvested, not broken)
          if (
            tile &&
            tile !== tiles.AIR &&
            tile !== tiles.BEDROCK &&
            tile !== tiles.LAVA &&
            tile !== tiles.WATER &&
            !isMaturePlantPart(targetX, targetY, plantStructures)
          ) {
            // Prioritize blocks in the direction player is facing
            const priority =
              Math.abs(dx) === 0 ? 1 : 2 - Math.abs(dx) / breakRadius;

            blocksToBreak.push({
              x: targetX,
              y: targetY,
              tile: tile,
              priority,
            });
          }
        }
      }
    } else {
      // Default circular breaking pattern when not moving
      for (let dx = -breakRadius; dx <= breakRadius; dx++) {
        for (let dy = -breakRadius; dy <= breakRadius; dy++) {
          const targetX = playerTileX + dx;
          const targetY = playerTileY + dy;

          if (
            targetX < 0 ||
            targetX >= worldWidth ||
            targetY < 0 ||
            targetY >= worldHeight
          ) {
            continue;
          }

          const tile = world.getTile(targetX, targetY);

          // Can break most blocks except bedrock, air, lava, and water
          // Also exclude mature plant parts (they should be harvested, not broken)
          if (
            tile &&
            tile !== tiles.AIR &&
            tile !== tiles.BEDROCK &&
            tile !== tiles.LAVA &&
            tile !== tiles.WATER &&
            !isMaturePlantPart(targetX, targetY, plantStructures)
          ) {
            blocksToBreak.push({
              x: targetX,
              y: targetY,
              tile: tile,
              priority: 1,
            });
          }
        }
      }
    }
  }

  if (blocksToBreak.length > 0) {
    // Break multiple blocks at once
    const currentTimers = growthTimers.get();
    const currentStructures = plantStructures.get();

    const updatedTimers = { ...currentTimers };
    const updatedStructures = { ...currentStructures };

    let seedUpdates = {};
    let materialUpdates = {};

    blocksToBreak.forEach((block) => {
      // Check if this is part of an immature plant structure (these can be broken)
      let isImmaturePlantPart = false;
      let plantKey = null;

      // Find if this block is part of any immature plant structure
      for (const [key, structure] of Object.entries(currentStructures)) {
        if (!structure.mature && structure.blocks) {
          for (const plantBlock of structure.blocks) {
            if (plantBlock.x === block.x && plantBlock.y === block.y) {
              isImmaturePlantPart = true;
              plantKey = key;

              break;
            }
          }
        }

        if (isImmaturePlantPart) break;
      }

      // If it's part of an immature plant, remove the entire plant
      if (isImmaturePlantPart && plantKey) {
        const structure = currentStructures[plantKey];

        if (structure.blocks) {
          structure.blocks.forEach((plantBlock) => {
            if (
              plantBlock.x >= 0 &&
              plantBlock.x < worldWidth &&
              plantBlock.y >= 0 &&
              plantBlock.y < worldHeight
            ) {
              world.setTile(plantBlock.x, plantBlock.y, tiles.AIR);
            }
          });
        }

        // Give small chance to get a seed back when breaking immature plants
        if (structure.seedType && Math.random() < 0.5) {
          seedUpdates[structure.seedType] =
            (seedUpdates[structure.seedType] || 0) + 1;
        }

        delete updatedStructures[plantKey];
        delete updatedTimers[plantKey];
      } else {
        // Regular block breaking
        world.setTile(block.x, block.y, tiles.AIR);

        // Remove from growth timers if it was a crop
        delete updatedTimers[`${block.x},${block.y}`];

        // Check if this is a tree part and give chance to drop walnut
        if (isTreePart(block.tile, tiles) && Math.random() < 0.15) {
          seedUpdates["WALNUT"] = (seedUpdates["WALNUT"] || 0) + 1;
        }

        // Give small chance to drop seeds from broken natural crops
        if (block.tile.crop && Math.random() < 0.3) {
          const seedType = getHarvestMap(tiles)[block.tile.id];

          if (seedType) {
            seedUpdates[seedType] = (seedUpdates[seedType] || 0) + 1;
          }
        }

        // Collect materials from broken blocks
        const materialType = getMaterialFromTile(block.tile, tiles);

        if (materialType) {
          // Special handling for leaves - only sometimes drop wood
          if (block.tile === tiles.TREE_LEAVES && Math.random() < 0.3) {
            materialUpdates[materialType] =
              (materialUpdates[materialType] || 0) + 1;
          } else if (block.tile !== tiles.TREE_LEAVES) {
            materialUpdates[materialType] =
              (materialUpdates[materialType] || 0) + 1;
          }
        }
      }
    });

    // Apply updates back to state, world, timers, and structures
    growthTimers.set(updatedTimers);
    plantStructures.set(updatedStructures);

    // Update seed inventory if we gained any seeds
    if (Object.keys(seedUpdates).length > 0) {
      updateState("seedInventory", (inv) => {
        const updated = { ...inv };

        Object.entries(seedUpdates).forEach(([seedType, amount]) => {
          updated[seedType] += amount;
        });

        return updated;
      });
    }

    // Update materials inventory if we gained any materials
    if (Object.keys(materialUpdates).length > 0) {
      updateState("materialsInventory", (inv) => {
        const updated = { ...inv };

        Object.entries(materialUpdates).forEach(([materialType, amount]) => {
          updated[materialType] = (updated[materialType] || 0) + amount;
        });

        return updated;
      });
    }
  }
}

/**
 * @param {any} growthTimers
 * @param {any} plantStructures
 * @param {any} player
 * @param {any} tiles
 * @param {any} tileSize
 * @param {any} world
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} queue
 * @param {string} [mode="regular"]
 *
 * @returns {void}
 */
export function handleBreakBlockWithWaterPhysics(
  growthTimers,
  plantStructures,
  player,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
  queue,
  mode = "regular",
) {
  const currentPlayer = player.get();
  const currentWorld = world.get();

  // After breaking blocks, check if any were near water
  const playerTileX = Math.floor(
    (currentPlayer.x + currentPlayer.width / 2) / tileSize,
  );
  const playerTileY = Math.floor(
    (currentPlayer.y + currentPlayer.height / 2) / tileSize,
  );

  // Store original function result
  const originalResult = handleBreakBlock(
    growthTimers,
    plantStructures,
    currentPlayer,
    tiles,
    tileSize,
    currentWorld,
    worldHeight,
    worldWidth,
    mode,
  );

  // Check if we broke any blocks near water
  const checkRadius = 3;

  let foundWater = false;

  for (let dx = -checkRadius; dx <= checkRadius; dx++) {
    for (let dy = -checkRadius; dy <= checkRadius; dy++) {
      const checkX = playerTileX + dx;
      const checkY = playerTileY + dy;

      if (
        checkX >= 0 &&
        checkX < worldWidth &&
        checkY >= 0 &&
        checkY < worldHeight
      ) {
        if (currentWorld.getTile(checkX, checkY) === tiles.WATER) {
          foundWater = true;

          markWaterRegionDirty(
            checkX,
            checkY,
            queue,
            worldWidth,
            worldHeight,
            10,
          );
        }
      }
    }
  }

  return originalResult;
}

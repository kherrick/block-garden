import { getHarvestMap } from "./getHarvestMap.mjs";
import { getMaterialFromTile } from "./getMaterialFromTile.mjs";

import {
  getTileNameById,
  stringifyToLowerCase,
} from "../state/config/tiles.mjs";

import { mapEditorState } from "../map/editor.mjs";
import { markWaterRegionDirty } from "../water/markWaterRegionDirty.mjs";
import { updateState } from "../state/state.mjs";

import { harvestMaturePlant } from "./harvestMaturePlant.mjs";
import { isMaturePlantPart } from "./isMaturePlantPart.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/tiles.mjs').TileDefinition} TileDefinition */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import("../state/state.mjs").PlayerState} PlayerState */

/**
 * Determines if a tile is part of the standard tree structure (trunk or leaves).
 *
 * @param {TileDefinition|null} tile - The tile to check
 * @param {TileMap} tiles - Map of all tile definitions
 *
 * @returns {boolean} True if tile is tree trunk or leaves
 */
function isTreePart(tile, tiles) {
  return tile === tiles.TREE_TRUNK || tile === tiles.TREE_LEAVES;
}

/**
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {Signal.State} growthTimers - Signal State with growth timer data
 * @param {Signal.State} plantStructures - Signal State with plant structure data
 * @param {PlayerState} player - Signal State with player position/dimension data
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {WorldMap} world - Signal State with world tile data
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {string} [mode="regular"]
 *
 * @returns {void}
 */
function handleBreakBlock(
  shadow,
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
    const message = "Breaking disabled in map editor mode";

    console.log(message);
    shadow.dispatchEvent(
      new CustomEvent("sprite-garden-toast", {
        detail: {
          message,
        },
      }),
    );

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
          tile !== tiles.WATER
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
          tile !== tiles.WATER
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

          if (
            tile &&
            tile !== tiles.AIR &&
            tile !== tiles.BEDROCK &&
            tile !== tiles.LAVA &&
            tile !== tiles.WATER
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
    // Check if any of the blocks are part of mature plant structures
    const currentStructures = plantStructures.get();
    const maturePlantsToHarvest = new Set();

    for (const block of blocksToBreak) {
      for (const [key, structure] of Object.entries(currentStructures)) {
        if (structure.mature && structure.blocks) {
          const blocksArray = Array.isArray(structure.blocks)
            ? structure.blocks
            : Object.values(structure.blocks);

          const matchingBlock = blocksArray.find(
            (plantBlock) =>
              plantBlock.x === block.x && plantBlock.y === block.y,
          );

          if (matchingBlock) {
            maturePlantsToHarvest.add(key);

            break;
          }
        }
      }
    }

    // Harvest any mature plants that were found
    if (maturePlantsToHarvest.size > 0) {
      for (const structureKey of maturePlantsToHarvest) {
        const structure = currentStructures[structureKey];

        harvestMaturePlant(
          shadow,
          growthTimers,
          plantStructures,
          structure,
          structureKey,
          tiles,
          world,
          worldHeight,
          worldWidth,
        );
      }

      return; // Exit early since we harvested mature plants
    }

    // Continue with regular block breaking for non-mature-plant blocks
    const currentTimers = growthTimers.get();
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
          // Blocks can be an array or an object depending on save format
          const blocksArray = Array.isArray(structure.blocks)
            ? structure.blocks
            : Object.values(structure.blocks);

          for (const plantBlock of blocksArray) {
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
          // Blocks can be an array or an object depending on save format
          const blocksArray = Array.isArray(structure.blocks)
            ? structure.blocks
            : Object.values(structure.blocks);

          blocksArray.forEach((plantBlock) => {
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
        if (block.tile.isSeed || (block.tile.crop && Math.random() < 0.3)) {
          const harvestMap = getHarvestMap(tiles);
          const seedType = harvestMap[block.tile.id];

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

    const blockNames = blocksToBreak
      .map((block) =>
        stringifyToLowerCase(getTileNameById(tiles, block.tile.id)),
      )
      .join(", ");

    shadow.dispatchEvent(
      new CustomEvent("sprite-garden-toast", {
        detail: {
          message: `Collected ${JSON.stringify(blockNames)}`,
        },
      }),
    );

    // Apply updates back to state, world, timers, and structures
    growthTimers.set(updatedTimers);
    plantStructures.set(updatedStructures);

    // Update seed inventory if we gained any seeds
    if (Object.keys(seedUpdates).length > 0) {
      updateState("seedInventory", (inv) => {
        const updated = { ...inv };

        Object.entries(seedUpdates).forEach(([seedType, amount]) => {
          updated[seedType] = (updated[seedType] || 0) + amount;
        });

        return updated;
      });
    }

    // Update materials inventory if we gained any materials
    if (Object.keys(materialUpdates).length > 0) {
      updateState("materialsInventory", (inv) => {
        const updated = { ...inv };

        Object.entries(materialUpdates).forEach(([materialType, amount]) => {
          if (!tiles[materialType]?.isSeed === true) {
            updated[materialType] = (updated[materialType] || 0) + amount;
          }
        });

        return updated;
      });
    }
  }
}

/**
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {Signal.State} growthTimers - Signal State with growth timer data
 * @param {Signal.State} plantStructures - Signal State with plant structure data
 * @param {Signal.State} player - Signal State with player position/dimension data
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {Signal.State} world - Signal State with world tile data
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {Signal.State} queue - Queue of blocks to harvest
 * @param {string} [mode="regular"]
 *
 * @returns {void}
 */
export function handleBreakBlockWithWaterPhysics(
  shadow,
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
    shadow,
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

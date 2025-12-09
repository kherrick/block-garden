import { harvestCrop } from "./harvestCrop.mjs";
import { harvestMaturePlant } from "./harvestMaturePlant.mjs";
import { plantSeed } from "./plantSeed.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */

/**
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {Signal.State} growthTimers growthTimers - Signal State with growth timer data
 * @param {Signal.State} plantStructures plantStructures - Signal State with plant structure data
 * @param {Signal.State} player - Signal State with player position/dimension data
 * @param {Signal.State} seedInventory - Signal State with seed inventory data
 * @param {string} selectedSeedType - Currently selected seed type
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {WorldMap} world - World with getTile and setTile methods
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 *
 * @returns {void}
 */
export function handleFarmAction(
  shadow,
  growthTimers,
  plantStructures,
  /** @type {{ [key: string]: number }} */
  player,
  seedInventory,
  selectedSeedType,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
) {
  const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
  const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

  // Check multiple positions for farming actions
  const farmingPositions = [];

  // If player is moving horizontally, check in front of player
  if (player.lastDirection !== 0) {
    const dx = player.lastDirection > 0 ? 1 : -1;

    farmingPositions.push({
      x: playerTileX + dx,
      y: playerTileY, // Same level as player
    });

    farmingPositions.push({
      x: playerTileX + dx,
      y: playerTileY + 1, // One below player level
    });
  }

  // Always check directly below the player
  farmingPositions.push({
    x: playerTileX,
    y: playerTileY + 1,
  });

  // Also check the tile the player is standing on
  farmingPositions.push({
    x: playerTileX,
    y: playerTileY,
  });

  // Try each position until we find something to farm
  for (const pos of farmingPositions) {
    const { x: targetX, y: targetY } = pos;

    if (
      targetX < 0 ||
      targetX >= worldWidth ||
      targetY < 0 ||
      targetY >= worldHeight
    ) {
      continue;
    }

    const currentTile = world.getTile(targetX, targetY);

    // Check if this position is part of a mature plant structure
    let harvestableStructure = null;
    let structureKey = null;

    const currentStructures = plantStructures.get();

    // Look for mature plant structures that contain this tile
    for (const [key, structure] of Object.entries(currentStructures)) {
      if (structure.mature && structure.blocks) {
        // Blocks can be an array or an object depending on save format
        const blocksArray = Array.isArray(structure.blocks)
          ? structure.blocks
          : Object.values(structure.blocks);

        // Check if any block in the structure matches our target position
        const matchingBlock = blocksArray.find(
          (block) => block.x === targetX && block.y === targetY,
        );

        if (matchingBlock) {
          harvestableStructure = structure;
          structureKey = key;

          break;
        }
      }
    }

    // If we found a mature plant structure, harvest it
    if (harvestableStructure && structureKey) {
      harvestMaturePlant(
        shadow,
        growthTimers,
        plantStructures,
        harvestableStructure,
        structureKey,
        tiles,
        world,
        worldHeight,
        worldWidth,
      );

      // Exit after successful harvest
      return;
    }
    // Check for crops (fallback for any remaining crop tiles)
    else if (currentTile && currentTile.crop) {
      harvestCrop(shadow, currentTile, tiles, world, targetX, targetY);

      // Exit after successful harvest
      return;
    }
    // Plant seeds if the tile is empty and we have seeds selected
    else if (
      currentTile === tiles.AIR &&
      selectedSeedType &&
      seedInventory[selectedSeedType] > 0
    ) {
      plantSeed(
        shadow,
        growthTimers,
        plantStructures,
        seedInventory,
        selectedSeedType,
        tiles,
        world,
        targetX,
        targetY,
      );

      // Exit after successful planting
      return;
    }
  }
}

import {
  getTileNameById,
  stringifyToLowerCase,
  TILES,
} from "../state/config/tiles.mjs";

import { harvestCrop } from "./harvestCrop.mjs";
import { harvestMaturePlant } from "./harvestMaturePlant.mjs";
import { plantSeed } from "./plantSeed.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */

function getFarmingPositions(player, playerTileX, playerTileY) {
  const positions = [];

  if (player.lastDirection !== 0) {
    const dx = player.lastDirection > 0 ? 1 : -1;
    positions.push(
      { x: playerTileX + dx, y: playerTileY },
      { x: playerTileX + dx, y: playerTileY + 1 },
    );
  }

  positions.push(
    { x: playerTileX, y: playerTileY + 1 },
    { x: playerTileX, y: playerTileY },
  );

  return positions;
}

function isWithinWorldBounds(x, y, worldWidth, worldHeight) {
  return x >= 0 && x < worldWidth && y >= 0 && y < worldHeight;
}

function findHarvestableStructure(plantStructures, targetX, targetY) {
  const currentStructures = plantStructures.get();

  for (const [key, structure] of Object.entries(currentStructures)) {
    if (!structure.mature || !structure.blocks) continue;

    const blocksArray = Array.isArray(structure.blocks)
      ? structure.blocks
      : Object.values(structure.blocks);

    const matchingBlock = blocksArray.find(
      (block) => block.x === targetX && block.y === targetY,
    );

    if (matchingBlock) {
      return { structure, key };
    }
  }

  return null;
}

function canHarvestCrop(tile) {
  return tile?.crop && !tile.seed;
}

function canPlantSeed(tile, tiles, selectedSeedType, seedInventory) {
  return (
    tile === tiles.AIR &&
    selectedSeedType &&
    seedInventory[selectedSeedType] > 0
  );
}

function performHarvestMaturePlant(params, harvestable) {
  const {
    shadow,
    growthTimers,
    plantStructures,
    tiles,
    world,
    worldHeight,
    worldWidth,
  } = params;

  harvestMaturePlant(
    shadow,
    growthTimers,
    plantStructures,
    harvestable.structure,
    harvestable.key,
    tiles,
    world,
    worldHeight,
    worldWidth,
  );

  return true;
}

function performHarvestCrop(params, currentTile, targetX, targetY) {
  const { shadow, tiles, world } = params;

  const result = harvestCrop(
    shadow,
    currentTile,
    tiles,
    world,
    targetX,
    targetY,
  );

  if (!result) {
    showMessage(shadow, world, targetX, targetY, "harvest");
  }

  return result;
}

function performPlantSeed(params, targetX, targetY) {
  const {
    shadow,
    growthTimers,
    plantStructures,
    seedInventory,
    selectedSeedType,
    tiles,
    world,
  } = params;

  return plantSeed(
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
}

function tryFarmingAction(params, pos) {
  const {
    plantStructures,
    tiles,
    selectedSeedType,
    seedInventory,
    world,
    worldWidth,
    worldHeight,
  } = params;

  const { x: targetX, y: targetY } = pos;

  if (!isWithinWorldBounds(targetX, targetY, worldWidth, worldHeight)) {
    return false;
  }

  const currentTile = world.getTile(targetX, targetY);

  // Try harvesting mature plant
  const harvestable = findHarvestableStructure(
    plantStructures,
    targetX,
    targetY,
  );

  if (harvestable) {
    return performHarvestMaturePlant(params, harvestable);
  }

  // Try planting seed
  if (canPlantSeed(currentTile, tiles, selectedSeedType, seedInventory)) {
    return performPlantSeed(params, targetX, targetY);
  }

  // Try harvesting crop
  if (canHarvestCrop(currentTile)) {
    return performHarvestCrop(params, currentTile, targetX, targetY);
  }

  return false;
}

function showMessage(shadow, world, tileX, tileY, type) {
  const tile = stringifyToLowerCase(
    getTileNameById(TILES, world.getTile(tileX, tileY).id),
  );

  const message = `Cannot ${type} ${tile} at (${tileX}, ${tileY})`;

  shadow.dispatchEvent(
    new CustomEvent("sprite-garden-toast", { detail: { message } }),
  );
}

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

  const farmingPositions = getFarmingPositions(
    player,
    playerTileX,
    playerTileY,
  );

  const params = {
    shadow,
    growthTimers,
    plantStructures,
    seedInventory,
    selectedSeedType,
    tiles,
    world,
    worldHeight,
    worldWidth,
  };

  const actionPerformed = farmingPositions.some((pos) =>
    tryFarmingAction(params, pos),
  );

  if (!actionPerformed) {
    showMessage(shadow, world, playerTileX, playerTileY, "farm");
  }
}

import { harvestCrop } from "./harvestCrop.mjs";
import { plantSeed } from "./plantSeed.mjs";
import { stringifyToLowerCase } from "../state/config/tiles.mjs";
import { updateState } from "../state/state.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */

/**
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {Signal.State} growthTimers growthTimers - Signal State with growth timer data
 * @param {Signal.State} plantStructures plantStructures - Signal State with plant structure data
 * @param {Object} structure - Plant structure object
 * @param {string} structureKey - Key for the structure in plantStructures
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {WorldMap} world - World with getTile and setTile methods
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 *
 * @returns {void}
 */
function harvestMaturePlant(
  shadow,
  growthTimers,
  plantStructures,
  structure,
  structureKey,
  tiles,
  world,
  worldHeight,
  worldWidth,
) {
  if (structure.blocks) {
    // Blocks can be an array or an object depending on save format
    const blocksArray = Array.isArray(structure.blocks)
      ? structure.blocks
      : Object.values(structure.blocks);

    blocksArray.forEach((block) => {
      if (
        block.x >= 0 &&
        block.x < worldWidth &&
        block.y >= 0 &&
        block.y < worldHeight
      ) {
        world.setTile(block.x, block.y, tiles.AIR);
      }
    });
  }

  // Give seeds (and / or wood) when harvesting mature plant
  if (structure.seedType) {
    // 1-3 seeds
    const seedsGained = 1 + Math.floor(Math.random() * 3);

    updateState("seedInventory", (inv) => ({
      ...inv,
      [structure.seedType]: inv[structure.seedType] + seedsGained,
    }));

    let message = `Harvested mature ${stringifyToLowerCase(structure.seedType)}, gained ${seedsGained} seed${seedsGained > 1 ? "s" : ""}.`;

    // Check for a wood like structure
    const item = "WOOD";
    const drops = tiles[structure.seedType].drops;
    const shouldDrop = Array.isArray(drops)
      ? drops.some((item) => item.toLowerCase().includes(item.toLowerCase()))
      : drops.toLowerCase().includes(item.toLowerCase());

    // 0-3 wood
    const woodGained = shouldDrop ? 1 + Math.floor(Math.random() * 3) : 0;

    if (woodGained) {
      updateState("materialsInventory", (inv) => ({
        ...inv,
        [item]: inv[item] + woodGained,
      }));

      message = `${message} Gained ${woodGained} ${stringifyToLowerCase(item)}.`;
    }

    console.log(message);
    shadow.dispatchEvent(
      new CustomEvent("sprite-garden-toast", {
        detail: {
          message,
        },
      }),
    );
  }

  // Remove the plant structure and any associated timers
  const currentStructures = plantStructures.get();
  const updatedStructures = { ...currentStructures };
  const updatedTimers = { ...growthTimers.get() };

  delete updatedStructures[structureKey];
  delete updatedTimers[structureKey];

  plantStructures.set(updatedStructures);
  growthTimers.set(updatedTimers);
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

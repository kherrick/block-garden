import localForage from "localforage";

import { getTileFromMaterial } from "./getTileFromMaterial.mjs";
import { updateRangeValue } from "../update/ui/range.mjs";
import { updateState } from "../state/state.mjs";
import { stringifyToLowerCase } from "../state/config/tiles.mjs";

/** @typedef {import("../state/state.mjs").PlayerState} PlayerState */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * Handles placing a block in the world at specified position.
 *
 * Determines target position based on directional key input.
 * Updates inventory and range UI when block is successfully placed.
 *
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {string} key - Direction key ('k', 'o', 'u', 'i') controlling placement direction
 * @param {Object} materialsInventory - State containing material inventory counts
 * @param {PlayerState} player - Player state with x, y, width, height properties
 * @param {string|null} selectedMaterialType - Currently selected material to place
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {number} tileSize - Size of each tile in pixels
 * @param {Object} world - World with getTile and setTile methods
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 *
 * @returns {Promise<void>}
 */
export async function handlePlaceBlock(
  shadow,
  key,
  materialsInventory,
  player,
  selectedMaterialType,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
) {
  const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
  const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

  let targetX, targetY;
  let rangeValue = (await localForage.getItem("sprite-garden-range")) || 1;
  // Determine placement position based on key pressed
  switch (key.toLowerCase()) {
    case "k": // Middle button
      await updateRangeValue(shadow);

      return;
    case "u": // Top left
      if (rangeValue === 1) {
        targetX = playerTileX - rangeValue;
        targetY = playerTileY - rangeValue;
      }

      if (rangeValue === 2) {
        targetX = playerTileX - 1;
        targetY = playerTileY - rangeValue;
      }

      if (rangeValue === 3) {
        targetX = playerTileX - 1;
        targetY = playerTileY - rangeValue;
      }

      break;
    case "i": // Top
      if (rangeValue === 1) {
        targetX = playerTileX;
        targetY = playerTileY - rangeValue;
      }

      if (rangeValue === 2) {
        targetX = playerTileX;
        targetY = playerTileY - rangeValue;
      }

      if (rangeValue === 3) {
        targetX = playerTileX;
        targetY = playerTileY - rangeValue;
      }
      break;
    case "o": // Top right
      if (rangeValue === 1) {
        targetX = playerTileX + rangeValue;
        targetY = playerTileY - rangeValue;
      }

      if (rangeValue === 2) {
        targetX = playerTileX + 1;
        targetY = playerTileY - rangeValue;
      }

      if (rangeValue === 3) {
        targetX = playerTileX + 1;
        targetY = playerTileY - rangeValue;
      }
      break;
    case "j": // Left
      if (rangeValue === 1) {
        targetX = playerTileX - rangeValue;
        targetY = playerTileY;
      }

      if (rangeValue === 2) {
        targetX = playerTileX - rangeValue;
        targetY = playerTileY;
      }

      if (rangeValue === 3) {
        targetX = playerTileX - rangeValue;
        targetY = playerTileY;
      }
      break;
    case "l": // Right
      if (rangeValue === 1) {
        targetX = playerTileX + rangeValue;
        targetY = playerTileY;
      }

      if (rangeValue === 2) {
        targetX = playerTileX + rangeValue;
        targetY = playerTileY;
      }

      if (rangeValue === 3) {
        targetX = playerTileX + rangeValue;
        targetY = playerTileY;
      }
      break;
    case "m": // Bottom Left
      if (rangeValue === 1) {
        targetX = playerTileX - rangeValue;
        targetY = playerTileY + rangeValue;
      }

      if (rangeValue === 2) {
        targetX = playerTileX - 1;
        targetY = playerTileY + rangeValue;
      }

      if (rangeValue === 3) {
        targetX = playerTileX - 1;
        targetY = playerTileY + rangeValue;
      }
      break;
    case ",": // Bottom
      if (rangeValue === 1) {
        targetX = playerTileX;
        targetY = playerTileY + rangeValue;
      }

      if (rangeValue === 2) {
        targetX = playerTileX;
        targetY = playerTileY + rangeValue;
      }

      if (rangeValue === 3) {
        targetX = playerTileX;
        targetY = playerTileY + rangeValue;
      }
      break;
    case ".": // Bottom Right
      if (rangeValue === 1) {
        targetX = playerTileX + rangeValue;
        targetY = playerTileY + rangeValue;
      }

      if (rangeValue === 2) {
        targetX = playerTileX + 1;
        targetY = playerTileY + rangeValue;
      }

      if (rangeValue === 3) {
        targetX = playerTileX + 1;
        targetY = playerTileY + rangeValue;
      }
      break;
    default:
      const message = `Invalid placement key: ${key}`;

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

  if (!selectedMaterialType) {
    const message = "No material selected for placement";

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

  if (materialsInventory[selectedMaterialType] <= 0) {
    const message = `No ${stringifyToLowerCase(selectedMaterialType)} available to place`;

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

  // Check if placement position is valid
  if (
    targetX < 0 ||
    targetX >= worldWidth ||
    targetY < 0 ||
    targetY >= worldHeight
  ) {
    const message = `Cannot place block outside world bounds at (${targetX}, ${targetY})`;

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

  // Check if the target position is already occupied by a solid block
  const currentTile = world.getTile(targetX, targetY);

  if (currentTile && currentTile !== tiles.AIR && currentTile.solid) {
    const message = `Cannot place block at (${targetX}, ${targetY}) - position occupied`;

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

  // Get the tile to place
  const tileToPlace = getTileFromMaterial(selectedMaterialType, tiles);

  if (!tileToPlace) {
    const message = `Invalid material type: ${stringifyToLowerCase(selectedMaterialType)}`;

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

  // Place the block
  world.setTile(targetX, targetY, tileToPlace);

  // Remove one unit from materials inventory
  updateState("materialsInventory", (inv) => ({
    ...inv,
    [selectedMaterialType]: inv[selectedMaterialType] - 1,
  }));

  const message = `Placed ${stringifyToLowerCase(selectedMaterialType)} at (${targetX}, ${targetY}), ${materialsInventory[selectedMaterialType] - 1} remaining.`;

  console.log(message);
  shadow.dispatchEvent(
    new CustomEvent("sprite-garden-toast", {
      detail: {
        message,
      },
    }),
  );
}

import localForage from "../../deps/localForage.mjs";

import { getShadowRoot } from "../util/getShadowRoot.mjs";
import { getTileFromMaterial } from "./getTileFromMaterial.mjs";
import { updateRangeValue } from "../update/ui/range.mjs";
import { updateState } from "../state/state.mjs";

export async function handlePlaceBlock({
  key,
  materialsInventory,
  player,
  selectedMaterialType,
  tiles,
  tileSize,
  world,
  worldHeight,
  worldWidth,
}) {
  const playerTileX = Math.floor((player.x + player.width / 2) / tileSize);
  const playerTileY = Math.floor((player.y + player.height / 2) / tileSize);

  let targetX, targetY;

  let rangeValue = (await localForage.getItem("sprite-garden-range")) || 1;

  // Determine placement position based on key pressed
  switch (key.toLowerCase()) {
    case "k": // Middle button
      await updateRangeValue(
        getShadowRoot(globalThis.document, "sprite-garden"),
      );

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
      console.log(`Invalid placement key: ${key}`);
      return;
  }

  if (!selectedMaterialType) {
    console.log("No material selected for placement");

    return;
  }

  if (materialsInventory[selectedMaterialType] <= 0) {
    console.log(`No ${selectedMaterialType} available to place`);

    return;
  }

  // Check if placement position is valid
  if (
    targetX < 0 ||
    targetX >= worldWidth ||
    targetY < 0 ||
    targetY >= worldHeight
  ) {
    console.log(
      `Cannot place block outside world bounds at (${targetX}, ${targetY})`,
    );
    return;
  }

  // Check if the target position is already occupied by a solid block
  const currentTile = world.getTile(targetX, targetY);
  if (currentTile && currentTile !== tiles.AIR && currentTile.solid) {
    console.log(
      `Cannot place block at (${targetX}, ${targetY}) - position occupied`,
    );
    return;
  }

  // Get the tile to place
  const tileToPlace = getTileFromMaterial(selectedMaterialType, tiles);
  if (!tileToPlace) {
    console.log(`Invalid material type: ${selectedMaterialType}`);
    return;
  }

  // Place the block
  world.setTile(targetX, targetY, tileToPlace);

  // Remove one unit from materials inventory
  updateState("materialsInventory", (inv) => ({
    ...inv,
    [selectedMaterialType]: inv[selectedMaterialType] - 1,
  }));

  console.log(
    `Placed ${selectedMaterialType} at (${targetX}, ${targetY}), ${
      materialsInventory[selectedMaterialType] - 1
    } remaining`,
  );
}

import { generateAgaveStructure } from "./agave.mjs";
import { generateBambooStructure } from "./bamboo.mjs";
import { generateBerryBushStructure } from "./berryBush.mjs";
import { generateBirchStructure } from "./birch.mjs";
import { generateCactusStructure } from "./cactus.mjs";
import { generateCarrotStructure } from "./carrot.mjs";
import { generateCornStructure } from "./corn.mjs";
import { generateFernStructure } from "./fern.mjs";
import { generateKelpStructure } from "./kelp.mjs";
import { generateLavenderStructure } from "./lavender.mjs";
import { generateLotusStructure } from "./lotus.mjs";
import { generateMushroomStructure } from "./mushroom.mjs";
import { generatePineTreeStructure } from "./pineTree.mjs";
import { generatePumpkinStructure } from "./pumpkin.mjs";
import { generateRoseStructure } from "./rose.mjs";
import { generateSunflowerStructure } from "./sunflower.mjs";
import { generateTreeStructure } from "./tree.mjs";
import { generateTulipStructure } from "./tulip.mjs";
import { generateWheatStructure } from "./wheat.mjs";
import { generateWillowTreeStructure } from "./willowTree.mjs";

/**
 * @param {any} x
 * @param {any} y
 * @param {any} seedType
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generatePlantStructure(x, y, seedType, progress, tiles) {
  // Ensure progress is between 0 and 1
  progress = Math.max(0, Math.min(1, progress));

  // Different growth patterns for each plant type
  switch (seedType) {
    case "WHEAT":
      return generateWheatStructure(x, y, progress, tiles);
    case "CARROT":
      return generateCarrotStructure(x, y, progress, tiles);
    case "MUSHROOM":
      return generateMushroomStructure(x, y, progress, tiles);
    case "CACTUS":
      return generateCactusStructure(x, y, progress, tiles);
    case "WALNUT":
      return generateTreeStructure(x, y, progress, tiles);
    case "BERRY_BUSH":
      return generateBerryBushStructure(x, y, progress, tiles);
    case "BAMBOO":
      return generateBambooStructure(x, y, progress, tiles);
    case "SUNFLOWER":
      return generateSunflowerStructure(x, y, progress, tiles);
    case "CORN":
      return generateCornStructure(x, y, progress, tiles);
    case "PINE_TREE":
      return generatePineTreeStructure(x, y, progress, tiles);
    case "WILLOW_TREE":
      return generateWillowTreeStructure(x, y, progress, tiles);
    case "FERN":
      return generateFernStructure(x, y, progress, tiles);
    case "TULIP":
      return generateTulipStructure(x, y, progress, tiles);
    case "AGAVE":
      return generateAgaveStructure(x, y, progress, tiles);
    case "LAVENDER":
      return generateLavenderStructure(x, y, progress, tiles);
    case "KELP":
      return generateKelpStructure(x, y, progress, tiles);
    case "ROSE":
      return generateRoseStructure(x, y, progress, tiles);
    case "PUMPKIN":
      return generatePumpkinStructure(x, y, progress, tiles);
    case "LOTUS":
      return generateLotusStructure(x, y, progress, tiles);
    case "BIRCH":
      return generateBirchStructure(x, y, progress, tiles);
    default:
      return [{ x, y, tile: tiles.WHEAT_GROWING }];
  }
}

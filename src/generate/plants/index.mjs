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
import { generateTulipStructure } from "./tulip.mjs";
import { generateWheatStructure } from "./wheat.mjs";
import { generateWillowTreeStructure } from "./willowTree.mjs";

import { blockNames } from "../../state/config/blocks.mjs";

export const generators = {
  [blockNames.AGAVE]: generateAgaveStructure,
  [blockNames.BAMBOO]: generateBambooStructure,
  [blockNames.BERRY_BUSH]: generateBerryBushStructure,
  [blockNames.BIRCH]: generateBirchStructure,
  [blockNames.CACTUS]: generateCactusStructure,
  [blockNames.CARROT]: generateCarrotStructure,
  [blockNames.CORN]: generateCornStructure,
  [blockNames.FERN]: generateFernStructure,
  [blockNames.KELP]: generateKelpStructure,
  [blockNames.LAVENDER]: generateLavenderStructure,
  [blockNames.LOTUS]: generateLotusStructure,
  [blockNames.MUSHROOM]: generateMushroomStructure,
  [blockNames.PINE_TREE]: generatePineTreeStructure,
  [blockNames.PUMPKIN]: generatePumpkinStructure,
  [blockNames.ROSE]: generateRoseStructure,
  [blockNames.SUNFLOWER]: generateSunflowerStructure,
  [blockNames.TULIP]: generateTulipStructure,
  [blockNames.WHEAT]: generateWheatStructure,
  [blockNames.WILLOW_TREE]: generateWillowTreeStructure,
};

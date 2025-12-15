import localForage from "localforage";

import { updateMovementScaleValue } from "../../update/ui/movementScale.mjs";

import { QLearning } from "./QLearning.mjs";
import { Train } from "./Train.mjs";

async function init() {
  const train = new Train();

  // set movement scale to 1
  await localForage.setItem(`sprite-garden-movement-scale`, 0.885);
  await updateMovementScaleValue(train.shadow);

  // Initialize training
  await train.initialize();

  // Expose to console
  if (train.gThis?.spriteGarden) {
    train.gThis.spriteGarden.api = {
      ...train.gThis.spriteGarden.api,
      train,
    };
  }
}

export { init as initTrain, Train, QLearning };

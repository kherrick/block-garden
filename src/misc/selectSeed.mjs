import { stringifyToLowerCase } from "../state/config/tiles.mjs";

/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * Creates a map of seed tile IDs to seed type names.
 *
 * Filters tiles to include only those marked as seeds.
 * Used for quick lookup during planting and inventory management.
 *
 * @param {TileMap} tiles - Map of all tile definitions
 *
 * @returns {{ [id: number]: string }} Map of seed tile ID to seed type name
 */
export function extractSeeds(tiles) {
  return Object.fromEntries(
    Object.entries(tiles)
      .filter(([_, v]) => v.isSeed)
      .map(([k, v]) => [v.id, k]),
  );
}

/**
 * Creates a map from object values to a provided count value.
 *
 * Useful for initializing inventory with uniform counts.
 *
 * @param {Object} obj - Object whose values will become map keys
 * @param {number} [provided=1] - The count value to assign to each key
 *
 * @returns {{ [key: string]: number }} Map of object values to provided count
 */
export function mapValuesToProvided(obj, provided = 1) {
  return Object.fromEntries(Object.values(obj).map((v) => [v, provided]));
}

/**
 * UI event handler for seed selection.
 *
 * Toggles seed selection in the inventory UI and updates game state.
 * Deselects the seed if it's already selected (toggle behavior).
 *
 * @param {ShadowRoot} shadow - The shadow root of Sprite Garden
 * @param {Object} state - Game state object with selectedSeedType Signal
 * @param {Event} event - Click event from the seed button element
 *
 * @returns {void}
 */
export function selectSeed(shadow, state, event) {
  if (!(event.currentTarget instanceof HTMLElement)) {
    throw new Error("currentTarget is not an HTMLElement");
  }

  const [seedType] = Object.keys(event.currentTarget.dataset);

  for (const element of event.currentTarget.parentElement.children) {
    element.classList.remove("selected");
  }

  event.currentTarget.classList.toggle("selected");

  console.log(`Selecting seed: ${seedType}`);

  const currentSelected = state.selectedSeedType.get();

  console.log(`Current selected seed: ${currentSelected}`);

  const newSelected =
    currentSelected === seedType.toUpperCase() ? null : seedType.toUpperCase();

  state.selectedSeedType.set(newSelected);

  let message;
  if (newSelected) {
    message = `New selected seed: ${stringifyToLowerCase(newSelected)}`;
  } else {
    message = "No selected seed.";
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

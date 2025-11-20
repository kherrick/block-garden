/**
 * Farming functions
 *
 * @param {any} tiles
 *
 * @returns {any}
 */
export function extractSeeds(tiles) {
  return Object.fromEntries(
    Object.entries(tiles)
      .filter(([_, v]) => v.isSeed)
      .map(([k, v]) => [v.id, k]),
  );
}

/**
 * @param {any} obj
 * @param {number} [provided=1]
 *
 * @returns {any}
 */
export function mapValuesToProvided(obj, provided = 1) {
  return Object.fromEntries(Object.values(obj).map((v) => [v, provided]));
}

/**
 * @param {any} state
 * @param {any} event
 *
 * @returns {void}
 */
export function selectSeed(state, event) {
  const [seedType] = Object.keys(event.currentTarget.dataset);

  for (const element of event.currentTarget.parentElement.children) {
    element.classList.remove("selected");
  }

  event.currentTarget.classList.toggle("selected");

  console.log(`Selecting seed: ${seedType}`);

  const currentSelected = state.selectedSeedType.get();

  console.log(`Current selected: ${currentSelected}`);

  const newSelected =
    currentSelected === seedType.toUpperCase() ? null : seedType.toUpperCase();

  state.selectedSeedType.set(newSelected);

  console.log(`New selected: ${newSelected}`);
}

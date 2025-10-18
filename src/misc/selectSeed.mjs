// Farming functions
export function extractSeeds(tiles) {
  return Object.fromEntries(
    Object.entries(tiles)
      .filter(([_, v]) => v.isSeed)
      .map(([k, v]) => [v.id, k]),
  );
}

export function mapValuesToProvided(obj, provided = 1) {
  return Object.fromEntries(Object.values(obj).map((v) => [v, provided]));
}

export function selectSeed(doc, state, event) {
  const [seedType] = Object.keys(event.currentTarget.dataset);

  console.log(`Selecting seed: ${seedType}`);

  const currentSelected = state.selectedSeedType.get();
  console.log(`Current selected: ${currentSelected}`);

  const newSelected =
    currentSelected === seedType.toUpperCase() ? null : seedType.toUpperCase();

  state.selectedSeedType.set(newSelected);

  console.log(`New selected: ${newSelected}`);
}

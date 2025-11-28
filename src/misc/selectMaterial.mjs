/**
 * UI event handler for material selection.
 *
 * Toggles material selection in the inventory UI and updates game state.
 * Deselects the material if it's already selected (toggle behavior).
 *
 * @param {Object} state - Game state object with selectedMaterialType Signal
 * @param {Event} event - Click event from the material button element
 *
 * @returns {void}
 */
export function selectMaterial(state, event) {
  if (!(event.currentTarget instanceof HTMLElement)) {
    throw new Error("currentTarget is not an HTMLElement");
  }

  const [materialType] = Object.keys(event.currentTarget.dataset);

  for (const el of event.currentTarget.parentElement.children) {
    el.classList.remove("selected");
  }

  event.currentTarget.classList.toggle("selected");

  console.log(`Selecting material: ${materialType}`);

  const currentSelected = state.selectedMaterialType.get();

  console.log(`Current selected material: ${currentSelected}`);

  const newSelected =
    currentSelected === materialType.toUpperCase()
      ? null
      : materialType.toUpperCase();

  state.selectedMaterialType.set(newSelected);

  console.log(`New selected material: ${newSelected}`);
}

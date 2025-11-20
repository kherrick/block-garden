/**
 * Material selection function
 *
 * @param {any} doc
 * @param {any} state
 * @param {any} event
 *
 * @returns {void}
 */
export function selectMaterial(doc, state, event) {
  const [materialType] = Object.keys(event.currentTarget.dataset);

  for (const element of event.currentTarget.parentElement.children) {
    element.classList.remove("selected");
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

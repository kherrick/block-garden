/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/**
 * Update inventory display
 *
 * @param {ShadowRoot} shadow
 * @param {Signal.State} materialsInventory
 * @param {Signal.State} seedInventory
 *
 * @returns {void}
 */
export function updateInventoryUI(shadow, materialsInventory, seedInventory) {
  // Update seed counts
  Object.keys(seedInventory).forEach((seedKey) => {
    const seedType = seedKey.toLowerCase();
    const el = shadow?.getElementById(`${seedType}Count`);

    try {
      el.textContent = seedInventory[seedKey];
    } catch (e) {
      console.error(e);
    }
  });

  // Update material counts
  Object.keys(materialsInventory).forEach((materialKey) => {
    const materialType = materialKey.toLowerCase();
    const el = shadow?.getElementById(`${materialType}Count`);

    if (!el) {
      return;
    }

    try {
      el.textContent = materialsInventory[materialKey];
    } catch (e) {
      console.error(e);
    }
  });
}

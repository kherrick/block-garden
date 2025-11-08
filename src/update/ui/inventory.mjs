// Update inventory display
export function updateInventoryUI(shadow, materialsInventory, seedInventory) {
  // Update seed counts
  Object.keys(seedInventory).forEach((seedKey) => {
    const seedType = seedKey.toLowerCase();
    const el = shadow?.getElementById(`${seedType}Count`);

    try {
      el.textContent = seedInventory[seedType.toUpperCase()];
    } catch (e) {
      console.error;
    }
  });

  // Update material counts
  Object.keys(materialsInventory).forEach((materialKey) => {
    const materialType = materialKey.toLowerCase();
    const el = shadow?.getElementById(`${materialType}Count`);

    try {
      el.textContent = materialsInventory[materialType.toUpperCase()];
    } catch (e) {
      console.error;
    }
  });
}

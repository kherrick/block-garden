// Update inventory display
export function updateInventoryDisplay(doc, state) {
  const seedTypes = ["wheat", "carrot", "mushroom", "cactus", "walnut"];
  const materialTypes = [
    "dirt",
    "stone",
    "wood",
    "sand",
    "clay",
    "coal",
    "iron",
    "gold",
  ];

  const seedInventory = state.seedInventory?.get();
  const materialsInventory = state.materialsInventory?.get();
  const selectedSeed = state.selectedSeedType?.get();
  const selectedMaterial = state.selectedMaterialType?.get();

  // Update seed counts
  seedTypes.forEach((seedType) => {
    const el = doc?.getElementById(`${seedType}Count`);
    try {
      if (el) {
        el.textContent = seedInventory[seedType.toUpperCase()];
      }
    } catch (e) {}
  });

  // Update material counts
  materialTypes.forEach((materialType) => {
    const el = doc?.getElementById(`${materialType}Count`);
    try {
      if (el) {
        el.textContent = materialsInventory[materialType.toUpperCase()];
      }
    } catch (e) {}
  });

  // Update selected seed display
  const selectedSeedEl = doc?.getElementById("selectedSeed");
  if (selectedSeedEl) {
    selectedSeedEl.textContent = selectedSeed || "None";
  }

  // Update selected material display
  const selectedMaterialEl = doc?.getElementById("selectedMaterial");
  if (selectedMaterialEl) {
    selectedMaterialEl.textContent = selectedMaterial || "None";
  }

  // Update seed button styles
  const seedButtons = doc?.querySelectorAll(".seed-btn");
  if (seedButtons) {
    seedButtons.forEach((btn) => {
      btn.classList.remove("selected");
    });
  }

  if (selectedSeed) {
    const seedTypeMap = {
      WHEAT: 0,
      CARROT: 1,
      MUSHROOM: 2,
      CACTUS: 3,
      WALNUT: 4,
    };
    const buttonIndex = seedTypeMap[selectedSeed];
    if (buttonIndex !== undefined && seedButtons) {
      seedButtons[buttonIndex].classList.add("selected");
    }
  }

  // Update material button styles
  const materialButtons = doc?.querySelectorAll(".material-btn");
  if (materialButtons) {
    materialButtons.forEach((btn) => {
      btn.classList.remove("selected");
    });
  }

  if (selectedMaterial) {
    const materialTypeMap = {
      DIRT: 0,
      STONE: 1,
      WOOD: 2,
      SAND: 3,
      CLAY: 4,
      COAL: 5,
      IRON: 6,
      GOLD: 7,
    };
    const buttonIndex = materialTypeMap[selectedMaterial];
    if (buttonIndex !== undefined && materialButtons) {
      materialButtons[buttonIndex].classList.add("selected");
    }
  }

  // Update total seed count
  if (seedInventory) {
    const totalSeeds = Object.values(seedInventory).reduce(
      (sum, count) => sum + count,
      0,
    );

    const seedCountEl = doc?.getElementById("seedCount");
    if (seedCountEl) {
      seedCountEl.textContent = totalSeeds;
    }
  }
}

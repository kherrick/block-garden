import { BlockGarden } from "./BlockGarden.mjs";

describe("BlockGarden API", () => {
  let api;
  let lastSetBlockArgs;

  beforeEach(() => {
    lastSetBlockArgs = null;

    // Mock global blockGarden object
    globalThis.blockGarden = {
      config: {
        blocks: [
          { name: "Air", id: 0 },
          { name: "Dirt", id: 2 },
          { name: "Grass", id: 1 },
        ],
      },
      state: {
        world: {
          getBlock: () => 0,
          setBlock: (x, y, z, type, isPlayerChange) => {
            lastSetBlockArgs = [x, y, z, type, isPlayerChange];
          },
        },
      },
    };

    // Add getByName to blocks mock
    globalThis.blockGarden.config.blocks.getByName = (name) =>
      globalThis.blockGarden.config.blocks.find((b) => b.name === name);

    api = new BlockGarden();
  });

  test("should return correct block ID by name", () => {
    expect(api.getBlockIdByName("Dirt")).toBe(2);
    expect(api.getBlockIdByName("Air")).toBe(0);
    expect(api.getBlockIdByName("Grass")).toBe(1);
    expect(api.getBlockIdByName("NonExistent")).toBe(-1);
  });

  test("should use block ID instead of index in setBlock and mark as player change", () => {
    api.setBlock(1, 2, 3, 2); // Setting Dirt (ID 2)
    // Verify [x, y, z, type, isPlayerChange]
    expect(lastSetBlockArgs).toEqual([1, 2, 3, 2, true]);
  });

  test("should trigger onBlockBreak callback when block is set to Air", () => {
    let calledWith = null;
    const callback = (x, y, z) => {
      calledWith = [x, y, z];
    };
    api.onBlockBreak(callback);

    api.setBlock(10, 20, 30, 0); // Setting to Air (0)
    expect(calledWith).toEqual([10, 20, 30]);
  });
});

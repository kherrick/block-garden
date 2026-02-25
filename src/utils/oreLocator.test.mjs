import { scanForOres, formatOreScanResult } from "./oreLocator.mjs";

/**
 * Create a mock world with configurable block data.
 *
 * @param {Map<string, number>} blockMap - "x,y,z" -> blockId
 */
function createMockWorld(blockMap) {
  return {
    getBlock(x, y, z) {
      return blockMap.get(`${x},${y},${z}`) || 0;
    },
  };
}

// Get ore block IDs dynamically
const { getBlockIdByName, blockNames } =
  await import("../core/world/config/blocks.mjs");

const COAL_ID = getBlockIdByName(blockNames.COAL);
const IRON_ID = getBlockIdByName(blockNames.IRON);
const GOLD_ID = getBlockIdByName(blockNames.GOLD);
const COPPER_ID = getBlockIdByName(blockNames.COPPER);
const STONE_ID = getBlockIdByName(blockNames.STONE);

describe("scanForOres", () => {
  test("returns empty map when no ores in range", () => {
    const world = createMockWorld(new Map());
    const result = scanForOres(world, 0, 50, 0, 5);

    expect(result.size).toBe(0);
  });

  test("counts ores by type within radius", () => {
    const blocks = new Map();
    blocks.set("1,50,1", COAL_ID);
    blocks.set("2,50,1", COAL_ID);
    blocks.set("3,50,1", COAL_ID);
    blocks.set("1,51,1", IRON_ID);
    blocks.set("2,51,1", GOLD_ID);

    const world = createMockWorld(blocks);
    const result = scanForOres(world, 2, 50, 1, 5);

    expect(result.get("Coal")).toBe(3);
    expect(result.get("Iron")).toBe(1);
    expect(result.get("Gold")).toBe(1);
  });

  test("ignores non-ore blocks", () => {
    const blocks = new Map();
    blocks.set("1,50,1", STONE_ID);
    blocks.set("2,50,1", COAL_ID);

    const world = createMockWorld(blocks);
    const result = scanForOres(world, 1, 50, 1, 5);

    expect(result.has("Stone")).toBe(false);
    expect(result.get("Coal")).toBe(1);
  });

  test("excludes ores outside radius", () => {
    const blocks = new Map();
    blocks.set("0,50,0", COAL_ID); // Within radius
    blocks.set("100,50,100", IRON_ID); // Far outside radius

    const world = createMockWorld(blocks);
    const result = scanForOres(world, 0, 50, 0, 5);

    expect(result.get("Coal")).toBe(1);
    expect(result.has("Iron")).toBe(false);
  });

  test("clamps Y scan to valid range", () => {
    const blocks = new Map();
    blocks.set("0,0,0", COAL_ID);
    blocks.set("0,127,0", IRON_ID);

    const world = createMockWorld(blocks);
    // Player near bottom — should not scan below 0
    const result = scanForOres(world, 0, 2, 0, 5);

    expect(result.get("Coal")).toBe(1);
  });
});

describe("formatOreScanResult", () => {
  test("formats empty results", () => {
    const result = formatOreScanResult(new Map(), 32);

    expect(result).toBe("🧭 No ores found within 32 blocks.");
  });

  test("formats ore counts sorted by count descending", () => {
    const counts = new Map();
    counts.set("Coal", 47);
    counts.set("Iron", 12);
    counts.set("Gold", 3);

    const result = formatOreScanResult(counts, 32);

    expect(result).toContain("🧭 Ore Scan (32 block radius):");
    expect(result).toContain("Coal: 47");
    expect(result).toContain("Iron: 12");
    expect(result).toContain("Gold: 3");

    // Check sorting: Coal (47) should come before Iron (12)
    const coalIdx = result.indexOf("Coal: 47");
    const ironIdx = result.indexOf("Iron: 12");
    const goldIdx = result.indexOf("Gold: 3");

    expect(coalIdx).toBeLessThan(ironIdx);
    expect(ironIdx).toBeLessThan(goldIdx);
  });
});

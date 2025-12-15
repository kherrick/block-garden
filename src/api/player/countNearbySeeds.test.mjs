/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { countNearbySeeds } from "./countNearbySeeds.mjs";

describe("countNearbySeeds", () => {
  let world;

  beforeEach(() => {
    // A tile can be a seed if it has `isSeed: true`
    const mockTiles = {
      "10,10": { isSeed: true },
      "11,11": { isSeed: true },
      "13,13": { isSeed: true }, // within default radius of 10,10
      "14,14": { isSeed: false }, // not a seed
      "15,15": { isSeed: true }, // outside default radius
      "5,5": { isSeed: true },
    };

    world = {
      getTile: jest.fn((x, y) => {
        return mockTiles[`${x},${y}`] || null;
      }),
    };
  });

  it("should return 0 if no seeds are nearby", () => {
    const count = countNearbySeeds(world, 0, 0);
    expect(count).toBe(0);
  });

  it("should count seeds within the default radius of 3", () => {
    const count = countNearbySeeds(world, 10, 10);
    // It should find seeds at 10,10 and 11,11, and 13,13
    expect(count).toBe(3);
  });

  it("should count seeds within a custom radius", () => {
    // With a larger radius, it should also find the seed at 15,15 and 5,5
    const count = countNearbySeeds(world, 10, 10, 5);
    expect(count).toBe(5);
  });

  it("should not count tiles that are not seeds", () => {
    // The tile at 14,14 is not a seed
    const count = countNearbySeeds(world, 12, 12, 2);
    // should find 10,10, 11,11 and 13,13 but not 14,14
    expect(count).toBe(3);
  });

  it("should handle coordinates at the edge of the map where getTile returns null", () => {
    const count = countNearbySeeds(world, 0, 0, 5);
    // It should not throw an error and just count the seeds it finds.
    // In this case, there is one seed at (5,5) near 0,0.
    expect(count).toBe(1);
  });

  it("should count only one seed when player is on top of it", () => {
    const count = countNearbySeeds(world, 5, 5, 0);
    expect(count).toBe(1);
  });
});

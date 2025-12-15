/**
 * @jest-environment jsdom
 */
import { countNearbyPlanted } from "./countNearbyPlanted.mjs";

describe("countNearbyPlanted", () => {
  const plantStructures = {
    "10,10": { type: "tree" },
    "12,12": { type: "flower" },
    "15,15": { type: "bush" },
    "20,20": { type: "tree" },
    "-5,-5": { type: "flower" },
  };

  test("should count plants within the specified radius", () => {
    // Player at (11, 11), radius 2
    // Should count (10,10) and (12,12)
    expect(countNearbyPlanted(plantStructures, 11, 11, 2)).toBe(2);
  });

  test("should use a default radius of 3", () => {
    // Player at (13, 13), default radius 3
    // Should count (10,10), (12,12), and (15,15)
    expect(countNearbyPlanted(plantStructures, 13, 13)).toBe(3);
  });

  test("should return 0 if no plants are within the radius", () => {
    expect(countNearbyPlanted(plantStructures, 100, 100, 5)).toBe(0);
  });

  test("should return 0 if the plantStructures object is empty", () => {
    expect(countNearbyPlanted({}, 10, 10, 5)).toBe(0);
  });

  test("should correctly count plants at the exact edge of the radius", () => {
    // Player at (13, 13), radius 2. Plant at (15,15) is at the edge.
    expect(countNearbyPlanted(plantStructures, 13, 13, 2)).toBe(2);
  });

  test("should work with negative coordinates", () => {
    // Player at (-6, -6), radius 2
    // Should count (-5, -5)
    expect(countNearbyPlanted(plantStructures, -6, -6, 2)).toBe(1);
  });

  test("should handle a radius of 0", () => {
    // Player at (10, 10), radius 0. Should only count the plant at (10, 10)
    expect(countNearbyPlanted(plantStructures, 10, 10, 0)).toBe(1);
    // Player at (11, 11), radius 0. No plant exactly at this spot.
    expect(countNearbyPlanted(plantStructures, 11, 11, 0)).toBe(0);
  });
});

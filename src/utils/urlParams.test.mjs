import { describe, expect, it } from "@jest/globals";
import { getGameSaveUrlParam } from "./urlParams.mjs";

describe("urlParams utility", () => {
  it("should return the gameSave parameter from the URL", () => {
    const mockGlobal = {
      location: {
        search: "?gameSave=https://example.com/save.json",
      },
      URLSearchParams: globalThis.URLSearchParams,
    };

    expect(getGameSaveUrlParam(mockGlobal)).toBe(
      "https://example.com/save.json",
    );
  });

  it("should return null if gameSave parameter is missing", () => {
    const mockGlobal = {
      location: {
        search: "?otherParam=abc",
      },
      URLSearchParams: globalThis.URLSearchParams,
    };

    expect(getGameSaveUrlParam(mockGlobal)).toBeNull();
  });

  it("should return null if there are no search parameters", () => {
    const mockGlobal = {
      location: {
        search: "",
      },
      URLSearchParams: globalThis.URLSearchParams,
    };

    expect(getGameSaveUrlParam(mockGlobal)).toBeNull();
  });

  it("should handle invalid URL gracefully", () => {
    const mockGlobal = {
      location: {
        search: "?invalid",
      },
      URLSearchParams: class {
        constructor() {
          throw new Error("Invalid URL");
        }
      },
    };

    expect(getGameSaveUrlParam(mockGlobal)).toBeNull();
  });
});

import { describe, expect, it, jest } from "@jest/globals";
import {
  getGameSaveUrlParam,
  getNumberParam,
  getPlayerParamsFromUrl,
  clearUrlParams,
} from "./urlParams.mjs";

describe("urlParams utility", () => {
  describe("getGameSaveUrlParam", () => {
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

  describe("getNumberParam", () => {
    it("should return number for valid numeric parameter", () => {
      const searchParams = new URLSearchParams("x=123.5");

      expect(getNumberParam(searchParams, "x")).toBe(123.5);
    });

    it("should return undefined for missing parameter", () => {
      const searchParams = new URLSearchParams("y=456");

      expect(getNumberParam(searchParams, "x")).toBeUndefined();
    });

    it("should return undefined for empty parameter", () => {
      const searchParams = new URLSearchParams("x=");

      expect(getNumberParam(searchParams, "x")).toBeUndefined();
    });

    it("should return undefined for non-numeric parameter", () => {
      const searchParams = new URLSearchParams("x=abc");

      expect(getNumberParam(searchParams, "x")).toBeUndefined();
    });

    it("should return undefined for whitespace parameter", () => {
      const searchParams = new URLSearchParams("x=  ");

      expect(getNumberParam(searchParams, "x")).toBeUndefined();
    });

    it("should handle negative numbers", () => {
      const searchParams = new URLSearchParams("x=-42");

      expect(getNumberParam(searchParams, "x")).toBe(-42);
    });

    it("should handle zero", () => {
      const searchParams = new URLSearchParams("x=0");

      expect(getNumberParam(searchParams, "x")).toBe(0);
    });

    it("should handle scientific notation", () => {
      const searchParams = new URLSearchParams("x=1e5");

      expect(getNumberParam(searchParams, "x")).toBe(1e5);
    });

    it("should return undefined for Infinity", () => {
      const searchParams = new URLSearchParams("x=Infinity");

      expect(getNumberParam(searchParams, "x")).toBeUndefined();
    });

    it("should return undefined for NaN", () => {
      const searchParams = new URLSearchParams("x=NaN");

      expect(getNumberParam(searchParams, "x")).toBeUndefined();
    });
  });

  describe("getPlayerParamsFromUrl", () => {
    it("should return empty object when location.search is not available", () => {
      const result = getPlayerParamsFromUrl({});

      expect(result).toEqual({});
    });
  });

  describe("clearUrlParams", () => {
    it("should not fail when called", () => {
      const mockGlobal = {
        location: {
          href: "https://example.com/?gameSave=test",
        },
        URL: globalThis.URL,
        URLSearchParams: globalThis.URLSearchParams,
        history: {
          replaceState: jest.fn(),
        },
      };

      expect(() => clearUrlParams(mockGlobal)).not.toThrow();
    });

    it("should handle invalid URL gracefully", () => {
      const mockGlobal = {
        location: {
          href: "invalid-url",
        },
        URL: class {
          constructor() {
            throw new Error("Invalid URL");
          }
        },
      };

      expect(() => clearUrlParams(mockGlobal)).not.toThrow();
    });
  });
});

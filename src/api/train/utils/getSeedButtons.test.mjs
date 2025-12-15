import { describe, it, expect, jest } from "@jest/globals";
import { getSeedButtons } from "./getSeedButtons.mjs";

describe("getSeedButtons", () => {
  it("should return an array of button elements when found", () => {
    const mockButton1 = document.createElement("button");
    const mockButton2 = document.createElement("button");
    const mockShadowRoot = {
      querySelectorAll: jest.fn().mockReturnValue([mockButton1, mockButton2]),
    };

    const buttons = getSeedButtons(mockShadowRoot);

    expect(mockShadowRoot.querySelectorAll).toHaveBeenCalledWith(
      "button.seed-btn",
    );
    expect(buttons).toHaveLength(2);
    expect(buttons).toEqual([mockButton1, mockButton2]);
  });

  it("should return an empty array if no buttons are found", () => {
    const mockShadowRoot = {
      querySelectorAll: jest.fn().mockReturnValue([]),
    };

    const buttons = getSeedButtons(mockShadowRoot);

    expect(buttons).toHaveLength(0);
  });

  it("should return an empty array if shadowRoot is null or undefined", () => {
    expect(getSeedButtons(null)).toEqual([]);
    expect(getSeedButtons(undefined)).toEqual([]);
  });

  it("should return an empty array if querySelectorAll throws an error", () => {
    const mockShadowRoot = {
      querySelectorAll: jest.fn().mockImplementation(() => {
        throw new Error("Test error");
      }),
    };
    expect(getSeedButtons(mockShadowRoot)).toEqual([]);
  });
});

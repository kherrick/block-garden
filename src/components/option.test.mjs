/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { optionTagName } from "./option.mjs";

describe("block-garden-option", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("creates element with correct tag name", () => {
    const el = document.createElement(optionTagName);
    document.body.appendChild(el);

    expect(el.tagName).toBe("BLOCK-GARDEN-OPTION");
    expect(el.localName).toBe("block-garden-option");
  });

  test("value getter returns attribute value", () => {
    const el = document.createElement(optionTagName);
    el.setAttribute("value", "400");
    document.body.appendChild(el);

    expect(el.value).toBe("400");
  });

  test("value getter returns empty string when no value attribute", () => {
    const el = document.createElement(optionTagName);
    document.body.appendChild(el);

    expect(el.value).toBe("");
  });

  test("value setter updates attribute", () => {
    const el = document.createElement(optionTagName);
    document.body.appendChild(el);

    el.value = "800";
    expect(el.getAttribute("value")).toBe("800");
    expect(el.value).toBe("800");
  });

  test("observedAttributes includes value", () => {
    const el = document.createElement(optionTagName);
    document.body.appendChild(el);

    expect(el.constructor.observedAttributes).toEqual(["value"]);
  });

  test("value setter works with empty string", () => {
    const el = document.createElement(optionTagName);
    document.body.appendChild(el);

    el.value = "";
    expect(el.getAttribute("value")).toBe("");
    expect(el.value).toBe("");
  });

  test("value attribute change updates value property", () => {
    const el = document.createElement(optionTagName);
    document.body.appendChild(el);

    el.setAttribute("value", "Fullscreen");
    expect(el.value).toBe("Fullscreen");

    el.setAttribute("value", "800");
    expect(el.value).toBe("800");
  });
});

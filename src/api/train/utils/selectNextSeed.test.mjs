import { jest } from "@jest/globals";

const mockGetSeedButtons = jest.fn();

// Use unstable_mockModule for robust ESM mocking. This must be done before the module under test is imported.
jest.unstable_mockModule("./getSeedButtons.mjs", () => ({
  getSeedButtons: mockGetSeedButtons,
}));

// Dynamically import the module under test AFTER the mock has been configured.
// Using top-level await is the modern standard for this pattern.
const { selectNextSeed } = await import("./selectNextSeed.mjs");

/**
 * Creates a mock HTMLButtonElement with a click spy.
 * @param {string} textContent - The text content for the button.
 * @param {boolean} isSelected - Whether the button is initially selected.
 * @returns {HTMLButtonElement} A mock button element.
 */
const createMockButton = (textContent, isSelected = false) => {
  const button = document.createElement("button");
  button.textContent = textContent;
  button.click = jest.fn();
  if (isSelected) {
    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");
  } else {
    button.setAttribute("aria-pressed", "false");
  }
  return button;
};

describe("selectNextSeed", () => {
  let shadowRoot;

  beforeEach(() => {
    jest.clearAllMocks();
    shadowRoot = document.createElement("div").attachShadow({ mode: "open" });
  });

  it("should do nothing if no seed buttons are found", () => {
    mockGetSeedButtons.mockReturnValue([]);
    selectNextSeed(shadowRoot);
    expect(mockGetSeedButtons).toHaveBeenCalledWith(shadowRoot);
  });

  it("should do nothing if no seeds have a count greater than 0", () => {
    const buttons = [
      createMockButton("Seed A (0)"),
      createMockButton("Seed B (0)"),
    ];
    mockGetSeedButtons.mockReturnValue(buttons);

    selectNextSeed(shadowRoot);

    expect(buttons[0].click).not.toHaveBeenCalled();
    expect(buttons[1].click).not.toHaveBeenCalled();
    expect(buttons[0].classList.contains("selected")).toBe(false);
    expect(buttons[1].classList.contains("selected")).toBe(false);
  });

  it("should select the first available seed if none are currently selected", () => {
    const buttons = [
      createMockButton("Seed A (0)"),
      createMockButton("Seed B (5)"),
      createMockButton("Seed C (3)"),
    ];
    mockGetSeedButtons.mockReturnValue(buttons);

    selectNextSeed(shadowRoot);

    expect(buttons[1].classList.contains("selected")).toBe(true);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1].click).toHaveBeenCalledTimes(1);
    expect(buttons[0].click).not.toHaveBeenCalled();
    expect(buttons[2].click).not.toHaveBeenCalled();
  });

  it("should select the next available seed after the current one", () => {
    const buttons = [
      createMockButton("Seed A (10)", true), // currently selected
      createMockButton("Seed B (0)"),
      createMockButton("Seed C (5)"), // next available
    ];
    mockGetSeedButtons.mockReturnValue(buttons);

    selectNextSeed(shadowRoot);

    // Previous button should be deselected
    expect(buttons[0].classList.contains("selected")).toBe(false);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");

    // Next available button should be selected and clicked
    expect(buttons[2].classList.contains("selected")).toBe(true);
    expect(buttons[2].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[2].click).toHaveBeenCalledTimes(1);
  });

  it("should wrap around to the beginning if the last seed is selected", () => {
    const buttons = [
      createMockButton("Seed A (2)"), // next available
      createMockButton("Seed B (0)"),
      createMockButton("Seed C (8)", true), // currently selected
    ];
    mockGetSeedButtons.mockReturnValue(buttons);

    selectNextSeed(shadowRoot);

    // Previous button should be deselected
    expect(buttons[2].classList.contains("selected")).toBe(false);
    expect(buttons[2].getAttribute("aria-pressed")).toBe("false");

    // First button should be selected and clicked
    expect(buttons[0].classList.contains("selected")).toBe(true);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0].click).toHaveBeenCalledTimes(1);
  });

  it("should re-select the current seed if it's the only one available", () => {
    const buttons = [
      createMockButton("Seed A (10)", true), // currently selected and only one available
      createMockButton("Seed B (0)"),
      createMockButton("Seed C (0)"),
    ];
    mockGetSeedButtons.mockReturnValue(buttons);

    selectNextSeed(shadowRoot);

    // The same button should be "re-selected" and clicked
    expect(buttons[0].classList.contains("selected")).toBe(true);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0].click).toHaveBeenCalledTimes(1);

    // Other buttons remain deselected
    expect(buttons[1].classList.contains("selected")).toBe(false);
    expect(buttons[2].classList.contains("selected")).toBe(false);
  });

  it("should correctly parse counts from complex text content", () => {
    const buttons = [
      createMockButton("Selected Seed (0)", true),
      createMockButton("Next Seed (Count: 5)"),
    ];
    mockGetSeedButtons.mockReturnValue(buttons);

    selectNextSeed(shadowRoot);

    expect(buttons[1].click).toHaveBeenCalledTimes(1);
    expect(buttons[1].classList.contains("selected")).toBe(true);
  });

  it("should handle a button with a count but no number as a count of 0", () => {
    const buttons = [
      createMockButton("Seed A (0)", true),
      createMockButton("Seed B ()"),
      createMockButton("Seed C (3)"),
    ];
    mockGetSeedButtons.mockReturnValue(buttons);

    selectNextSeed(shadowRoot);

    expect(buttons[0].click).not.toHaveBeenCalled();
    expect(buttons[1].click).not.toHaveBeenCalled();
    expect(buttons[2].click).toHaveBeenCalledTimes(1);
    expect(buttons[2].classList.contains("selected")).toBe(true);
  });
});

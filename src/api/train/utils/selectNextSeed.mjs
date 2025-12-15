import { getSeedButtons } from "./getSeedButtons.mjs";

/**
 * Finds and clicks the next available seed button with a count greater than zero.
 *
 * Iterates through seed buttons, starting from the currently selected one,
 * and programmatically clicks the next button that represents an available seed.
 *
 * @param {ShadowRoot} shadow - The shadow root containing the seed buttons.
 *
 * @returns {void}
 */
export function selectNextSeed(shadow) {
  const buttons = getSeedButtons(shadow);
  if (!buttons.length) {
    return;
  }

  let current = buttons.findIndex(
    (b) =>
      b.classList.contains("selected") ||
      b.getAttribute("aria-pressed") === "true",
  );

  if (current < 0) {
    current = -1;
  }

  let nextButton = null;

  // Find the next available button, checking all buttons in a circular fashion.
  for (let i = 0; i < buttons.length; i++) {
    const nextIndex = (current + 1 + i) % buttons.length;
    const button = buttons[nextIndex];
    const text = button.textContent || "";
    const count = parseInt(text.match(/\d+/)?.[0] || "0");

    if (count > 0) {
      nextButton = button;

      break;
    }
  }

  // If a valid next button was found, update the state.
  if (nextButton) {
    buttons.forEach((btn) => {
      const isNext = btn === nextButton;
      btn.classList.toggle("selected", isNext);
      btn.setAttribute("aria-pressed", isNext ? "true" : "false");
    });

    nextButton.click();
  }
}

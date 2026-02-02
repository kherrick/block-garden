/**
 * Update the flight toggle when flying or not
 *
 * @param {HTMLElement} flightToggle
 * @param {boolean} isFlying
 *
 * @returns {void}
 */
export function updateFlightToggleButton(flightToggle, isFlying) {
  flightToggle.style.color = "var(--bg-color-white)";

  if (isFlying) {
    flightToggle.textContent = "🪽 Disable Flight";
    flightToggle.style.backgroundColor = "var(--bg-color-red-500)";

    return;
  }

  flightToggle.textContent = "🪽 Enable Flight";
  flightToggle.style.backgroundColor = "var(--bg-color-green-500)";
}

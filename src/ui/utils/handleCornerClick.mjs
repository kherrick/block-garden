/**
 * Handles clicks on UI corner headings to toggle their containers.
 *
 * @param {Event} e
 *
 * @returns {void}
 */
export function handleCornerClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const heading = e.currentTarget;
  if (heading instanceof HTMLDivElement) {
    const cornerContainer = heading.nextElementSibling;
    if (cornerContainer instanceof Element) {
      const isCornerContainerHidden = cornerContainer?.getAttribute("hidden");
      if (isCornerContainerHidden && isCornerContainerHidden !== null) {
        cornerContainer.removeAttribute("hidden");

        // Focus the first focusable element in the container
        const focusableElements = cornerContainer.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        );

        if (focusableElements.length > 0) {
          /** @type {HTMLElement} */ (focusableElements[0]).focus();
        }

        return;
      }

      cornerContainer?.setAttribute("hidden", "hidden");

      // Check if any other corners are still open
      const shadow = cornerContainer?.getRootNode();
      if (shadow instanceof ShadowRoot) {
        const otherOpenCorners = shadow.querySelectorAll(
          ".ui-grid__corner--container:not([hidden])",
        );

        const materialBar = shadow.getElementById("materialBar");
        const isMaterialBarVisible =
          materialBar && !materialBar.hasAttribute("hidden");

        if (otherOpenCorners.length === 0 && !isMaterialBarVisible) {
          // Return focus to canvas
          const canvas = shadow.getElementById("canvas");
          if (canvas instanceof HTMLCanvasElement) {
            canvas.focus();
          }
        }
      }
    }
  }
}

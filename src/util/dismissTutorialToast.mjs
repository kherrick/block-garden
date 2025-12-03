import { tutorialListener, hasDismissedTutorial } from "../state/state.mjs";

/**
 * Dismiss tutorial toast and cleanup event listener
 *
 * @param {ShadowRoot} shadow
 */
export const dismissTutorialToast = (shadow) => {
  const container = shadow.getElementById("toastContainer");
  if (container) {
    const toasts = container.querySelectorAll(".toast");

    toasts.forEach((toast) => {
      toast.classList.add("toast--slide-out");

      setTimeout(() => toast.remove(), 300);
    });
  }

  shadow.removeEventListener("keydown", tutorialListener.get());

  hasDismissedTutorial.set(true);
};

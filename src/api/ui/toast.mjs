/**
 * Toast for Block Garden
 *
 * @typedef {Object} ToastConfig
 *
 * @property {number} [duration=3000] - Duration in milliseconds before auto-close (0 = manual close only)
 * @property {boolean} [manualClose=false] - Show close button for manual dismissal
 * @property {boolean} [stack=true] - Stack toasts or replace with fade
 * @property {number} [bottomOffset=1] - Distance from bottom in rem
 */

/**
 * Removes toast with animation
 *
 * @param {HTMLElement} toast - Toast element to remove
 *
 * @returns {void}
 */
function removeToast(toast) {
  if (!toast || !toast.parentElement) return;

  toast.classList.add("toast--slide-out");

  setTimeout(() => toast.remove(), 300);
}

/**
 * Shows toast
 *
 * @param {ShadowRoot} shadow - Shadow root element
 * @param {string} message - Message to display
 * @param {ToastConfig & { useSingle?: boolean }} [config={}] - Toast configuration
 *
 * @returns {void}
 */
export function showToast(shadow, message, config = {}) {
  const {
    duration = 3000,
    manualClose = false,
    stack = false,
    bottomOffset = 1,
    useSingle = true,
  } = config;

  const container = shadow.getElementById("toastContainer");

  if (!container) {
    console.warn("Toast container not found");

    return;
  }

  // Update container bottom position
  container.style.bottom = `${bottomOffset}rem`;

  let toast;

  if (useSingle) {
    // Try to find existing toast
    toast = container.querySelector(".toast");

    if (toast) {
      // Update message instead of creating a new toast
      const content = toast.querySelector(".toast__content");
      if (content) {
        content.textContent = message;
      }

      // Reset auto-remove timer
      if (duration > 0) {
        /** @type {any} */
        const toastAny = toast;
        clearTimeout(toastAny.autoRemoveTimer);

        toastAny.autoRemoveTimer = setTimeout(
          () => removeToast(toast),
          duration,
        );
      }

      return;
    }
  }

  // Handle non-stacking behavior
  if (!stack && !useSingle) {
    const existingToasts = container.querySelectorAll(".toast");
    existingToasts.forEach((toast) => {
      toast.classList.add("toast--fade-out");

      setTimeout(() => toast.remove(), 300);
    });
  }

  // Create toast element
  toast = shadow.ownerDocument.createElement("div");
  toast.className = "toast";

  const content = shadow.ownerDocument.createElement("div");
  content.className = "toast__content";
  content.textContent = message;

  toast.appendChild(content);

  // Add close button if manual close is enabled
  if (manualClose) {
    const closeBtn = shadow.ownerDocument.createElement("button");
    closeBtn.className = "toast__close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => removeToast(toast));

    toast.appendChild(closeBtn);
  }

  // Add to container
  container.appendChild(toast);

  // Auto-remove after duration
  if (duration > 0) {
    /** @type {any} */
    const toastAny = toast;
    toastAny.autoRemoveTimer = setTimeout(() => removeToast(toast), duration);
  }
}

import { Workbox } from "workbox-window";

globalThis.isLocalhost = globalThis.location.host === "localhost:3000";

if ("serviceWorker" in navigator && !globalThis.isLocalhost) {
  const wb = new Workbox(
    "https://kherrick.github.io/block-garden/service-worker.js",
  );

  wb.addEventListener("waiting", (event) => {
    if (confirm("A new version is available. Update now?")) {
      wb.messageSkipWaiting();
    }
  });

  wb.addEventListener("controlling", () => {
    window.location.reload();
  });

  wb.register();
}

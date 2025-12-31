/**
 * Custom Service Worker for handling Web Share Target
 *
 * This runs before Workbox and handles share/share-target.html POST requests
 * and is imported by Workbox-generated service-worker.js via importScripts
 */

let pendingShareData = null;

// Handle fetch requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle POST requests to share/share-target.html
  if (
    event.request.method === "POST" &&
    url.pathname.endsWith("share/share-target.html")
  ) {
    event.respondWith(handleShareTarget(event.request));

    return;
  }

  // Let other requests pass through (Workbox will handle them)
});

// Handle messages from the page
self.addEventListener("message", (event) => {
  if (event.data.type === "REQUEST_SHARED_SAVE") {
    if (pendingShareData) {
      event.ports[0].postMessage(pendingShareData);

      pendingShareData = null;
    }
  }
});

/**
 * Handle share target POST requests
 *
 * @param {Request} request
 *
 * @returns {Promise<Response>}
 */
async function handleShareTarget(request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("gameState");

    if (!file) {
      throw new Error("No gameState file in form data");
    }

    // Handle .bgs (gzip), .txt (non compressed), and .pdf (pdf with game card (picture + game state)) game save files
    let stateJSON = "{}";

    if (file.name.endsWith(".txt")) {
      stateJSON = (await file.text()).replace(/\s+/g, "");
    }

    if (file.name.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = String.fromCharCode.apply(null, uint8Array);

      // pass along the contents for further processing later
      const contents = btoa(binaryString);
      stateJSON = JSON.stringify({
        type: "pdf",
        contents,
      });
    }

    if (file.name.endsWith(".bgs")) {
      const decompressedStream = file
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));

      const decompressedBlob = await new Response(decompressedStream).blob();

      stateJSON = await decompressedBlob.text();
    }

    // Parse the JSON
    const saveData = JSON.parse(stateJSON);

    // Store for the page to retrieve
    pendingShareData = {
      saveData,
      fileName: file.name,
    };

    console.log("[ShareTarget] Stored shared save data in Service Worker");

    // Return the share/share-target.html page
    const response = await caches.match(
      new Request("share/share-target.html", { method: "GET" }),
    );

    if (response) {
      return response;
    }

    // Fallback: fetch the page
    return fetch(new Request("share/share-target.html", { method: "GET" }));
  } catch (error) {
    console.error("[ShareTarget] Error handling share target:", error);
    return new Response(
      `
      <!doctype html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <title>Block Garden - Share Processing Error</title>
          <meta charset="utf-8" />
          <meta
            content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover"
            name="viewport"
          />
          <meta name="description" content="Block Garden - Share Processing Error" />
          <meta
            http-equiv="refresh"
            content="5;url=https://kherrick.github.io/block-garden/"
          />
          <script>
            setTimeout(() => {
              location.replace("https://kherrick.github.io/block-garden/");
            }, 5000);
          </script>
        </head>
        <body style="align-items:center; color:red; display:flex; font-family:sans-serif; height:100vh; justify-content:center;">
          <div style="text-align:center;">
            <h1>Error Processing Share</h1>

            <p>${error.message}</p>

            <p>Block Garden will continue without loading the shared file...</p>

            <p>Trying loading the file using the "Settings > World State > Load Game File From Disk" button.</p>
          </div>
        </body>
      </html>
      `,
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }
}

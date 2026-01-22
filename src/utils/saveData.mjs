import { extractAttachments } from "./extractAttachments.mjs";
import { extractJsonFromPng } from "./canvasToPngWithState.mjs";

/**
 * Processes save data from a Blob or File and returns the state JSON.
 *
 * @param {Blob|File} data - The data to process.
 * @param {string} filename - The name of the file (for extension-based processing).
 * @param {typeof globalThis} gThis - The global context.
 *
 * @returns {Promise<string>} The state JSON.
 */
export async function processSaveData(data, filename, gThis) {
  const name = filename.toLowerCase();

  let stateJSON = "{}";

  if (name.endsWith(".txt")) {
    stateJSON = (await data.text()).replace(/\s+/g, "");
  } else if (name.endsWith(".pdf")) {
    const file = new File([data], filename, { type: "application/pdf" });
    const attachments = await extractAttachments(file);

    if (!attachments || attachments.length === 0 || !attachments[0].data) {
      throw new Error("Invalid game save: No attachments found in PDF.");
    }

    stateJSON = await extractJsonFromPng(new Blob([attachments[0].data]));
  } else if (name.endsWith(".bgs")) {
    const decompressedStream = data
      .stream()
      .pipeThrough(new gThis.DecompressionStream("gzip"));

    const decompressedBlob = await new gThis.Response(
      decompressedStream,
    ).blob();

    stateJSON = await decompressedBlob.text();
  } else {
    // Attempt to read as text if unknown extension
    stateJSON = await data.text();
  }

  // Basic validation
  try {
    JSON.parse(stateJSON);
  } catch (parseError) {
    throw new Error("Invalid game state: not valid JSON.");
  }

  return stateJSON;
}

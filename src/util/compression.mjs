/**
 * Generates an ISO-like timestamp string suitable for use in filenames.
 *
 * Format: YYYY-MM-DD_HH-MM-SS.mmm (in UTC).
 *
 * @returns {string} Timestamp string for filename (e.g., '2025-11-26_14-30-45.123')
 */
export function getIsoDateForFilename() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${now.getUTCDate()}`.padStart(2, "0");
  const hour = `${now.getUTCHours()}`.padStart(2, "0");
  const minute = `${now.getUTCMinutes()}`.padStart(2, "0");
  const second = `${now.getUTCSeconds()}`.padStart(2, "0");
  const millisecond = `${now.getUTCMilliseconds()}`.padStart(3, "0");

  return `${year}-${month}-${day}_${hour}-${minute}-${second}.${millisecond}`;
}

/**
 * Compresses a string using the CompressionStream API (gzip format).
 *
 * Returns a binary Blob suitable for download or transmission.
 * Gracefully handles browsers without native CompressionStream support.
 *
 * @param {string} str - The string to compress
 *
 * @returns {Promise<Blob|undefined>} Compressed gzip Blob, or undefined if CompressionStream unavailable
 */
export async function compressToBinaryBlob(str) {
  const input = new TextEncoder().encode(str);

  if ("CompressionStream" in window) {
    // Use native CompressionStream API when available
    const inputBlob = new Blob([input]);
    const compressedStream = inputBlob
      .stream()
      .pipeThrough(new CompressionStream("gzip"));

    return await new Response(compressedStream).blob();
  }
}

/**
 * Compresses a string and writes it directly to a file handle.
 *
 * Uses the File System Access API for saving compressed data.
 *
 * @param {string} str - The string to compress
 * @param {FileSystemFileHandle} outputFileHandle - File handle to write compressed data to
 *
 * @returns {Promise<void>} Resolves when file write is complete
 */
export async function compressToBinaryFile(str, outputFileHandle) {
  const compressedBlob = await compressToBinaryBlob(str);
  const writable = await outputFileHandle.createWritable();

  await writable.write(compressedBlob);
  await writable.close();
}

/**
 * Decompress gzip binary file to text file
 *
 * @param {Blob} inputFile
 * @param {FileSystemFileHandle} outputFileHandle
 *
 * @returns {Promise<void>}
 */
export async function decompressFromBinaryFile(inputFile, outputFileHandle) {
  const compressedBlob = inputFile; // inputFile is a Blob from file picker

  const decompressedStream = compressedBlob
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));

  const decompressedBlob = await new Response(decompressedStream).blob();
  const text = await decompressedBlob.text();

  const writable = await outputFileHandle.createWritable();

  await writable.write(text);
  await writable.close();
}

/**
 * Compress string and save binary gzip file
 *
 * @param {typeof globalThis} gThis
 * @param {string} stringData
 *
 * @returns {Promise<void>}
 */
export async function runCompress(gThis, stringData) {
  const filename = `sprite-garden-save-game-file-${getIsoDateForFilename()}.sgs`;

  let outputFileHandle;

  if (gThis.showSaveFilePicker) {
    // Modern browsers (Chrome, Edge)
    outputFileHandle = await gThis.showSaveFilePicker({
      suggestedName: filename,
    });

    await compressToBinaryFile(stringData, outputFileHandle);
  } else {
    // Graceful fallback (Safari, Firefox, others)
    const compressedBlob = await compressToBinaryBlob(stringData);
    const url = URL.createObjectURL(compressedBlob);

    const anchor = gThis.document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    gThis.document.body.append(anchor);

    anchor.click();

    gThis.document.body.removeChild(anchor);

    URL.revokeObjectURL(url); // Clean up
  }
}

/**
 * Decompress gzip binary file
 *
 * @param {typeof globalThis} gThis
 *
 * @returns {Promise<void>}
 */
export async function runDecompress(gThis) {
  const [inputFileHandle] = await gThis.showOpenFilePicker({
    types: [
      { description: "Gzip Files", accept: { "application/gzip": [".sgs"] } },
    ],
  });

  const inputFile = await inputFileHandle.getFile();

  const outputFileHandle = await gThis.showSaveFilePicker({
    suggestedName: "decompressed.txt",
  });

  await decompressFromBinaryFile(inputFile, outputFileHandle);
}

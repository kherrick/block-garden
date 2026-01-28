import { getDateTime } from "./getDateTime.mjs";

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
  const filename = `Block-Garden-Game-Save-${getDateTime()}.bgs`;

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
      { description: "Gzip Files", accept: { "application/gzip": [".bgs"] } },
    ],
  });

  const inputFile = await inputFileHandle.getFile();

  const outputFileHandle = await gThis.showSaveFilePicker({
    suggestedName: "decompressed.txt",
  });

  await decompressFromBinaryFile(inputFile, outputFileHandle);
}

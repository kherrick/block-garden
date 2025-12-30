/**
 * Encodes an ArrayBuffer as a base64-encoded string.
 *
 * Useful for serializing binary data for storage or transmission.
 *
 * @param {typeof globalThis} gThis - Global this (window object) for access to btoa
 * @param {ArrayBuffer} buffer - The binary buffer to encode
 *
 * @returns {string} Base64-encoded string representation of the buffer
 */
export function arrayBufferToBase64(gThis, buffer) {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return gThis.btoa(binary);
}

/**
 * Decodes a base64-encoded string back into an ArrayBuffer.
 *
 * Inverse operation of arrayBufferToBase64.
 *
 * @param {typeof globalThis} gThis - Global this (window object) for access to atob
 * @param {string} base64Data - Base64-encoded string to decode
 *
 * @returns {ArrayBuffer} The decoded binary data as an ArrayBuffer
 */
export function base64ToArrayBuffer(gThis, base64Data) {
  // Decode base64 to binary string
  const binaryString = gThis.atob(base64Data);

  // Create a Uint8Array with the same length as the binary string
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  // Populate the Uint8Array with char codes from the binary string
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Return the underlying ArrayBuffer explicitly typed
  return bytes.buffer;
}

/**
 * Converts a base64-encoded string to a Blob object.
 *
 * Useful for creating downloadable files or sending data as file uploads.
 *
 * @param {typeof globalThis} gThis - Global this (window object)
 * @param {string} base64Data - Base64-encoded string to convert
 * @param {string} mimeType - MIME type for the resulting Blob (e.g., 'application/json')
 *
 * @returns {Blob} Blob object containing the decoded binary data
 */
export function base64toBlob(gThis, base64Data, mimeType) {
  // Convert to ArrayBufferLike
  const arrayBufferLike = base64ToArrayBuffer(gThis, base64Data);

  // Ensure Blob constructor receives a concrete ArrayBuffer by wrapping with Uint8Array
  const uint8Array = new Uint8Array(arrayBufferLike);

  return new Blob([uint8Array.buffer], { type: mimeType });
}

/**
 * Converts a File object to a base64-encoded string asynchronously.
 *
 * Reads the file contents using FileReader as an ArrayBuffer, then encodes
 * the binary data to base64 format. Useful for uploading files, embedding
 * images in data URLs, or transmitting binary file data over text protocols.
 *
 * @param {File} file - The File object to read and encode (from file input or drag-drop)
 *
 * @returns {Promise<string>} Promise that resolves to the base64-encoded string of the file contents
 *
 * @throws {Error} If the FileReader fails or result is not an ArrayBuffer
 *
 * @example
 * const fileInput = document.querySelector('input[type="file"]');
 * fileInput.addEventListener('change', async (e) => {
 *   const file = e.target.files[0];
 *   try {
 *     const base64 = await fileToBase64(file);
 *     console.log(base64); // e.g., "data:application/pdf;base64,JVBERi0xLjQ..."
 *   } catch (error) {
 *     console.error('Failed to encode file:', error);
 *   }
 * });
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (result instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(result);
        const base64String = btoa(String.fromCharCode.apply(null, uint8Array));

        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

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

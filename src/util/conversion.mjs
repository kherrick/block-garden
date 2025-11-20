/**
 * @param {any} gThis
 * @param {any} buffer
 *
 * @returns {any}
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
 * @param {any} gThis
 * @param {any} base64Data
 *
 * @returns {ArrayBuffer}
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
 * @param {any} gThis
 * @param {any} base64Data
 * @param {any} mimeType
 *
 * @returns {Blob}
 */
export function base64toBlob(gThis, base64Data, mimeType) {
  // Convert to ArrayBufferLike
  const arrayBufferLike = base64ToArrayBuffer(gThis, base64Data);

  // Ensure Blob constructor receives a concrete ArrayBuffer by wrapping with Uint8Array
  const uint8Array = new Uint8Array(arrayBufferLike);

  return new Blob([uint8Array.buffer], { type: mimeType });
}

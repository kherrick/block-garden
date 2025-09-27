export function arrayBufferToBase64(gThis, buffer) {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return gThis.btoa(binary);
}

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

  // Return the underlying ArrayBuffer
  return bytes.buffer;
}

export function base64toBlob(gThis, base64Data, mimeType) {
  // Convert to ArrayBuffer and create Blob
  const byteArray = base64ToArrayBuffer(gThis, base64Data);

  return new Blob([byteArray], { type: mimeType });
}

// CRC32 helper for PNG chunks
function crc32(buf) {
  let c = -1;

  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }

  return (c ^ -1) >>> 0;
}

// Build a PNG chunk: length + type + data + crc
function makeChunk(typeStr, dataBytes) {
  const type = new TextEncoder().encode(typeStr); // 4 bytes
  const length = dataBytes.length;

  const chunk = new Uint8Array(8 + length + 4);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, length); // length
  chunk.set(type, 4); // type
  chunk.set(dataBytes, 8); // data

  const crcInput = new Uint8Array(4 + length);
  crcInput.set(type, 0);
  crcInput.set(dataBytes, 4);

  const crc = crc32(crcInput);
  view.setUint32(8 + length, crc); // crc

  return chunk;
}

// Embed JSON string as a PNG tEXt chunk with keyword "gamestate"
function embedJsonInPng(originalPngUint8, jsonString) {
  const signature = originalPngUint8.slice(0, 8);
  const chunks = [];
  let offset = 8;

  // Collect all existing chunks
  while (offset < originalPngUint8.length) {
    const view = new DataView(
      originalPngUint8.buffer,
      originalPngUint8.byteOffset + offset,
    );

    const length = view.getUint32(0);
    const type = String.fromCharCode(
      originalPngUint8[offset + 4],
      originalPngUint8[offset + 5],
      originalPngUint8[offset + 6],
      originalPngUint8[offset + 7],
    );

    const totalLen = 8 + length + 4;
    const chunk = originalPngUint8.slice(offset, offset + totalLen);

    chunks.push({ type, data: chunk });

    offset += totalLen;

    if (type === "IEND") break;
  }

  // Build tEXt chunk: "gamestate\0<json>"
  const keyword = "gamestate";
  const textBytes = new TextEncoder().encode(keyword + "\0" + jsonString);
  const textChunk = makeChunk("tEXt", textBytes);

  // Reassemble: signature + IHDR + (existing chunks until before IEND) + tEXt + IEND
  const outParts = [signature];

  // Always keep IHDR first
  outParts.push(chunks[0].data); // IHDR

  // Insert tEXt before IEND
  for (let i = 1; i < chunks.length; i++) {
    if (chunks[i].type === "IEND") {
      outParts.push(textChunk);
    }

    outParts.push(chunks[i].data);
  }

  let totalLen = 0;
  for (const part of outParts) totalLen += part.length;

  const out = new Uint8Array(totalLen);
  let p = 0;

  for (const part of outParts) {
    out.set(part, p);

    p += part.length;
  }

  return out;
}

export async function canvasToPngWithState(canvas, gameStateObj, size = 400) {
  const jsonString = JSON.stringify(gameStateObj);

  // Create an "offscreen canvas" of the desired output size
  const outCanvas = document.createElement("canvas");
  outCanvas.width = size;
  outCanvas.height = size;

  // Create 2D context with explicit color space management
  const outCtx = outCanvas.getContext("2d", {
    colorSpace: "srgb",
    willReadFrequently: true,
  });

  // Detect source canvas color space (if supported)
  const srcCtx = canvas.getContext("2d");
  let srcColorSpace = "srgb"; // Default fallback

  if (srcCtx && srcCtx.getContextAttributes) {
    const attrs = srcCtx.getContextAttributes();
    // Check if color space management is supported
    if (attrs.colorSpace) {
      srcColorSpace = attrs.colorSpace;
    }
  }

  const srcW = canvas.width;
  const srcH = canvas.height;

  // Source rect: centered square on the original canvas
  const srcSize = Math.min(srcW, srcH);
  const sx = (srcW - srcSize) / 2;
  const sy = (srcH - srcSize) / 2;

  // Draw with color space awareness
  outCtx.drawImage(
    canvas,
    sx,
    sy,
    srcSize,
    srcSize, // source rect
    0,
    0,
    size,
    size, // destination rect
  );

  // Turn the output canvas into PNG bytes
  const blob = await new Promise((res) => outCanvas.toBlob(res, "image/png"));

  if (!blob) {
    throw new Error("Failed to create PNG blob");
  }

  const arrayBuffer = await blob.arrayBuffer();
  const pngBytes = new Uint8Array(arrayBuffer);

  // Embed JSON into PNG
  const modifiedPngBytes = embedJsonInPng(pngBytes, jsonString);

  return new Blob([modifiedPngBytes], { type: "image/png" });
}

export async function downloadCanvasWithState(canvas, gameStateObj) {
  const blob = await canvasToPngWithState(canvas, gameStateObj);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "block-garden-game-card.png";
  a.click();

  URL.revokeObjectURL(url);
}

export async function extractJsonFromPng(fileOrBlob) {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Skip signature
  let offset = 8;
  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );

    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === "tEXt") {
      const textBytes = bytes.slice(dataStart, dataEnd);
      const text = new TextDecoder().decode(textBytes);
      const nullPos = text.indexOf("\0");

      if (nullPos !== -1) {
        const keyword = text.slice(0, nullPos);
        const value = text.slice(nullPos + 1);

        if (keyword === "gamestate") {
          return JSON.parse(value);
        }
      }
    }

    offset = dataEnd + 4; // skip CRC
    if (type === "IEND") {
      break;
    }
  }

  return null;
}

import { Chunk } from "../util/chunk.mjs";
import { generateChunk } from "./chunkGenerator.mjs";

/**
 * Terrain generation Web Worker.
 *
 * @param {MessageEvent} messageEvent
 */
self.onmessage = (messageEvent) => {
  const { chunkX, chunkZ, seed } = messageEvent.data;

  // Create a temporary chunk instance for generation
  const chunk = new Chunk(chunkX, chunkZ);

  // Generate terrain using the imported logic
  generateChunk(chunk, seed);

  // Send back transferable raw data
  const transferable = chunk.toTransferable();

  self.postMessage(transferable, [transferable.blocks]);
};

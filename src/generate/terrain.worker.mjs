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

  // Generate terrain using the imported logic with optional settings
  const { settings = {} } = messageEvent.data;
  generateChunk(chunk, seed, settings);

  // Send back transferable raw data
  const transferable = chunk.toTransferable();

  self.postMessage(transferable, [transferable.blocks]);
};

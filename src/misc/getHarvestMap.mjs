import { extractSeeds } from "./selectSeed.mjs";

/**
 * @param {any} tiles
 *
 * @returns {any}
 */
export const getHarvestMap = (tiles) => extractSeeds(tiles);

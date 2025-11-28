import { extractSeeds } from "./selectSeed.mjs";

/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {TileMap} tiles - Map of all tile definitions
 *
 * @returns {Object}
 */
export const getHarvestMap = (tiles) => extractSeeds(tiles);

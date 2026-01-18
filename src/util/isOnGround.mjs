import { getBlock } from "../util/world.mjs";

export function isOnGround(state, world, x, y, z) {
  const playerBottom = y - state.playerHeight / 2;
  const blockY = Math.floor(playerBottom);

  return getBlock(world, x, blockY, z);
}

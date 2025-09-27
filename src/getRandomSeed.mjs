const minValue = 1;
const maxValue = 4294967295;

function getCryptoRandomInt(min, max) {
  const range = max - min + 1;
  const maxUint32 = 0xffffffff;

  let rand32, limit;

  // Avoid modulo bias by finding largest multiple of range below maxUint32
  limit = maxUint32 - (maxUint32 % range);

  do {
    rand32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  } while (rand32 > limit);
  return min + (rand32 % range);
}

export function getRandomSeed() {
  return typeof globalThis.crypto === "object" &&
    typeof globalThis.crypto.getRandomValues === "function"
    ? getCryptoRandomInt(minValue, maxValue)
    : (
        Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
      ).toString();
}

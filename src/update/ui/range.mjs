import localForage from "localforage";

/**
 * @param {any} shadow
 *
 * @returns {Promise<void>}
 */
export async function updateRangeUI(shadow) {
  const rangeValue = (await localForage.getItem("sprite-garden-range")) || 1;

  shadow.querySelector('[data-key="k"].middle').innerHTML =
    `&times;${Number(rangeValue)}`;
}

/**
 * @param {any} shadow
 *
 * @returns {Promise<void>}
 */
export async function updateRangeValue(shadow) {
  let rangeValue = Number(
    (await localForage.getItem("sprite-garden-range")) || 1,
  );

  let newRangeValue = Number(rangeValue + 1);

  if (rangeValue >= 3) {
    newRangeValue = 1;
  }

  await localForage.setItem("sprite-garden-range", newRangeValue);
  await updateRangeUI(shadow);
}

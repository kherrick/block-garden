import localForage from "localforage";

/**
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<void>}
 */
export async function updateMovementScaleUI(shadow) {
  let movementScaleValue = await localForage.getItem(
    `sprite-garden-movement-scale`,
  );

  if (!movementScaleValue) {
    movementScaleValue = 1;

    await localForage.setItem(
      "sprite-garden-movement-scale",
      movementScaleValue,
    );
  }

  shadow.querySelector('[data-key="x"].middle').innerHTML =
    `&times;${Number(movementScaleValue)}`;
}

/**
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<void>}
 */
export async function updateMovementScaleValue(shadow) {
  const movementScaleValue = Number(
    Number(await localForage.getItem("sprite-garden-movement-scale")) || 1,
  );

  let newMovementScaleValue = Number(
    Number(movementScaleValue.toFixed(2)) + 0.125,
  );

  if (newMovementScaleValue > 1) {
    newMovementScaleValue = Number(newMovementScaleValue.toFixed(1));
  }

  if (newMovementScaleValue > 1) {
    newMovementScaleValue = Number(0.5);
  }

  await localForage.setItem(
    `sprite-garden-movement-scale`,
    newMovementScaleValue,
  );

  await updateMovementScaleUI(shadow);
}

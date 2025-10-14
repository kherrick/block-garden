import localForage from "../../../deps/localForage.mjs";

export async function updateMovementScaleUI(doc) {
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

  doc.querySelector('[data-key="x"].middle').innerHTML =
    `&times;${Number(movementScaleValue)}`;
}

export async function updateMovementScaleValue(doc) {
  let movementScaleValue = Number(
    (await localForage.getItem("sprite-garden-movement-scale")) || 1,
  );

  let newMovementScaleValue = Number(movementScaleValue + 0.05);

  if (movementScaleValue >= 1) {
    newMovementScaleValue = 0.5;
  }

  await localForage.setItem(
    `sprite-garden-movement-scale`,
    newMovementScaleValue.toFixed(2),
  );

  await updateMovementScaleUI(doc);
}

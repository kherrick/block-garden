import localForage from "../../../deps/localForage.mjs";

export async function updateRangeUI(doc) {
  const rangeValue = (await localForage.getItem("sprite-garden-range")) || 1;

  doc.querySelector('[data-key="k"].middle').innerHTML =
    `&times;${Number(rangeValue)}`;
}

export async function updateRangeValue(doc) {
  let rangeValue = Number(
    (await localForage.getItem("sprite-garden-range")) || 1,
  );

  let newRangeValue = Number(rangeValue + 1);

  if (rangeValue >= 3) {
    newRangeValue = 1;
  }

  await localForage.setItem("sprite-garden-range", newRangeValue);

  await updateRangeUI(doc);
}

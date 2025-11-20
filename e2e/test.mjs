import { test, expect, chromium } from "@playwright/test";

const TIME_SECONDS_ONE = 1000;
const TIME_MINUTES_FIVE = 5 * 60 * TIME_SECONDS_ONE;

const appUrl = "http://localhost:8080";

function getRunId() {
  const d = new Date();

  return [
    d.toISOString().slice(0, 19).replace(/[:T]/g, "-"),
    Math.random().toString(16).slice(2, 8),
  ].join("_");
}

// Wait for <sprite-garden> 'loading' event with isLoading false and pkg present
async function waitForSpriteGarden(page) {
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const sprite = document.querySelector("sprite-garden");

      if (!sprite) {
        reject(new Error("<sprite-garden> element not found"));

        return;
      }

      const timeoutId = setTimeout(() => {
        sprite.removeEventListener("sprite-garden-load", onLoading);

        reject(
          new Error(
            'Timed out waiting for "sprite-garden-load" event with expected details from <sprite-garden>',
          ),
        );
      }, 5000);

      function onLoading(event) {
        const detail = event.detail;

        if (
          detail &&
          detail.isLoading === false &&
          detail.pkg &&
          detail.error === null
        ) {
          clearTimeout(timeoutId);

          sprite.removeEventListener("sprite-garden-load", onLoading);

          resolve();
        }
      }

      sprite.addEventListener("sprite-garden-load", onLoading);
    });
  });
}

let browser;
let page;
let runId;

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
  runId = getRunId();

  // Enable video recording
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    recordVideo: { dir: `e2e-results/${runId}` },
  });

  page = await context.newPage();
});

test.afterAll(async () => {
  await page.close();
  await browser.close();
});

test("Check Selectors", async () => {
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await waitForSpriteGarden(page);

  const selectors = ["sprite-garden >>> #canvas"];
  for (const selector of selectors) {
    await expect(page.locator(selector)).toBeVisible({ timeout: 8000 });
  }
});

test("Check Digging for Gold", async () => {
  test.setTimeout(TIME_MINUTES_FIVE);

  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await waitForSpriteGarden(page);

  // Unlock additional functionality
  const sequence = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  for (const key of sequence) {
    await page.keyboard.press(key);
  }

  await page.getByRole("button", { name: "📝 Open" }).click();
  await page.getByTitle("Sprite Garden - Gold -").click();

  await page.getByText("🎒 Inventory").click();
  await page.getByRole("button", { name: "🟡" }).click();

  // Poll for gold
  let currentGold = 0;
  const targetGold = 5;
  const start = Date.now();

  while (Date.now() - start < TIME_MINUTES_FIVE - TIME_SECONDS_ONE * 10) {
    try {
      const btn = await page.getByRole("button", { name: "🟡" }).first();
      const text = await btn.textContent();

      currentGold = parseInt((text ?? "").trim().split("🟡")[1] ?? "", 10);

      if (!isNaN(currentGold)) {
        // console.info("Gold:", currentGold);
      }

      if (!isNaN(currentGold) && currentGold >= targetGold) {
        // console.info(`Reached ${targetGold} gold.`);

        // Screenshot just before finishing test
        await page.screenshot({
          path: `e2e-results/${runId}/${runId}-target-gold-achieved.png`,
        });

        return;
      }
    } catch {
      // silent retry
    }
    await page.waitForTimeout(1000);
  }

  throw new Error(
    `Timed out waiting for gold. Gold amount dug before timeout: ${currentGold}`,
  );
});

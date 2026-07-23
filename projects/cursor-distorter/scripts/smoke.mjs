// Headless interaction smoke test for the full app: onboarding -> console -> sandbox.
// Drives the real chaos loop with a real pointer and asserts the visible behavior.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const URL = process.env.SMOKE_URL || "http://localhost:5199/";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shotDir = path.join(root, "docs", "screenshots");
mkdirSync(shotDir, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ headless: true });
const page = await browser
  .newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  .then((c) => c.newPage());

const btn = (name, exact = false) => page.getByRole("button", { name, exact });
const centerOf = async (selector) => {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`no box for ${selector}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};
const visibleCursors = () =>
  page.evaluate(
    () =>
      Array.from(document.querySelectorAll("[data-cd-cursor]")).filter(
        (n) => getComputedStyle(n).display !== "none",
      ).length,
  );
const moveInto = async (pt, steps = 12) => {
  await page.mouse.move(pt.x - 50, pt.y - 40, { steps });
  await page.mouse.move(pt.x, pt.y, { steps });
};

try {
  await page.goto(URL, { waitUntil: "domcontentloaded" });

  // Complete onboarding.
  await page.waitForSelector("text=Welcome to Cursor Distorter", { timeout: 10000 });
  await btn("Begin onboarding").click();
  await page.waitForTimeout(200);
  await btn("A live presentation").click();
  await page.waitForTimeout(200);
  await btn("Continue").first().click();
  await page.waitForTimeout(200);
  await btn("Deeply irritating").click();
  await btn("Continue").first().click();
  await page.waitForTimeout(150);
  await btn("Safe Demo Sandbox").click();
  await btn("Continue").first().click();
  await page.waitForTimeout(150);
  await btn("Enter the console").click();

  await page.waitForSelector("[data-cd-sandbox]", { timeout: 10000 });
  await page.waitForTimeout(500);

  const sandbox = await centerOf("[data-cd-sandbox]");
  await moveInto(sandbox);
  await page.waitForTimeout(300);
  check("fake cursor renders on hover", (await visibleCursors()) >= 1, `${await visibleCursors()} visible`);

  // Distortion OFF: a precise click should toggle the checkbox.
  const row = page.locator(".cd-ctl", { hasText: "Mark as urgent" }).first();
  const rowBox = await row.boundingBox();
  await moveInto({ x: rowBox.x + rowBox.width / 2, y: rowBox.y + rowBox.height / 2 });
  await page.waitForTimeout(220);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(220);
  check("checkbox toggles with distortion off", ((await row.textContent()) || "").includes("✓"), (await row.textContent())?.trim());

  // Apply the triplets preset (auto-arms) -> three cursors.
  await page.getByRole("button", { name: "Presets", exact: true }).click();
  await page.waitForTimeout(200);
  await btn("Is My Mouse Broken?").click();
  await page.waitForTimeout(150);
  await moveInto(sandbox);
  await page.mouse.move(sandbox.x + 30, sandbox.y + 10, { steps: 6 });
  await page.waitForTimeout(500);
  const triCount = await visibleCursors();
  check("triplets render three cursors", triCount === 3, `${triCount} visible`);

  // Panic -> single cursor.
  await btn("Panic", true).click();
  await page.waitForTimeout(200);
  await moveInto(sandbox);
  await page.waitForTimeout(400);
  const afterPanic = await visibleCursors();
  check("panic returns to a single cursor", afterPanic === 1, `${afterPanic} visible`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed.length ? 1 : 0);
} catch (err) {
  console.error("SMOKE ERROR:", err.message);
  await page.screenshot({ path: path.join(shotDir, "error.png") }).catch(() => {});
  await browser.close();
  process.exit(2);
}

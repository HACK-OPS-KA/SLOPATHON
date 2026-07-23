// Captures deliverable screenshots across the full flow and sanity-checks navigation.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const URL = process.env.SMOKE_URL || "http://localhost:5199/";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shotDir = path.join(root, "docs", "screenshots");
mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }).then((c) => c.newPage());
const shot = (name) => page.screenshot({ path: path.join(shotDir, name) });
const click = (name) => page.getByRole("button", { name, exact: false }).first().click();
const centerOf = async (sel) => {
  const b = await page.locator(sel).first().boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};
const moveInto = async (pt) => {
  await page.mouse.move(pt.x - 60, pt.y - 40, { steps: 10 });
  await page.mouse.move(pt.x, pt.y, { steps: 10 });
};

try {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Welcome to Cursor Distorter", { timeout: 10000 });
  await page.waitForTimeout(300);
  await shot("05-onboarding.png");

  await click("Begin onboarding");
  await page.waitForTimeout(250);
  await click("A live presentation");
  await page.waitForTimeout(250);
  await click("Continue");
  await page.waitForTimeout(250);
  await click("Deeply irritating");
  await click("Continue");
  await page.waitForTimeout(200);
  await click("Safe Demo Sandbox");
  await click("Continue");
  await page.waitForTimeout(200);
  await click("Enter the console");
  await page.waitForSelector("[data-cd-sandbox]", { timeout: 8000 });
  await page.waitForTimeout(500);
  await shot("06-dashboard.png");

  // Arm + move into sandbox.
  await click("Arm distortion");
  const sandbox = await centerOf("[data-cd-sandbox]");
  await moveInto(sandbox);
  await page.mouse.move(sandbox.x + 40, sandbox.y - 20, { steps: 8 });
  await page.waitForTimeout(600);
  await shot("07-dashboard-armed.png");

  // Mixer tab.
  await page.getByRole("button", { name: "Mixer", exact: true }).click();
  await page.waitForTimeout(300);
  await shot("08-mixer.png");

  // Demo screen + escalation.
  await page.getByRole("button", { name: "Live Demo" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Start escalation" }).click();
  await page.waitForTimeout(1500);
  const s2 = await centerOf("[data-cd-sandbox]");
  await moveInto(s2);
  await page.waitForTimeout(1200);
  await shot("09-demo-escalating.png");

  console.log("screens captured OK");
  await browser.close();
} catch (err) {
  console.error("SCREENS ERROR:", err);
  await shot("screens-error.png").catch(() => {});
  await browser.close();
  process.exit(1);
}

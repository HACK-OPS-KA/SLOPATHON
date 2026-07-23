import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Noise Enforcement Officer", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Noise Enforcement Officer<\/title>/i);
  assert.match(html, /detects unacceptable silence and files the complaint as noise/i);
  assert.match(html, /LOCAL AUDIO ANALYSIS/i);
  assert.match(html, /ZERO RECORDING/i);
  assert.match(html, /ARMED/);
  assert.match(html, /BLARING/);
  assert.match(html, /COOLDOWN/);
  assert.match(html, /Never use this with headphones/i);
  assert.match(html, /DISARM|STOP/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps microphone analysis local and ships the lab base build", async () => {
  const [component, packageJson, staticConfig, manifest, serviceWorker] =
    await Promise.all([
      readFile(new URL("../app/noise-enforcer.tsx", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../vite.static.config.ts", import.meta.url), "utf8"),
      readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
      readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    ]);

  assert.match(component, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(component, /createMediaStreamSource/);
  assert.match(component, /createAnalyser/);
  assert.match(component, /new SpeechSynthesisUtterance/);
  assert.match(component, /document\.hidden/);
  assert.doesNotMatch(component, /MediaRecorder|fetch\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /"build:static"/);
  assert.match(staticConfig, /base:\s*"\/silence-enforcer\/"/);
  assert.match(staticConfig, /outDir:\s*"\.\.\/dist-static"/);
  assert.match(manifest, /"display":\s*"standalone"/);
  assert.match(manifest, /"start_url":\s*"\.\/"/);
  assert.match(serviceWorker, /noise-enforcement-officer-v1/);

  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );
  await access(new URL("../public/android-chrome-192x192.png", import.meta.url));
  await access(new URL("../public/android-chrome-512x512.png", import.meta.url));
  await access(templateRoot);
});

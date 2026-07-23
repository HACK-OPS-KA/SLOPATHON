import assert from "node:assert/strict";
import { once } from "node:events";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createServer, preview } from "vite";
import { WebSocket } from "ws";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function nextJson(socket, predicate = () => true, timeoutMs = 2_000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for relay message"));
    }, timeoutMs);

    const onMessage = (raw) => {
      let value;
      try {
        value = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!predicate(value)) return;
      cleanup();
      resolve(value);
    };

    const onClose = (code, reason) => {
      cleanup();
      reject(
        new Error(
          `Socket closed before message (${code}: ${reason.toString()})`,
        ),
      );
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off("message", onMessage);
      socket.off("close", onClose);
    };

    socket.on("message", onMessage);
    socket.on("close", onClose);
  });
}

async function connect(url) {
  const socket = new WebSocket(url);
  await once(socket, "open");
  return socket;
}

test("same-origin relay connects one host and two phone controllers", async (t) => {
  const port = 43_000 + (process.pid % 1_000);
  const vite = await createServer({
    configFile: path.join(projectRoot, "vite.static.config.ts"),
    root: path.join(projectRoot, "static"),
    clearScreen: false,
    logLevel: "silent",
    server: {
      host: "127.0.0.1",
      port,
      strictPort: false,
    },
  });
  await vite.listen();

  const address = vite.httpServer?.address();
  assert(address && typeof address === "object");
  const relay = `ws://127.0.0.1:${address.port}/ws`;
  const room = "TEST42";
  const key = "0123456789abcdef0123456789abcdef";

  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.terminate();
    await vite.close();
  });

  const host = await connect(
    `${relay}?room=${room}&key=${key}&role=host`,
  );
  sockets.push(host);

  const hostSeesPlayerOne = nextJson(
    host,
    (message) =>
      message.type === "presence" &&
      message.host === true &&
      message.players.join(",") === "1",
  );
  const phoneOne = await connect(
    `${relay}?room=${room}&key=${key}&role=controller&player=1`,
  );
  sockets.push(phoneOne);
  assert.deepEqual(await hostSeesPlayerOne, {
    type: "presence",
    host: true,
    players: [1],
  });

  const hostSeesBoth = nextJson(
    host,
    (message) =>
      message.type === "presence" &&
      message.host === true &&
      message.players.join(",") === "1,2",
  );
  const phoneTwo = await connect(
    `${relay}?room=${room}&key=${key}&role=controller&player=2`,
  );
  sockets.push(phoneTwo);
  assert.deepEqual(await hostSeesBoth, {
    type: "presence",
    host: true,
    players: [1, 2],
  });

  const firstFlap = nextJson(host, (message) => message.type === "flap");
  phoneOne.send(
    JSON.stringify({
      type: "flap",
      player: 1,
      seq: 7,
      strength: 0.83,
    }),
  );
  assert.deepEqual(await firstFlap, {
    type: "flap",
    player: 1,
    seq: 7,
    strength: 0.83,
  });

  const secondFlap = nextJson(
    host,
    (message) => message.type === "flap" && message.player === 2,
  );
  phoneTwo.send(
    JSON.stringify({
      type: "flap",
      player: 2,
      seq: 1,
      strength: 4,
    }),
  );
  assert.deepEqual(await secondFlap, {
    type: "flap",
    player: 2,
    seq: 1,
    strength: 1,
  });

  const hostSeesDisconnect = nextJson(
    host,
    (message) =>
      message.type === "presence" && message.players.join(",") === "2",
  );
  phoneOne.close();
  assert.deepEqual(await hostSeesDisconnect, {
    type: "presence",
    host: true,
    players: [2],
  });
});

test("built phone preview exposes the same WebSocket relay", async (t) => {
  const port = 44_000 + (process.pid % 1_000);
  const server = await preview({
    configFile: path.join(projectRoot, "vite.static.config.ts"),
    clearScreen: false,
    logLevel: "silent",
    preview: {
      host: "127.0.0.1",
      port,
      strictPort: false,
    },
  });

  const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.terminate();
    await new Promise((resolve, reject) => {
      server.httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const address = server.httpServer.address();
  assert(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  const response = await fetch(`${base}/screamy-bird/?duo=1`);
  assert.equal(response.status, 200);

  const relay = `${base.replace("http:", "ws:")}/ws`;
  const room = "PHONE2";
  const key = "fedcba9876543210fedcba9876543210";

  const host = await connect(
    `${relay}?room=${room}&key=${key}&role=host`,
  );
  sockets.push(host);

  const connected = nextJson(
    host,
    (message) =>
      message.type === "presence" && message.players.join(",") === "2",
  );
  const phone = await connect(
    `${relay}?room=${room}&key=${key}&role=controller&player=2`,
  );
  sockets.push(phone);
  await connected;

  const flap = nextJson(host, (message) => message.type === "flap");
  phone.send(
    JSON.stringify({
      type: "flap",
      player: 2,
      seq: 1,
      strength: 0.5,
    }),
  );
  assert.deepEqual(await flap, {
    type: "flap",
    player: 2,
    seq: 1,
    strength: 0.5,
  });
});

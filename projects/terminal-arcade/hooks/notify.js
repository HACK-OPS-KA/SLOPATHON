#!/usr/bin/env node
'use strict';

// Runs as a Claude Code hook subprocess (UserPromptSubmit / Stop /
// Notification). Reads the hook's JSON payload from stdin, forwards a
// one-line event to the arcade wrapper over the Unix socket it advertised
// via ARCADE_SOCK, and always exits 0 — a missing socket (e.g. bare `claude`
// run without the wrapper) must never block or error out the user's turn.

const net = require('net');

const CONNECT_TIMEOUT_MS = 75;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
    // Hooks are always given a payload, but guard against a hang anyway.
    setTimeout(() => resolve(data), CONNECT_TIMEOUT_MS);
  });
}

async function main() {
  const sockPath = process.env.ARCADE_SOCK;
  if (!sockPath) {
    process.exit(0);
  }

  const raw = await readStdin();
  let hookEventName = 'unknown';
  try {
    hookEventName = JSON.parse(raw).hook_event_name || hookEventName;
  } catch (_) {
    /* malformed/empty payload — still worth notifying the wrapper */
  }

  const READY_EVENTS = new Set(['Stop', 'Notification']);
  const kind = READY_EVENTS.has(hookEventName) ? 'ready' : 'busy';

  await new Promise((resolve) => {
    const socket = net.createConnection(sockPath);
    const done = () => {
      socket.destroy();
      resolve();
    };
    const timer = setTimeout(done, CONNECT_TIMEOUT_MS);

    socket.on('connect', () => {
      socket.write(
        JSON.stringify({ kind, hook: hookEventName, ts: Date.now() }) + '\n',
        () => {
          clearTimeout(timer);
          done();
        }
      );
    });
    socket.on('error', () => {
      clearTimeout(timer);
      done();
    });
  });

  process.exit(0);
}

main();

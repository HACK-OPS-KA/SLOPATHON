'use strict';

const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Listens on a per-run Unix socket for JSON-line events posted by
 * hooks/notify.js (which runs as a Claude Code hook subprocess). The socket
 * path is generated fresh per process, so there's never a fixed/predictable
 * path for a crashed previous run to leave stale.
 */
function createHookBridge() {
  const sockPath = path.join(os.tmpdir(), `arcade-${process.pid}.sock`);

  // Defensive: extremely unlikely (pid reuse across a fast crash+restart),
  // but a leftover file at this exact path would make listen() fail.
  try {
    fs.unlinkSync(sockPath);
  } catch (_) {
    /* didn't exist, fine */
  }

  const emitter = new EventEmitter();

  const server = net.createServer((socket) => {
    let buf = '';
    socket.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (!line.trim()) continue;
        try {
          emitter.emit('event', JSON.parse(line));
        } catch (_) {
          /* ignore malformed lines from a misbehaving hook */
        }
      }
    });
    socket.on('error', () => {
      /* a hook that disconnects mid-write shouldn't crash the wrapper */
    });
  });

  server.on('error', (err) => {
    emitter.emit('error', err);
  });

  server.listen(sockPath);

  function close() {
    server.close();
    try {
      fs.unlinkSync(sockPath);
    } catch (_) {
      /* already gone */
    }
  }

  return { sockPath, events: emitter, close };
}

module.exports = { createHookBridge };

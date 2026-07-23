/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type PlayerNumber = 1 | 2;

type ClientRole =
  | { kind: "host" }
  | { kind: "player"; player: PlayerNumber };

type PresenceMessage = {
  type: "presence";
  host: boolean;
  players: PlayerNumber[];
};

type FlapMessage = {
  type: "flap";
  player: PlayerNumber;
  seq: number;
  strength: number;
};

type ClientMessage =
  | { type: "presence" }
  | {
      type: "flap";
      player: PlayerNumber;
      seq: number;
      strength: number;
    };

type RateBucket = {
  tokens: number;
  updatedAt: number;
};

type AcceptedWebSocket = WebSocket & {
  accept(): void;
};

type Connection = {
  socket: AcceptedWebSocket;
  role: ClientRole;
  lastSeq: number;
  violations: number;
  messageRate: RateBucket;
  flapRate: RateBucket;
};

type Room = {
  key: string;
  host?: Connection;
  players: Partial<Record<PlayerNumber, Connection>>;
  lastActivityAt: number;
};

const rooms = new Map<string, Room>();

const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;
const ROOM_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const ROOM_IDLE_TTL_MS = 30 * 60 * 1000;
const MAX_MESSAGE_BYTES = 256;
const MAX_VIOLATIONS = 3;
const MESSAGE_BURST = 20;
const MESSAGES_PER_SECOND = 12;
const FLAP_BURST = 5;
const FLAPS_PER_SECOND = 6;

const WebSocketPairConstructor = (
  globalThis as typeof globalThis & {
    WebSocketPair: new () => {
      0: WebSocket;
      1: AcceptedWebSocket;
    };
  }
).WebSocketPair;

function errorResponse(status: number, message: string) {
  return new Response(message, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

function activeConnections(room: Room) {
  const connections: Connection[] = [];
  if (room.host) connections.push(room.host);
  if (room.players[1]) connections.push(room.players[1]);
  if (room.players[2]) connections.push(room.players[2]);
  return connections;
}

function presenceFor(room: Room): PresenceMessage {
  const players: PlayerNumber[] = [];
  if (room.players[1]) players.push(1);
  if (room.players[2]) players.push(2);

  return {
    type: "presence",
    host: Boolean(room.host),
    players,
  };
}

function safeSend(
  socket: WebSocket,
  message: PresenceMessage | FlapMessage,
) {
  if (socket.readyState !== 1) return false;

  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch {
    return false;
  }
}

function broadcastPresence(room: Room) {
  const presence = presenceFor(room);
  for (const connection of activeConnections(room)) {
    safeSend(connection.socket, presence);
  }
}

function cleanupConnection(roomId: string, connection: Connection) {
  const room = rooms.get(roomId);
  if (!room) return;

  let removed = false;
  if (connection.role.kind === "host") {
    if (room.host === connection) {
      room.host = undefined;
      removed = true;
    }
  } else if (room.players[connection.role.player] === connection) {
    room.players[connection.role.player] = undefined;
    removed = true;
  }

  if (!removed) return;
  if (activeConnections(room).length === 0) {
    rooms.delete(roomId);
    return;
  }

  room.lastActivityAt = Date.now();
  broadcastPresence(room);
}

function closeForPolicy(
  roomId: string,
  connection: Connection,
  reason: string,
) {
  cleanupConnection(roomId, connection);
  try {
    connection.socket.close(1008, reason);
  } catch {
    // The socket may already be closing after a transport error.
  }
}

function registerViolation(
  roomId: string,
  connection: Connection,
  reason: string,
) {
  connection.violations += 1;
  if (connection.violations >= MAX_VIOLATIONS) {
    closeForPolicy(roomId, connection, reason);
  }
}

function consumeRateToken(
  bucket: RateBucket,
  capacity: number,
  refillPerSecond: number,
  now: number,
) {
  const elapsed = Math.max(0, now - bucket.updatedAt);
  bucket.tokens = Math.min(
    capacity,
    bucket.tokens + (elapsed * refillPerSecond) / 1000,
  );
  bucket.updatedAt = now;

  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

function parseClientMessage(payload: string): ClientMessage | null {
  if (new TextEncoder().encode(payload).byteLength > MAX_MESSAGE_BYTES) {
    return null;
  }

  let value: unknown;
  try {
    value = JSON.parse(payload);
  } catch {
    return null;
  }

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const message = value as Record<string, unknown>;
  const keys = Object.keys(message);

  if (
    message.type === "presence" &&
    keys.length === 1
  ) {
    return { type: "presence" };
  }

  if (
    message.type === "flap" &&
    keys.length === 4 &&
    keys.every(
      (key) =>
        key === "type" ||
        key === "player" ||
        key === "seq" ||
        key === "strength",
    ) &&
    (message.player === 1 || message.player === 2) &&
    typeof message.seq === "number" &&
    Number.isSafeInteger(message.seq) &&
    message.seq >= 0 &&
    typeof message.strength === "number" &&
    Number.isFinite(message.strength) &&
    message.strength >= 0 &&
    message.strength <= 1
  ) {
    return {
      type: "flap",
      player: message.player,
      seq: message.seq,
      strength: message.strength,
    };
  }

  return null;
}

function handleClientMessage(
  roomId: string,
  connection: Connection,
  data: unknown,
) {
  const room = rooms.get(roomId);
  if (!room) {
    closeForPolicy(roomId, connection, "Room expired");
    return;
  }

  const now = Date.now();
  if (
    !consumeRateToken(
      connection.messageRate,
      MESSAGE_BURST,
      MESSAGES_PER_SECOND,
      now,
    )
  ) {
    registerViolation(roomId, connection, "Message rate exceeded");
    return;
  }

  if (typeof data !== "string") {
    registerViolation(roomId, connection, "Text messages only");
    return;
  }

  const message = parseClientMessage(data);
  if (!message) {
    registerViolation(roomId, connection, "Invalid message");
    return;
  }

  room.lastActivityAt = now;

  if (message.type === "presence") {
    safeSend(connection.socket, presenceFor(room));
    return;
  }

  if (connection.role.kind !== "player") {
    registerViolation(roomId, connection, "Only players can flap");
    return;
  }

  if (message.player !== connection.role.player) {
    registerViolation(roomId, connection, "Player does not match role");
    return;
  }

  if (message.seq <= connection.lastSeq) {
    return;
  }

  if (
    !consumeRateToken(
      connection.flapRate,
      FLAP_BURST,
      FLAPS_PER_SECOND,
      now,
    )
  ) {
    registerViolation(roomId, connection, "Flap rate exceeded");
    return;
  }

  connection.lastSeq = message.seq;
  const flap: FlapMessage = {
    type: "flap",
    player: connection.role.player,
    seq: message.seq,
    strength: message.strength,
  };

  const host = room.host;
  if (host && !safeSend(host.socket, flap)) {
    cleanupConnection(roomId, host);
  }
}

function sweepExpiredRooms(now: number) {
  for (const [roomId, room] of rooms) {
    if (now - room.lastActivityAt <= ROOM_IDLE_TTL_MS) continue;

    rooms.delete(roomId);
    for (const connection of activeConnections(room)) {
      try {
        connection.socket.close(1001, "Room expired");
      } catch {
        // The socket may already be closed.
      }
    }
  }
}

function roleFromUrl(url: URL): ClientRole | null {
  const role = url.searchParams.get("role");
  if (role === "host" && !url.searchParams.has("player")) {
    return { kind: "host" };
  }

  if (role !== "controller") return null;
  const player = url.searchParams.get("player");
  if (player === "1") return { kind: "player", player: 1 };
  if (player === "2") return { kind: "player", player: 2 };
  return null;
}

function handleWebSocket(request: Request, url: URL) {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return errorResponse(426, "Expected a WebSocket upgrade");
  }

  const roomId = url.searchParams.get("room") ?? "";
  const roomKey = url.searchParams.get("key") ?? "";
  const role = roleFromUrl(url);

  if (!ROOM_ID_PATTERN.test(roomId)) {
    return errorResponse(400, "Invalid room");
  }
  if (!ROOM_KEY_PATTERN.test(roomKey)) {
    return errorResponse(400, "Invalid key");
  }
  if (!role) {
    return errorResponse(400, "Invalid role");
  }

  const now = Date.now();
  sweepExpiredRooms(now);

  let room = rooms.get(roomId);
  if (room && room.key !== roomKey) {
    return errorResponse(403, "Room key rejected");
  }

  if (!room) {
    room = {
      key: roomKey,
      players: {},
      lastActivityAt: now,
    };
    rooms.set(roomId, room);
  }

  if (role.kind === "host" ? room.host : room.players[role.player]) {
    return errorResponse(409, "Role already connected");
  }

  const pair = new WebSocketPairConstructor();
  const client = pair[0];
  const server = pair[1];
  const connection: Connection = {
    socket: server,
    role,
    lastSeq: -1,
    violations: 0,
    messageRate: { tokens: MESSAGE_BURST, updatedAt: now },
    flapRate: { tokens: FLAP_BURST, updatedAt: now },
  };

  server.accept();
  if (role.kind === "host") {
    room.host = connection;
  } else {
    room.players[role.player] = connection;
  }
  room.lastActivityAt = now;

  server.addEventListener("message", (event) => {
    handleClientMessage(roomId, connection, event.data);
  });
  server.addEventListener("close", () => {
    cleanupConnection(roomId, connection);
  });
  server.addEventListener("error", () => {
    cleanupConnection(roomId, connection);
  });

  broadcastPresence(room);

  return new Response(null, {
    status: 101,
    webSocket: client,
  } as ResponseInit & { webSocket: WebSocket });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      return handleWebSocket(request, url);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;

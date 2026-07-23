import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { Plugin, ViteDevServer } from "vite";
import { WebSocket, WebSocketServer } from "ws";

type PlayerNumber = 1 | 2;

type Client =
  | {
      socket: WebSocket;
      role: "host";
    }
  | {
      socket: WebSocket;
      role: "controller";
      player: PlayerNumber;
      lastSequence: number;
    };

type Room = {
  key: string;
  host?: Client & { role: "host" };
  controllers: Partial<
    Record<PlayerNumber, Client & { role: "controller" }>
  >;
};

type ConnectionRequest =
  | {
      room: string;
      key: string;
      role: "host";
    }
  | {
      room: string;
      key: string;
      role: "controller";
      player: PlayerNumber;
    };

type ParsedConnectionRequest =
  | { value: ConnectionRequest }
  | { error: string }
  | null;

type UpgradeServer = NonNullable<ViteDevServer["httpServer"]>;

const ROOM_PATTERN = /^[A-Z2-9]{6}$/;
const KEY_PATTERN = /^[a-f0-9]{32}$/;
const MAX_MESSAGE_BYTES = 512;
const OPEN = WebSocket.OPEN;

function rejectUpgrade(socket: Duplex, status: number, reason: string) {
  const body = `${reason}\n`;
  socket.write(
    `HTTP/1.1 ${status} ${reason}\r\n` +
      "Connection: close\r\n" +
      "Content-Type: text/plain; charset=utf-8\r\n" +
      `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n` +
      body,
  );
  socket.destroy();
}

function parseConnectionRequest(
  request: IncomingMessage,
): ParsedConnectionRequest {
  const url = new URL(request.url ?? "/", "http://screamy-bird.local");
  if (url.pathname !== "/ws") return null;

  const room = url.searchParams.get("room") ?? "";
  const key = url.searchParams.get("key") ?? "";
  const role = url.searchParams.get("role");

  if (!ROOM_PATTERN.test(room) || !KEY_PATTERN.test(key)) {
    return { error: "Invalid room credentials" } as const;
  }

  if (role === "host") {
    return {
      value: { room, key, role } satisfies ConnectionRequest,
    } as const;
  }

  if (role === "controller") {
    const player = Number(url.searchParams.get("player"));
    if (player !== 1 && player !== 2) {
      return { error: "Invalid player number" } as const;
    }
    return {
      value: {
        room,
        key,
        role,
        player,
      } satisfies ConnectionRequest,
    } as const;
  }

  return { error: "Invalid client role" } as const;
}

function send(socket: WebSocket, value: unknown) {
  if (socket.readyState !== OPEN) return;
  socket.send(JSON.stringify(value));
}

function broadcastPresence(room: Room) {
  const players = ([1, 2] as const).filter(
    (player) => room.controllers[player]?.socket.readyState === OPEN,
  );
  const presence = {
    type: "presence",
    host: room.host?.socket.readyState === OPEN,
    players,
  };

  if (room.host) send(room.host.socket, presence);
  for (const player of players) {
    const controller = room.controllers[player];
    if (controller) send(controller.socket, presence);
  }
}

function disconnectClient(rooms: Map<string, Room>, roomId: string, client: Client) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (client.role === "host") {
    if (room.host?.socket === client.socket) room.host = undefined;
  } else if (room.controllers[client.player]?.socket === client.socket) {
    room.controllers[client.player] = undefined;
  }

  if (!room.host && !room.controllers[1] && !room.controllers[2]) {
    rooms.delete(roomId);
    return;
  }
  broadcastPresence(room);
}

function replaceClient(previous: Client | undefined) {
  if (!previous || previous.socket.readyState === WebSocket.CLOSED) return;
  previous.socket.close(4001, "A newer connection replaced this device");
}

function registerClient(
  rooms: Map<string, Room>,
  socket: WebSocket,
  request: ConnectionRequest,
) {
  const existingRoom = rooms.get(request.room);
  if (existingRoom && existingRoom.key !== request.key) {
    socket.close(1008, "Room key mismatch");
    return;
  }

  const room =
    existingRoom ??
    ({
      key: request.key,
      controllers: {},
    } satisfies Room);
  rooms.set(request.room, room);

  const client: Client =
    request.role === "host"
      ? { socket, role: "host" }
      : {
          socket,
          role: "controller",
          player: request.player,
          lastSequence: -1,
        };

  if (client.role === "host") {
    replaceClient(room.host);
    room.host = client;
  } else {
    replaceClient(room.controllers[client.player]);
    room.controllers[client.player] = client;
  }

  socket.on("message", (data, isBinary) => {
    const byteLength = Array.isArray(data)
      ? data.reduce((total, fragment) => total + fragment.byteLength, 0)
      : data.byteLength;
    if (isBinary || byteLength > MAX_MESSAGE_BYTES) {
      socket.close(1008, "Invalid message");
      return;
    }

    if (client.role !== "controller") return;

    let value: unknown;
    try {
      value = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const message = value as Record<string, unknown>;
    const sequence = Number(message.seq);
    const strength = Number(message.strength);

    if (
      message.type !== "flap" ||
      message.player !== client.player ||
      !Number.isInteger(sequence) ||
      sequence <= client.lastSequence ||
      !Number.isFinite(strength)
    ) {
      return;
    }

    client.lastSequence = sequence;
    if (room.host) {
      send(room.host.socket, {
        type: "flap",
        player: client.player,
        seq: sequence,
        strength: Math.min(1, Math.max(0, strength)),
      });
    }
  });

  socket.once("close", () => disconnectClient(rooms, request.room, client));
  socket.once("error", () => disconnectClient(rooms, request.room, client));
  broadcastPresence(room);
}

export function attachScreamyBirdRelay(server: UpgradeServer) {
  const rooms = new Map<string, Room>();
  const webSockets = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    clientTracking: true,
  });

  const handleUpgrade = (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => {
    const parsed = parseConnectionRequest(request);
    if (parsed === null) return;
    if ("error" in parsed) {
      rejectUpgrade(socket, 400, parsed.error);
      return;
    }

    webSockets.handleUpgrade(request, socket, head, (webSocket) => {
      registerClient(rooms, webSocket, parsed.value);
    });
  };

  server.on("upgrade", handleUpgrade);

  const close = () => {
    server.off("upgrade", handleUpgrade);
    for (const socket of webSockets.clients) socket.terminate();
    webSockets.close();
    rooms.clear();
  };
  server.once("close", close);

  return { close };
}

function installRelay(server: {
  httpServer: UpgradeServer | null;
  config: { logger: { info(message: string): void } };
}) {
  if (!server.httpServer) return;
  attachScreamyBirdRelay(server.httpServer);
  server.config.logger.info(
    "Screamy Bird phone relay listening on same-origin /ws",
  );
}

export function screamyBirdRelay(): Plugin {
  return {
    name: "screamy-bird-phone-relay",
    apply: "serve",
    configureServer(server) {
      installRelay(server);
    },
    configurePreviewServer(server) {
      installRelay(server);
    },
  };
}

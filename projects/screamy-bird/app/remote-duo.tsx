"use client";

import QRCode from "qrcode";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type PlayerNumber = 1 | 2;
type ConnectionState = "connecting" | "connected" | "disconnected" | "invalid";
type ControllerMicState =
  | "idle"
  | "requesting"
  | "live"
  | "calibrating"
  | "error";

type RelayMessage =
  | {
      type: "presence";
      host: boolean;
      players: number[];
    }
  | {
      type: "flap";
      player: PlayerNumber;
      seq: number;
      strength: number;
    };

type ArenaPipe = {
  x: number;
  gapY: number;
  scored: boolean;
};

type ArenaWorld = {
  width: number;
  height: number;
  birdY: number;
  birdVelocity: number;
  pipes: ArenaPipe[];
  spawnClock: number;
  spawnIndex: number;
  score: number;
};

const ARENA_GRAVITY = 1400;
const ARENA_FLAP_VELOCITY = -440;
const ARENA_PIPE_SPEED = 172;
const ARENA_PIPE_INTERVAL = 1.5;
const ARENA_PIPE_WIDTH = 58;
const ARENA_FLOOR = 38;
const ARENA_BIRD_RADIUS = 13;
const HOST_SESSION_KEY = "screamy-bird-duo-room";
const MIN_YELL_THRESHOLD = 0.85;
const DEFAULT_YELL_THRESHOLD = 0.9;
const PHONE_DB_FLOOR = -60;
const PHONE_DB_CEILING = 0;
const YELL_HOLD_MS = 65;
const REARM_HOLD_MS = 180;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function createArenaWorld(width: number, height: number): ArenaWorld {
  return {
    width,
    height,
    birdY: (height - ARENA_FLOOR) * 0.48,
    birdVelocity: 0,
    pipes: [],
    spawnClock: 0.7,
    spawnIndex: 0,
    score: 0,
  };
}

function randomToken(bytes: number) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}

function getHostSession() {
  try {
    const stored = window.sessionStorage.getItem(HOST_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { room?: unknown; key?: unknown };
      if (
        typeof parsed.room === "string" &&
        /^[A-Z2-9]{6}$/.test(parsed.room) &&
        typeof parsed.key === "string" &&
        /^[a-f0-9]{32}$/.test(parsed.key)
      ) {
        return { room: parsed.room, key: parsed.key };
      }
    }
  } catch {
    // A fresh room is fine when storage is unavailable or malformed.
  }

  const session = { room: randomRoomCode(), key: randomToken(16) };
  try {
    window.sessionStorage.setItem(HOST_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Private browsing may block storage; the in-memory room still works.
  }
  return session;
}

function defaultRelayUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function createSocketUrl({
  relay,
  room,
  key,
  role,
  player,
}: {
  relay: string;
  room: string;
  key: string;
  role: "host" | "controller";
  player?: PlayerNumber;
}) {
  const url = new URL(relay);
  url.searchParams.set("room", room);
  url.searchParams.set("key", key);
  url.searchParams.set("role", role);
  if (player) url.searchParams.set("player", String(player));
  return url.toString();
}

function drawArenaBackground(
  context: CanvasRenderingContext2D,
  world: ArenaWorld,
  player: PlayerNumber,
  accent: string,
  elapsed: number,
) {
  context.fillStyle = player === 1 ? "#0d1114" : "#11100d";
  context.fillRect(0, 0, world.width, world.height);

  context.strokeStyle =
    player === 1 ? "rgba(53,229,255,.09)" : "rgba(255,77,46,.09)";
  context.lineWidth = 1;
  const offset = (elapsed * 22) % 34;
  for (let x = -34 + offset; x < world.width + 34; x += 34) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, world.height - ARENA_FLOOR);
    context.stroke();
  }
  for (let y = 28; y < world.height - ARENA_FLOOR; y += 34) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(world.width, y);
    context.stroke();
  }

  context.fillStyle = accent;
  context.fillRect(0, world.height - ARENA_FLOOR, world.width, 3);
  context.fillStyle = "#08090b";
  context.fillRect(
    0,
    world.height - ARENA_FLOOR + 3,
    world.width,
    ARENA_FLOOR - 3,
  );

  context.fillStyle = "rgba(244,242,234,.5)";
  context.font = "700 10px monospace";
  context.fillText(`PLAYER 0${player}`, 12, 20);
}

function drawArenaPipe(
  context: CanvasRenderingContext2D,
  world: ArenaWorld,
  pipe: ArenaPipe,
  accent: string,
) {
  const gapSize = clamp(world.height * 0.32, 126, 164);
  const top = pipe.gapY - gapSize / 2;
  const bottom = pipe.gapY + gapSize / 2;
  const floor = world.height - ARENA_FLOOR;

  context.fillStyle = accent;
  context.fillRect(pipe.x, 0, ARENA_PIPE_WIDTH, top);
  context.fillRect(
    pipe.x,
    bottom,
    ARENA_PIPE_WIDTH,
    Math.max(0, floor - bottom),
  );
  context.fillStyle = "#08090b";
  context.fillRect(pipe.x + 8, 0, 6, top);
  context.fillRect(
    pipe.x + 8,
    bottom,
    6,
    Math.max(0, floor - bottom),
  );
  context.fillStyle = "#f4f2ea";
  context.fillRect(pipe.x - 3, Math.max(0, top - 9), ARENA_PIPE_WIDTH + 6, 9);
  context.fillRect(pipe.x - 3, bottom, ARENA_PIPE_WIDTH + 6, 9);
}

function drawArenaBird(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  velocity: number,
  accent: string,
) {
  context.save();
  context.translate(x, y);
  context.rotate(clamp(velocity / 1000, -0.35, 0.65));

  context.fillStyle = accent;
  context.beginPath();
  context.arc(0, 0, ARENA_BIRD_RADIUS, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#08090b";
  context.beginPath();
  context.arc(4, -4, 4, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f4f2ea";
  context.beginPath();
  context.arc(5, -5, 1.5, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f4f2ea";
  context.beginPath();
  context.moveTo(11, 0);
  context.lineTo(24, 5);
  context.lineTo(11, 8);
  context.closePath();
  context.fill();

  context.restore();
}

function DuoViewport({
  player,
  accent,
  roundNonce,
  flapNonce,
  onScore,
  onCrash,
  onManualFlap,
  phoneController,
}: {
  player: PlayerNumber;
  accent: string;
  roundNonce: number;
  flapNonce: number;
  onScore: (player: PlayerNumber, score: number) => void;
  onCrash: (
    player: PlayerNumber,
    score: number,
    survivalMs: number,
  ) => void;
  onManualFlap: (player: PlayerNumber) => void;
  phoneController: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef(createArenaWorld(520, 420));
  const phaseRef = useRef<"waiting" | "playing" | "crashed">("waiting");
  const lastFrameRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const onScoreRef = useRef(onScore);
  const onCrashRef = useRef(onCrash);
  const [phase, setPhase] = useState<"waiting" | "playing" | "crashed">(
    "waiting",
  );
  const [score, setScore] = useState(0);

  useEffect(() => {
    onScoreRef.current = onScore;
    onCrashRef.current = onCrash;
  }, [onCrash, onScore]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(280, rect.width);
    const height = Math.max(310, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (phaseRef.current !== "playing") {
      worldRef.current = createArenaWorld(width, height);
    } else {
      worldRef.current.width = width;
      worldRef.current.height = height;
    }
  }, []);

  useEffect(() => {
    resize();
    const observer = new ResizeObserver(resize);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [resize]);

  useEffect(() => {
    if (roundNonce === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    worldRef.current = createArenaWorld(
      Math.max(280, rect.width),
      Math.max(310, rect.height),
    );
    worldRef.current.birdVelocity = ARENA_FLAP_VELOCITY;
    phaseRef.current = "playing";
    setPhase("playing");
    setScore(0);
    startedAtRef.current = performance.now();
  }, [roundNonce]);

  useEffect(() => {
    if (flapNonce === 0 || phaseRef.current !== "playing") return;
    worldRef.current.birdVelocity = ARENA_FLAP_VELOCITY;
  }, [flapNonce]);

  useEffect(() => {
    const frame = (now: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (canvas && context) {
        const world = worldRef.current;
        const lastFrame = lastFrameRef.current ?? now;
        const delta = clamp((now - lastFrame) / 1000, 0, 0.034);
        lastFrameRef.current = now;
        const elapsed =
          phaseRef.current === "playing"
            ? (now - startedAtRef.current) / 1000
            : now / 1000;

        if (phaseRef.current === "playing") {
          world.birdVelocity += ARENA_GRAVITY * delta;
          world.birdY += world.birdVelocity * delta;
          world.spawnClock += delta;

          if (world.spawnClock >= ARENA_PIPE_INTERVAL) {
            world.spawnClock = 0;
            const gapSize = clamp(world.height * 0.32, 126, 164);
            const playableHeight = world.height - ARENA_FLOOR;
            const margin = gapSize / 2 + 34;
            const seeded =
              (Math.sin(19.7 + world.spawnIndex * 2.137) + 1) / 2;
            world.pipes.push({
              x: world.width + ARENA_PIPE_WIDTH,
              gapY: margin + seeded * (playableHeight - margin * 2),
              scored: false,
            });
            world.spawnIndex += 1;
          }

          for (const pipe of world.pipes) {
            pipe.x -= ARENA_PIPE_SPEED * delta;
            if (
              !pipe.scored &&
              pipe.x + ARENA_PIPE_WIDTH < world.width * 0.24
            ) {
              pipe.scored = true;
              world.score += 1;
              setScore(world.score);
              onScoreRef.current(player, world.score);
            }
          }
          world.pipes = world.pipes.filter(
            (pipe) => pipe.x + ARENA_PIPE_WIDTH > -20,
          );

          const birdX = world.width * 0.24;
          const gapSize = clamp(world.height * 0.32, 126, 164);
          const hitPipe = world.pipes.some((pipe) => {
            const overlaps =
              birdX + ARENA_BIRD_RADIUS > pipe.x &&
              birdX - ARENA_BIRD_RADIUS < pipe.x + ARENA_PIPE_WIDTH;
            if (!overlaps) return false;
            return (
              world.birdY - ARENA_BIRD_RADIUS <
                pipe.gapY - gapSize / 2 ||
              world.birdY + ARENA_BIRD_RADIUS > pipe.gapY + gapSize / 2
            );
          });
          const hitBoundary =
            world.birdY - ARENA_BIRD_RADIUS < 0 ||
            world.birdY + ARENA_BIRD_RADIUS >
              world.height - ARENA_FLOOR;

          if (hitPipe || hitBoundary) {
            phaseRef.current = "crashed";
            setPhase("crashed");
            onCrashRef.current(
              player,
              world.score,
              Math.max(0, now - startedAtRef.current),
            );
          }
        }

        drawArenaBackground(context, world, player, accent, elapsed);
        for (const pipe of world.pipes) {
          drawArenaPipe(context, world, pipe, accent);
        }
        drawArenaBird(
          context,
          world.width * 0.24,
          world.birdY,
          world.birdVelocity,
          accent,
        );
      }

      animationRef.current = requestAnimationFrame(frame);
    };

    animationRef.current = requestAnimationFrame(frame);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [accent, player]);

  return (
    <article
      className="duo-viewport"
      style={{ "--player": accent } as CSSProperties}
    >
      <div className="duo-player-bar">
        <strong>Player {player}</strong>
        <span>{score.toString().padStart(2, "0")}</span>
      </div>
      <div className="duo-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="duo-canvas"
          aria-label={`Player ${player} flight viewport`}
          onPointerDown={() => onManualFlap(player)}
        />
        <div className="duo-phone-overlay">{phoneController}</div>
        {phase !== "playing" && (
          <div className="duo-canvas-state">
            {phase === "waiting" ? "Awaiting launch" : `Crashed at ${score}`}
          </div>
        )}
      </div>
    </article>
  );
}

function PlayerJoinCard({
  player,
  qr,
  controllerUrl,
  connected,
}: {
  player: PlayerNumber;
  qr: string;
  controllerUrl: string;
  connected: boolean;
}) {
  if (connected) {
    return (
      <div className={`join-card is-connected player-${player}`}>
        <span className="phone-live-dot" />
        <strong>Phone {player} live</strong>
        <small>Short screams = flaps</small>
      </div>
    );
  }

  return (
    <div className={`join-card player-${player}`}>
      <div className="join-card-heading">
        <span>Scan to join</span>
        <strong>Player {player}</strong>
      </div>
      <div className="qr-frame">
        {qr ? (
          // This is a generated data URL, so Next image optimization adds no value.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR code for Player ${player} phone controller`} />
        ) : (
          <span>Generating QR…</span>
        )}
      </div>
      <p className={connected ? "join-online" : "join-waiting"}>
        {connected ? "Phone connected" : "Scan with phone camera"}
      </p>
      {controllerUrl && (
        <a className="join-open" href={controllerUrl} target="_blank">
          Open controller
        </a>
      )}
    </div>
  );
}

export function RemoteDuoHost() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const [room, setRoom] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [relayUrl, setRelayUrl] = useState("");
  const [phoneOriginReady, setPhoneOriginReady] = useState(false);
  const [connection, setConnection] =
    useState<ConnectionState>("connecting");
  const [playersConnected, setPlayersConnected] = useState<number[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<PlayerNumber, string>>({
    1: "",
    2: "",
  });
  const [controllerUrls, setControllerUrls] = useState<
    Record<PlayerNumber, string>
  >({ 1: "", 2: "" });
  const [roundNonce, setRoundNonce] = useState(0);
  const [flapNonces, setFlapNonces] = useState<[number, number]>([0, 0]);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [crashed, setCrashed] = useState<[boolean, boolean]>([false, false]);
  const [survivalMs, setSurvivalMs] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const configFrame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const session = getHostSession();
      setRoom(session.room);
      setRoomKey(session.key);
      setRelayUrl(params.get("relay") || defaultRelayUrl());
      setPhoneOriginReady(
        window.location.protocol === "https:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1",
      );
    });
    return () => window.cancelAnimationFrame(configFrame);
  }, []);

  useEffect(() => {
    if (!room || !roomKey || !relayUrl) return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setConnection("connecting");

      try {
        const socket = new WebSocket(
          createSocketUrl({
            relay: relayUrl,
            room,
            key: roomKey,
            role: "host",
          }),
        );
        socketRef.current = socket;

        socket.addEventListener("open", () => setConnection("connected"));
        socket.addEventListener("message", (event) => {
          try {
            const message = JSON.parse(String(event.data)) as RelayMessage;
            if (message.type === "presence") {
              setPlayersConnected(message.players);
            } else if (message.type === "flap") {
              setFlapNonces((current) => {
                const next: [number, number] = [...current];
                next[message.player - 1] += 1;
                return next;
              });
            }
          } catch {
            // Invalid relay data is ignored; gameplay must not crash.
          }
        });
        socket.addEventListener("close", () => {
          if (cancelled) return;
          setConnection("disconnected");
          reconnectTimerRef.current = window.setTimeout(connect, 1200);
        });
        socket.addEventListener("error", () => {
          setConnection("disconnected");
        });
      } catch {
        setConnection("invalid");
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [relayUrl, room, roomKey]);

  useEffect(() => {
    if (!room || !roomKey || !relayUrl) return;

    const makeControllerUrl = (player: PlayerNumber) => {
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("controller", "1");
      url.searchParams.set("room", room);
      url.searchParams.set("player", String(player));
      if (relayUrl !== defaultRelayUrl()) {
        url.searchParams.set("relay", relayUrl);
      }
      url.hash = roomKey;
      return url.toString();
    };

    const playerOneUrl = makeControllerUrl(1);
    const playerTwoUrl = makeControllerUrl(2);

    void Promise.all([
      QRCode.toDataURL(playerOneUrl, {
        width: 220,
        margin: 1,
        color: { dark: "#08090b", light: "#f4f2ea" },
      }),
      QRCode.toDataURL(playerTwoUrl, {
        width: 220,
        margin: 1,
        color: { dark: "#08090b", light: "#f4f2ea" },
      }),
    ]).then(([playerOne, playerTwo]) => {
      setQrCodes({ 1: playerOne, 2: playerTwo });
      setControllerUrls({ 1: playerOneUrl, 2: playerTwoUrl });
    });
  }, [relayUrl, room, roomKey]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "KeyA") {
        setFlapNonces((current) => [current[0] + 1, current[1]]);
      } else if (event.code === "KeyL") {
        setFlapNonces((current) => [current[0], current[1] + 1]);
      } else {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const manualFlap = (player: PlayerNumber) => {
    setFlapNonces((current) =>
      player === 1
        ? [current[0] + 1, current[1]]
        : [current[0], current[1] + 1],
    );
  };

  const startRound = () => {
    setScores([0, 0]);
    setCrashed([false, false]);
    setSurvivalMs([0, 0]);
    setRoundNonce((current) => current + 1);
  };

  const handleScore = (player: PlayerNumber, nextScore: number) => {
    setScores((current) =>
      player === 1 ? [nextScore, current[1]] : [current[0], nextScore],
    );
  };

  const handleCrash = (
    player: PlayerNumber,
    finalScore: number,
    finalSurvivalMs: number,
  ) => {
    handleScore(player, finalScore);
    setCrashed((current) =>
      player === 1 ? [true, current[1]] : [current[0], true],
    );
    setSurvivalMs((current) =>
      player === 1
        ? [finalSurvivalMs, current[1]]
        : [current[0], finalSurvivalMs],
    );
  };

  let winner = "";
  if (crashed[0] && crashed[1]) {
    if (scores[0] !== scores[1]) {
      winner = scores[0] > scores[1] ? "PLAYER 1 WINS" : "PLAYER 2 WINS";
    } else {
      const survivalDifference = survivalMs[0] - survivalMs[1];
      if (Math.abs(survivalDifference) < 25) {
        winner = "DRAW";
      } else {
        const survivor = survivalDifference > 0 ? 1 : 2;
        winner = `PLAYER ${survivor} WINS THE SURVIVAL TIEBREAK`;
      }
    }
  }

  return (
    <main className="app-shell remote-host-shell">
      <div className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            2P
          </span>
          <span>Screamy Bird Remote Flight Control</span>
        </div>
        <div className="system-state">
          <span
            className={`status-dot ${connection !== "connected" ? "status-dot-offline" : ""}`}
          />
          Relay {connection}
        </div>
      </div>

      <div className="page">
        <header className="remote-hero">
          <div>
            <p className="eyebrow">Room {room || "------"} / two-player mode</p>
            <h1>Phone Mic Duel</h1>
          </div>
          <div className="remote-hero-actions">
            <a className="mode-link" href="./">
              Single player
            </a>
            <button
              className="mode-link"
              type="button"
              onClick={() => void document.documentElement.requestFullscreen?.()}
            >
              Fullscreen
            </button>
            <button className="primary-button" type="button" onClick={startRound}>
              {roundNonce === 0 ? "Launch both birds" : "Restart duel"}
            </button>
          </div>
        </header>

        {!phoneOriginReady && (
          <aside className="phone-origin-warning">
            <strong>QR preview only on localhost.</strong>
            Open this host screen through an HTTPS tunnel or its deployed URL
            before scanning; a phone cannot reach the laptop&apos;s localhost.
          </aside>
        )}

        <section className="duo-grid" aria-label="Two-player game">
          <DuoViewport
            player={1}
            accent="#35e5ff"
            roundNonce={roundNonce}
            flapNonce={flapNonces[0]}
            onScore={handleScore}
            onCrash={handleCrash}
            onManualFlap={manualFlap}
            phoneController={
              <PlayerJoinCard
                player={1}
                qr={qrCodes[1]}
                controllerUrl={controllerUrls[1]}
                connected={playersConnected.includes(1)}
              />
            }
          />
          <DuoViewport
            player={2}
            accent="#ff4d2e"
            roundNonce={roundNonce}
            flapNonce={flapNonces[1]}
            onScore={handleScore}
            onCrash={handleCrash}
            onManualFlap={manualFlap}
            phoneController={
              <PlayerJoinCard
                player={2}
                qr={qrCodes[2]}
                controllerUrl={controllerUrls[2]}
                connected={playersConnected.includes(2)}
              />
            }
          />
        </section>

        <div className="duo-result" aria-live="polite">
          {winner || "Identical pipes. Separate screams. Questionable fairness."}
        </div>

        <footer className="remote-flight-strip">
          <span>Scan your side · enable mic · calibrate · scream in bursts</span>
          <span>Audio stays on each phone</span>
          <span>
            Keyboard backup: <strong>A</strong> / <strong>L</strong>
          </span>
        </footer>
      </div>
    </main>
  );
}

export function RemoteMicController() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const audioFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRef = useRef(0);
  const thresholdRef = useRef(DEFAULT_YELL_THRESHOLD);
  const armedRef = useRef(true);
  const aboveThresholdSinceRef = useRef<number | null>(null);
  const belowRearmSinceRef = useRef<number | null>(null);
  const lastTriggerRef = useRef(0);
  const sequenceRef = useRef(0);
  const wakeLockRef = useRef<{ release(): Promise<void> } | null>(null);

  const [room, setRoom] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [player, setPlayer] = useState<PlayerNumber>(1);
  const [relayUrl, setRelayUrl] = useState("");
  const [connection, setConnection] =
    useState<ConnectionState>("connecting");
  const [hostOnline, setHostOnline] = useState(false);
  const [micState, setMicState] = useState<ControllerMicState>("idle");
  const [level, setLevel] = useState(0);
  const [threshold, setThreshold] = useState(DEFAULT_YELL_THRESHOLD);
  const [decibels, setDecibels] = useState<number | null>(null);
  const [lastFlap, setLastFlap] = useState("No flap sent yet");

  const requestWakeLock = useCallback(async () => {
    const wakeNavigator = navigator as Navigator & {
      wakeLock?: {
        request(type: "screen"): Promise<{ release(): Promise<void> }>;
      };
    };
    try {
      wakeLockRef.current =
        (await wakeNavigator.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    const configFrame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const parsedPlayer = params.get("player") === "2" ? 2 : 1;
      setRoom(params.get("room") || "");
      setRoomKey(decodeURIComponent(window.location.hash.slice(1)));
      setPlayer(parsedPlayer);
      setRelayUrl(params.get("relay") || defaultRelayUrl());
      document.title = `Player ${parsedPlayer} Mic — Screamy Bird`;
    });
    return () => window.cancelAnimationFrame(configFrame);
  }, []);

  useEffect(() => {
    if (!room || !roomKey || !relayUrl) {
      if (room || roomKey || relayUrl) {
        const invalidFrame = window.requestAnimationFrame(() =>
          setConnection("invalid"),
        );
        return () => window.cancelAnimationFrame(invalidFrame);
      }
      return;
    }

    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      try {
        const socket = new WebSocket(
          createSocketUrl({
            relay: relayUrl,
            room,
            key: roomKey,
            role: "controller",
            player,
          }),
        );
        socketRef.current = socket;
        socket.addEventListener("open", () => setConnection("connected"));
        socket.addEventListener("message", (event) => {
          try {
            const message = JSON.parse(String(event.data)) as RelayMessage;
            if (message.type === "presence") {
              setHostOnline(message.host);
            }
          } catch {
            // Invalid relay data is ignored.
          }
        });
        socket.addEventListener("close", () => {
          if (cancelled) return;
          setConnection("disconnected");
          setHostOnline(false);
          reconnectTimerRef.current = window.setTimeout(connect, 1200);
        });
        socket.addEventListener("error", () =>
          setConnection("disconnected"),
        );
      } catch {
        setConnection("invalid");
      }
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [player, relayUrl, room, roomKey]);

  const sendFlap = useCallback(
    (strength = 1) => {
      sequenceRef.current += 1;
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "flap",
            player,
            seq: sequenceRef.current,
            strength: clamp(strength, 0, 1),
          }),
        );
        setLastFlap(`Flap ${sequenceRef.current} sent`);
      } else {
        setLastFlap("Flap blocked — relay offline");
      }
    },
    [player],
  );

  const stopMicrophone = useCallback(() => {
    if (audioFrameRef.current !== null) {
      cancelAnimationFrame(audioFrameRef.current);
      audioFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    void wakeLockRef.current?.release();
    wakeLockRef.current = null;
    levelRef.current = 0;
    setLevel(0);
    setDecibels(null);
    setMicState("idle");
  }, []);

  const startMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("error");
      return;
    }
    setMicState("requesting");

    let pendingStream: MediaStream | null = null;
    let pendingContext: AudioContext | null = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      pendingStream = stream;
      const audioContext = new AudioContext();
      pendingContext = audioContext;
      await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.5;
      audioContext.createMediaStreamSource(stream).connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setMicState("live");

      await requestWakeLock();

      const samples = new Float32Array(analyser.fftSize);
      let lastUiUpdate = 0;
      const read = (now: number) => {
        const activeAnalyser = analyserRef.current;
        if (!activeAnalyser) return;
        activeAnalyser.getFloatTimeDomainData(samples);
        let squares = 0;
        for (const sample of samples) squares += sample * sample;
        const rms = Math.sqrt(squares / samples.length);
        const db = rms > 0.00001 ? 20 * Math.log10(rms) : -80;
        // Phone microphones sit much closer to the player than a laptop mic.
        // Use an actual -60..0 dBFS scale so the 90% gate means roughly -6 dBFS,
        // rather than letting ordinary close-range speech cross the line.
        const normalized = clamp(
          (db - PHONE_DB_FLOOR) / (PHONE_DB_CEILING - PHONE_DB_FLOOR),
          0,
          1,
        );
        levelRef.current = normalized;

        if (now - lastUiUpdate > 42) {
          setLevel(normalized);
          setDecibels(db);
          lastUiUpdate = now;
        }

        const crossed = normalized >= thresholdRef.current;
        if (crossed) {
          aboveThresholdSinceRef.current ??= now;
          belowRearmSinceRef.current = null;
          const heldLongEnough =
            now - aboveThresholdSinceRef.current >= YELL_HOLD_MS;
          if (
            heldLongEnough &&
            armedRef.current &&
            now - lastTriggerRef.current > 210
          ) {
            armedRef.current = false;
            lastTriggerRef.current = now;
            sendFlap(normalized);
          }
        } else {
          aboveThresholdSinceRef.current = null;
          const belowRearmLine =
            normalized < Math.max(0.08, thresholdRef.current - 0.1);
          if (belowRearmLine) {
            belowRearmSinceRef.current ??= now;
            if (now - belowRearmSinceRef.current >= REARM_HOLD_MS) {
              armedRef.current = true;
            }
          } else {
            belowRearmSinceRef.current = null;
          }
        }
        audioFrameRef.current = requestAnimationFrame(read);
      };

      audioFrameRef.current = requestAnimationFrame(read);
    } catch {
      pendingStream?.getTracks().forEach((track) => track.stop());
      void pendingContext?.close();
      streamRef.current = null;
      audioContextRef.current = null;
      analyserRef.current = null;
      setMicState("error");
    }
  }, [requestWakeLock, sendFlap]);

  const calibrate = useCallback(() => {
    if (micState !== "live") return;
    setMicState("calibrating");
    const started = performance.now();
    let peak = 0;
    const sample = (now: number) => {
      peak = Math.max(peak, levelRef.current);
      if (now - started < 1200) {
        requestAnimationFrame(sample);
        return;
      }
      const next = clamp(
        Math.max(DEFAULT_YELL_THRESHOLD, peak + 0.1),
        MIN_YELL_THRESHOLD,
        0.97,
      );
      thresholdRef.current = next;
      setThreshold(next);
      setMicState("live");
    };
    requestAnimationFrame(sample);
  }, [micState]);

  useEffect(
    () => () => {
      if (audioFrameRef.current !== null) {
        cancelAnimationFrame(audioFrameRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
      void wakeLockRef.current?.release();
    },
    [],
  );

  useEffect(() => {
    const restorePhoneAudio = () => {
      if (document.visibilityState !== "visible") {
        wakeLockRef.current = null;
        return;
      }
      if (!streamRef.current) return;
      void audioContextRef.current?.resume();
      void requestWakeLock();
    };

    document.addEventListener("visibilitychange", restorePhoneAudio);
    return () =>
      document.removeEventListener("visibilitychange", restorePhoneAudio);
  }, [requestWakeLock]);

  const changeThreshold = (next: number) => {
    thresholdRef.current = next;
    setThreshold(next);
    armedRef.current = true;
    aboveThresholdSinceRef.current = null;
    belowRearmSinceRef.current = null;
  };

  if (connection === "invalid") {
    return (
      <main className="controller-shell controller-invalid">
        <p className="eyebrow">Connection rejected</p>
        <h1>Scan the QR again.</h1>
        <p>This controller link is incomplete or expired.</p>
      </main>
    );
  }

  return (
    <main
      className={`controller-shell controller-player-${player}`}
      style={
        {
          "--controller-level": `${level * 100}%`,
          "--controller-threshold": `${threshold * 100}%`,
        } as CSSProperties
      }
    >
      <div className="controller-topline">
        <span>Room {room || "------"}</span>
        <span className={`controller-connection state-${connection}`}>
          {connection === "connected"
            ? hostOnline
              ? "host live"
              : "waiting for host"
            : connection}
        </span>
      </div>

      <header className="controller-header">
        <p>Remote vocal input</p>
        <h1>Player {player}</h1>
      </header>

      <section className="controller-meter" aria-label="Phone microphone level">
        <div className="controller-meter-fill" />
        <div className="controller-threshold-line">
          <span>YELL</span>
        </div>
        <strong>
          {decibels === null ? "—" : Math.round(clamp(decibels, -80, 0))} dB
        </strong>
      </section>

      <div className="controller-threshold-control">
        <label htmlFor="phone-threshold">
          Yell gate <strong>{Math.round(threshold * 100)}%</strong>
        </label>
        <input
          id="phone-threshold"
          type="range"
          min={MIN_YELL_THRESHOLD * 100}
          max="97"
          value={Math.round(threshold * 100)}
          onChange={(event) =>
            changeThreshold(Number(event.target.value) / 100)
          }
        />
      </div>

      <section className="controller-actions">
        {micState === "live" || micState === "calibrating" ? (
          <button
            className="controller-arm is-live"
            type="button"
            onClick={stopMicrophone}
          >
            Mic live — tap to stop
          </button>
        ) : (
          <button
            className="controller-arm"
            type="button"
            onClick={startMicrophone}
            disabled={micState === "requesting"}
          >
            {micState === "requesting"
              ? "Waiting for permission"
              : micState === "error"
                ? "Retry microphone"
                : "Enable microphone"}
          </button>
        )}
        <button
          className="controller-secondary"
          type="button"
          onClick={calibrate}
          disabled={micState !== "live"}
        >
          {micState === "calibrating" ? "Stay quiet…" : "Calibrate room"}
        </button>
        <button
          className="controller-test-flap"
          type="button"
          onPointerDown={() => sendFlap(1)}
        >
          Test flap
        </button>
      </section>

      <footer className="controller-footer">
        <strong>{lastFlap}</strong>
        <span>Audio stays on this phone. Keep this tab open and awake.</span>
      </footer>
    </main>
  );
}

"use client";

import { create } from "zustand";
import type {
  AgentState,
  AgentType,
  Beat,
  ChatMessage,
  DecisionDoc,
  DemoSpeed,
  LiveMetric,
  MeetingRequest,
  NegotiationStatus,
  PhaseKey,
  ProposedSlot,
} from "@/lib/types";
import { AGENT_TYPES } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { createEngine, isIncidentTrigger, type EngineMode, type NegotiationEngine } from "@/lib/engine/provider";

const SPEED: Record<DemoSpeed, { typing: number; pause: number; gap: number }> = {
  realistic: { typing: 1.0, pause: 1.0, gap: 420 },
  presentation: { typing: 0.5, pause: 0.44, gap: 200 },
  unhinged: { typing: 0.16, pause: 0.12, gap: 70 },
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function defaultAgentStates(): Record<AgentType, AgentState> {
  const out = {} as Record<AgentType, AgentState>;
  for (const a of AGENT_TYPES) {
    out[a] = { agent: a, position: "undecided", confidence: 50, objections: [], conditions: [], present: true };
  }
  return out;
}

interface ChatState {
  negotiationId: string | null;
  request: MeetingRequest | null;
  engine: NegotiationEngine | null;

  messages: ChatMessage[];
  typing: AgentType[];
  consensus: number;
  consensusNote?: string;
  phaseKey: PhaseKey;
  phaseOfNine?: number;
  phaseNote?: string;
  status: NegotiationStatus;
  agentStates: Record<AgentType, AgentState>;
  presentAgents: AgentType[];
  slots: ProposedSlot[];
  metrics: LiveMetric[];
  decision: DecisionDoc | null;

  awaiting: null | { mode: string; question?: string; quick?: string[]; placeholder?: string };
  incidentMode: boolean;
  crisisMode: boolean;
  finished: boolean;

  speed: DemoSpeed;
  playing: boolean;
  paused: boolean;
  startedAt: number;
  elapsedMs: number;

  // internal
  queue: Beat[];
  refMap: Record<string, string>;
  msgSeq: number;

  // actions
  init: (request: MeetingRequest, opts?: { userName?: string; committeeName?: string; mode?: EngineMode; seed?: string | number; speed?: DemoSpeed; autoIncident?: boolean }) => void;
  sendUserMessage: (text: string) => Promise<void>;
  submitDecision: (action: "accept" | "appeal" | "ignore" | "modify") => Promise<void>;
  submitCorrective: (action: "accept" | "appeal" | "rebel") => Promise<void>;
  nominateSlot: (slot: ProposedSlot) => void;
  setSpeed: (s: DemoSpeed) => void;
  togglePause: () => void;
  reset: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;
function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export const useChatStore = create<ChatState>((set, get) => {
  // ---- internal helpers ----
  function nextMsgId(): string {
    const seq = get().msgSeq + 1;
    set({ msgSeq: seq });
    return `m${seq}`;
  }

  function addMessage(beat: Extract<Beat, { t: "msg" }>) {
    const id = nextMsgId();
    const st = get();
    let replyToId: string | undefined;
    let replyToPreview: string | undefined;
    let replyToAgent: ChatMessage["replyToAgent"];
    if (beat.replyTo && st.refMap[beat.replyTo]) {
      replyToId = st.refMap[beat.replyTo];
      const target = st.messages.find((m) => m.id === replyToId);
      if (target) {
        replyToPreview = target.body.slice(0, 90);
        replyToAgent =
          target.agent ??
          (target.sender === "user" || target.sender === "system" ? target.sender : undefined);
      }
    }
    const msg: ChatMessage = {
      id,
      sender: beat.sender,
      agent: beat.agent,
      body: beat.body,
      type: beat.type ?? "text",
      replyToId,
      replyToPreview,
      replyToAgent,
      metadata: beat.metadata,
      voiceSeconds: beat.voiceSeconds,
      createdAt: Date.now(),
    };
    const refMap = beat.ref ? { ...st.refMap, [beat.ref]: id } : st.refMap;
    set({ messages: [...st.messages, msg], refMap });
    // Reflect agent position hints from vote cards etc. (light touch)
    if (beat.type === "vote_card" && beat.metadata?.votes) {
      applyVotesToPositions(beat.metadata.votes as { agent: AgentType; vote: any }[]);
    }
  }

  function applyVotesToPositions(votes: { agent: AgentType; vote: any }[]) {
    const states = { ...get().agentStates };
    for (const v of votes) {
      if (states[v.agent]) states[v.agent] = { ...states[v.agent], position: v.vote, vote: v.vote };
    }
    set({ agentStates: states });
  }

  function pushSystem(body: string) {
    const id = nextMsgId();
    set({
      messages: [
        ...get().messages,
        { id, sender: "system", body, type: "system", createdAt: Date.now() },
      ],
    });
  }

  function pushCard(type: ChatMessage["type"], metadata: Record<string, unknown>, body = "") {
    const id = nextMsgId();
    set({
      messages: [...get().messages, { id, sender: "system", body, type, metadata, createdAt: Date.now() }],
    });
  }

  function applyReaction(beat: Extract<Beat, { t: "react" }>) {
    const id = get().refMap[beat.ref];
    if (!id) return;
    const messages = get().messages.map((m) => {
      if (m.id !== id) return m;
      const reactions = m.reactions ? [...m.reactions] : [];
      const existing = reactions.find((r) => r.emoji === beat.emoji);
      if (existing) existing.agents = uniq([...existing.agents, ...beat.agents]);
      else reactions.push({ emoji: beat.emoji, agents: beat.agents });
      return { ...m, reactions };
    });
    set({ messages });
  }

  function applyEdit(beat: Extract<Beat, { t: "edit" }>) {
    const id = get().refMap[beat.ref];
    if (!id) return;
    const messages = get().messages.map((m) =>
      m.id === id ? { ...m, editedFrom: m.body, body: beat.body, edited: true } : m,
    );
    set({ messages });
  }

  function enqueue(beats: Beat[]) {
    set({ queue: [...get().queue, ...beats], finished: false });
  }

  function play() {
    if (get().playing) return;
    set({ playing: true, paused: false });
    pump();
  }

  function pump() {
    clearTimer();
    const st = get();
    if (st.paused) {
      set({ playing: false });
      return;
    }
    const q = st.queue;
    if (q.length === 0) {
      set({ playing: false, typing: [] });
      return;
    }
    const beat = q[0];
    const s = SPEED[st.speed];
    const advance = () => {
      set({ queue: get().queue.slice(1) });
      pump();
    };
    const wait = (ms: number, fn: () => void) => {
      timer = setTimeout(fn, Math.max(0, ms));
    };

    switch (beat.t) {
      case "typing": {
        set({ typing: uniq([...st.typing, ...beat.agents]) });
        wait(beat.ms * s.typing, advance);
        break;
      }
      case "msg": {
        if (beat.sender === "agent" && beat.agent) {
          const agent = beat.agent;
          set({ typing: uniq([...get().typing, agent]) });
          const td = (beat.typingMs ?? clamp(beat.body.length * 20, 380, 1500)) * s.typing;
          wait(td, () => {
            addMessage(beat);
            set({ typing: get().typing.filter((a) => a !== agent) });
            wait(s.gap, advance);
          });
        } else {
          const d = (beat.sender === "user" ? 40 : clamp((beat.body?.length || 12) * 10, 260, 900)) * s.typing;
          wait(d, () => {
            addMessage(beat);
            wait(s.gap, advance);
          });
        }
        break;
      }
      case "react": {
        applyReaction(beat);
        wait(260 * s.pause, advance);
        break;
      }
      case "edit": {
        applyEdit(beat);
        wait(340 * s.pause, advance);
        break;
      }
      case "consensus": {
        const prev = st.consensus;
        set({ consensus: beat.to, consensusNote: beat.note });
        if (Math.abs(beat.to - prev) >= 3 || beat.note) {
          const dir = beat.to < prev ? "decreased" : "increased";
          pushSystem(`Council consensus has ${dir} from ${prev}% to ${beat.to}%.${beat.note ? " " + beat.note : ""}`);
        }
        wait(360 * s.pause, advance);
        break;
      }
      case "phase": {
        set({ phaseKey: beat.phaseKey, phaseOfNine: beat.ofNine, phaseNote: beat.note });
        if (beat.note) pushSystem(beat.note);
        wait(220 * s.pause, advance);
        break;
      }
      case "status": {
        set({ status: beat.status });
        wait(120 * s.pause, advance);
        break;
      }
      case "metrics": {
        set({ metrics: beat.metrics });
        pushCard("metric_card", { metrics: beat.metrics });
        wait(320 * s.pause, advance);
        break;
      }
      case "slots": {
        set({ slots: beat.slots });
        pushCard("slot_card", { slots: beat.slots });
        wait(320 * s.pause, advance);
        break;
      }
      case "positions": {
        const states = { ...get().agentStates };
        for (const p of beat.states) {
          if (p.agent && states[p.agent]) states[p.agent] = { ...states[p.agent], ...p } as AgentState;
        }
        set({ agentStates: states });
        wait(120 * s.pause, advance);
        break;
      }
      case "removeAgent": {
        const states = { ...get().agentStates };
        if (states[beat.agent]) states[beat.agent] = { ...states[beat.agent], present: false };
        set({ agentStates: states, presentAgents: get().presentAgents.filter((a) => a !== beat.agent) });
        wait(200 * s.pause, advance);
        break;
      }
      case "rejoinAgent": {
        const states = { ...get().agentStates };
        if (states[beat.agent]) states[beat.agent] = { ...states[beat.agent], present: true };
        set({ agentStates: states, presentAgents: uniq([...get().presentAgents, beat.agent]) });
        wait(200 * s.pause, advance);
        break;
      }
      case "decision": {
        set({ decision: beat.doc });
        pushCard("decision_doc", { doc: beat.doc });
        wait(500 * s.pause, advance);
        break;
      }
      case "crisis": {
        set({ crisisMode: true });
        wait(300 * s.pause, advance);
        break;
      }
      case "pause": {
        wait(beat.ms * s.pause, advance);
        break;
      }
      case "awaitUser": {
        set({
          awaiting: { mode: beat.mode, question: beat.question, quick: beat.quick, placeholder: beat.placeholder },
          playing: false,
          typing: [],
          queue: get().queue.slice(1),
        });
        break;
      }
      case "end": {
        set({ finished: true, playing: false, typing: [], queue: [] });
        break;
      }
      default:
        advance();
    }

    // keep a live elapsed clock
    if (get().startedAt) set({ elapsedMs: Date.now() - get().startedAt });
  }

  function addUserMessage(text: string) {
    const id = nextMsgId();
    set({
      messages: [...get().messages, { id, sender: "user", body: text, type: "text", createdAt: Date.now() }],
    });
  }

  return {
    negotiationId: null,
    request: null,
    engine: null,
    messages: [],
    typing: [],
    consensus: 41,
    phaseKey: "submitted",
    status: "initial_review",
    agentStates: defaultAgentStates(),
    presentAgents: [...AGENT_TYPES],
    slots: [],
    metrics: [],
    decision: null,
    awaiting: null,
    incidentMode: false,
    crisisMode: false,
    finished: false,
    speed: "presentation",
    playing: false,
    paused: false,
    startedAt: 0,
    elapsedMs: 0,
    queue: [],
    refMap: {},
    msgSeq: 0,

    init: (request, opts = {}) => {
      clearTimer();
      const engine = createEngine(request, {
        userName: opts.userName,
        committeeName: opts.committeeName,
        seed: opts.seed,
        mode: opts.mode,
      });
      set({
        negotiationId: opts.seed ? String(opts.seed) : request.title,
        request,
        engine,
        messages: [],
        typing: [],
        consensus: 41,
        consensusNote: undefined,
        phaseKey: "submitted",
        phaseOfNine: 1,
        phaseNote: undefined,
        status: "initial_review",
        agentStates: defaultAgentStates(),
        presentAgents: [...AGENT_TYPES],
        slots: [],
        metrics: [],
        decision: null,
        awaiting: null,
        incidentMode: Boolean(opts.autoIncident),
        crisisMode: false,
        finished: false,
        speed: opts.speed ?? get().speed ?? "presentation",
        playing: false,
        paused: false,
        startedAt: Date.now(),
        elapsedMs: 0,
        queue: [],
        refMap: {},
        msgSeq: 0,
      });
      if (opts.autoIncident) {
        addUserMessage("Guys, I already went to the meeting.");
        engine.incidentOpening().then((beats) => {
          enqueue(beats);
          play();
        });
      } else {
        engine.opening().then((beats) => {
          enqueue(beats);
          play();
        });
      }
    },

    sendUserMessage: async (text) => {
      const st = get();
      if (!st.engine || !text.trim()) return;
      addUserMessage(text);
      const awaiting = st.awaiting;
      set({ awaiting: null });

      // Incident can trigger at ANY point.
      if (isIncidentTrigger(text) && !st.incidentMode) {
        set({ incidentMode: true });
        const beats = await st.engine.incidentOpening();
        enqueue(beats);
        play();
        return;
      }
      if (st.incidentMode) {
        const beats = await st.engine.incidentAfterAnswer(text);
        enqueue(beats);
        play();
        return;
      }
      if (awaiting?.mode === "answer") {
        const beats = await st.engine.afterAnswer(text);
        enqueue(beats);
        play();
        return;
      }
      // free chat otherwise — a brief acknowledgement keeps the room alive
      if (!st.playing) {
        pushSystem("Submission noted. The Council does not consider unsolicited testimony binding.");
      }
    },

    submitDecision: async (action) => {
      const st = get();
      if (!st.engine) return;
      set({ awaiting: null });
      const beats = await st.engine.onDecision(action);
      enqueue(beats);
      play();
    },

    submitCorrective: async (action) => {
      const st = get();
      if (!st.engine) return;
      set({ awaiting: null });
      const beats = await st.engine.correctiveResponse(action);
      enqueue(beats);
      play();
    },

    nominateSlot: (slot) => {
      addUserMessage(`I nominate ${slot.label}.`);
      pushSystem(`Nomination recorded: ${slot.label} (consensus ${slot.consensus}%). The Council will now ignore it and recommend Tuesday.`);
    },

    setSpeed: (s) => set({ speed: s }),
    togglePause: () => {
      const paused = !get().paused;
      set({ paused });
      if (!paused) play();
      else clearTimer();
    },
    reset: () => {
      clearTimer();
      set({
        messages: [],
        typing: [],
        queue: [],
        awaiting: null,
        decision: null,
        incidentMode: false,
        crisisMode: false,
        finished: false,
        playing: false,
        paused: false,
      });
    },
  };
});

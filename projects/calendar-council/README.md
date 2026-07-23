# Calendar Council

> **Your calendar shouldn't be your decision.**
> 12 AI agents. One calendar. Zero personal autonomy.

*SLOPATHON OP001 · HACK//OPS · Karlsruhe · 23.07.2026*

---

## 🎯 The bad idea (one sentence)

Adding an event to your calendar should require the unanimous-ish approval of **twelve
passive-aggressive AI agents** who represent competing areas of your life and would rather
you did nothing at all.

## 🏛️ The build (what did you make?)

**Calendar Council** is a fully-featured, aggressively over-engineered SaaS product that makes
scheduling *dramatically harder*. Instead of clicking "Save," you submit a **request for
review**. A group chat of 12 specialised agents — Sleep, Career, Gym, Relationship, Social
Battery, Finance, Weather, Circadian Rhythm, Logistics, Nutrition, Productivity and Chaos —
then debate, interrogate you, form alliances, insult each other, run a formal vote, and issue
a bureaucratic decision. The decision is almost always **"Maybe Tuesday."**

Everything looks like a legitimate, venture-backed AI productivity startup. That is the joke.

It's a complete product, not a prototype:

- Premium marketing site (landing, features, how-it-works, pricing, about)
- Registration, login, and **one-click demo account**
- 7-step onboarding ("Council Formation Protocol") with a personalised constitution
- Dashboard, calendar, negotiation history, and absurd governance analytics
- A **live multi-agent group chat** with typing indicators, reactions, replies, edits,
  voice-note stubs, polls, animated votes, risk metrics, proposed time slots, and sealed
  decision documents
- "My Council" — reconfigure each agent's influence / veto / aggression (they react when you
  cut their power)
- Mock integrations with fake OAuth flows, settings, and a mocked billing page
- A **catastrophic "I already went" incident** escalation ending in a constitutional crisis

## ▶️ The proof (run it)

No API keys. No external services. Node 18+ and pnpm.

```bash
cd calendar-council
pnpm install
pnpm setup        # creates + seeds the local SQLite database
pnpm dev          # http://localhost:3000   (or: pnpm build && pnpm start)
```

Then, for the fastest path:

1. Open the site → **"Enter Demo Account"** (credentials are pre-filled — no signup).
2. Sidebar → **"Launch Alex Demo"**.
3. Watch the Council fight. Answer the interrogation with the quick reply
   *"Because I want to see my friend."*
4. Set the header speed control to **Presentation** so the comedy stays tight.
5. When the decision arrives, type into the chat:
   > **Guys, I already went to the meeting.**
6. Enjoy the institutional meltdown → click **"Do Whatever I Want Again"** → **constitutional crisis.**

## 💥 The damage (what broke beautifully?)

- A request for *coffee* generates **stakeholder analysis, risk scoring, a formal vote, and a
  post-meeting compliance report.**
- The progress bar **moves backwards** ("Phase 4 of 9: Foundational Disagreement").
- Consensus routinely collapses to *"Institutional collapse."*
- The Council spends **longer deliberating than the event would take**, and reports
  **"47 minutes of negative time saved."**
- Chaos Agent gets removed from the Council and **rejoins "using another account."**
- The final decision **expires four minutes before it was issued.**
- Attending an event without approval triggers an **Incident Review** (Preventability: 100%,
  Council Awareness: 0%) and a 30-day probation. Rebel twice and the Council begins
  *"reconsidering its constitutional legitimacy."* — **"HE IS THE BOARD."**

## 🧱 Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Radix UI · Framer Motion ·
Zustand · Zod · Prisma + SQLite · custom cookie-session auth (bcryptjs + jose).

The negotiation engine is a **deterministic, seeded mock director** (no LLM required), with a
clean provider abstraction that can swap to a real LLM and *falls back to mock so the demo can
never break*. A 33-assertion headless test of the Alex demo + full catastrophe passes green.

## 🎨 Design direction

*"The Supreme Court of your calendar, shipped as a Series-A startup."* Institutional gravitas —
ink + parchment + ceremonial gold, a display serif for constitutional headlines. Light/dark
themes and reduced-motion aware. The humour comes entirely from taking the bureaucracy
completely seriously.

---

*A parody. No real calendars were governed in the making of this project.*

# quiz-buzz — Agent Context

## What this project is

**quiz-buzz** is a fully static, serverless buzzer web app for remote team meetings on Microsoft Teams. It replaces the chaos of shouting answers over a call with a fair, first-come-first-served digital buzzer. No backend, no sign-in, hosted on GitHub Pages.

## Core concept

- A **host** creates a named session and gets a short invite code (6-char uppercase alphanumeric, e.g. `X7K2AF`)
- **Participants** join by entering the code (or a pre-filled URL), pick an anonymous display name (or get a random adjective+animal one generated), and hit a big BUZZ button
- The host sees who buzzed first, then awards a point (**Correct**) or denies it (**Wrong**) — either way the buzzer resets for the next question
- At the end the host presses **End Session**, triggering an animated scoreboard reveal for all participants (last-to-first, winner revealed last)
- Scores are hidden from other participants during the session; the reveal is the first time everyone sees the full ranking

## Technical constraints

- **No backend whatsoever** — everything runs in the browser
- Real-time sync via **PeerJS** (WebRTC DataChannel); the host's browser is the session authority
- Hosted on **GitHub Pages** (static build only)
- Max 30 participants per session (enforced client-side by the host)
- All session data is ephemeral — nothing is persisted beyond the lifetime of the browser tab

## Stack

- Vite + TypeScript (Svelte or React — not yet decided)
- PeerJS for P2P messaging
- Tailwind CSS v4 with CSS custom properties for theming
- Inter + JetBrains Mono (Google Fonts), Lucide Icons
- CSS keyframes + Web Animations API for all animations

## Key design decisions

- **Invite code** = first 6 chars of the PeerJS Peer ID (uppercase). No lookup table needed — the code *is* the peer address.
- **Scores are private mid-session** — `SCORE_UPDATE` messages are sent only to the individual participant, not broadcast to all
- **Theme**: dark/light mode, Slack-inspired palette (neutral surfaces + colorful accents). See `PROJECT_BRIEF.md` for full token table.
- **Header layout**: session name (left) · participant count `👥 n / 30` · invite code (right, host only). Invite code starts centered on screen and animates into the header when the first participant joins.

## Repo layout

```
quiz-buzz/
├── .opencode/          # opencode config
├── src/
│   ├── main.ts         # entry point
│   ├── peer.ts         # PeerJS session logic
│   ├── names.ts        # random name generator
│   ├── state.ts        # session state machine
│   ├── scores.ts       # score tracking
│   └── components/
│       ├── LandingPage.ts
│       ├── HostView.ts
│       ├── ParticipantView.ts
│       └── ResultsScreen.ts
├── PROJECT_BRIEF.md    # full product specification
└── AGENTS.md           # this file
```

## Full specification

`PROJECT_BRIEF.md` in the repo root is the authoritative product spec. Read it for detailed feature descriptions, the complete color token table, animation specs, message protocol types, and milestones.

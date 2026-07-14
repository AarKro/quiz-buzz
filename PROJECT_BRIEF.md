# usales-quiz — Project Brief

## Overview

**usales-quiz** is a lightweight, serverless buzzer web app designed for remote team meetings on Microsoft Teams. It solves the problem of participants shouting answers simultaneously during quiz-style warmup exercises by providing a fair, first-come-first-served digital buzzer. No accounts, no installation, no backend.

---

## Problem Statement

During regular retrospectives and team meetings, warmup quizzes are a common icebreaker. The current approach — shouting answers over a Teams call — makes it impossible to determine who buzzed in first. This app replaces the shouting with a fair, real-time buzzer that everyone can join from their browser.

---

## Goals

- Anyone on the team can join a session instantly from a browser, no sign-up required
- The first person to hit the buzzer is clearly identified
- The host can reset the buzzer between questions
- No backend infrastructure required — the app is fully static and hosted on GitHub Pages
- Anonymous participation: users choose a display name or get a random one generated

---

## Non-Goals

- No quiz content management (questions, answers, scoring) — this is purely a buzzer
- No authentication or persistent user accounts
- No server-side logic or databases

---

## Target Audience

Remote team members participating in MS Teams meetings. Technical proficiency is mixed — the UI must be dead simple.

---

## User Roles

### Host
- Creates a session and receives a short invite code
- Shares the invite code verbally or via Teams chat
- Sees who buzzed in first
- Can reset ("unbuzz") the session to prepare for the next question
- Can end/close the session

### Participant
- Joins a session by entering the invite code
- Chooses a display name or accepts a randomly generated one
- Hits the buzzer when they know the answer
- Sees confirmation that their buzz was registered, or sees who was first if they were too late

---

## Core Features

### Session Management
- Host creates a session; a short alphanumeric invite code is generated (e.g. `ZEBRA-42`)
- Participants join by entering the code on the landing page
- Session state is shared in real time across all connected participants

### Anonymous Identity
- On joining, users pick a display name
- If no name is entered, a random funny name is auto-generated (adjective + animal, e.g. "Sleepy Narwhal", "Grumpy Capybara") — similar to Google Docs anonymous users
- Names are ephemeral and tied only to the current session

### Buzzer
- A large, prominent "BUZZ" button is shown to all participants once the session is in the ready state
- The first participant to press it wins the round
- All other participants immediately see that the buzzer has been taken (button is disabled/grayed out)
- The winner's name is displayed prominently to everyone, including the host

### Unbuzz / Reset
- The host has a "Reset" or "Unbuzz" button
- Pressing it returns the session to the ready state so the next question can begin
- All participants' buzzers are re-enabled

### No Backend — Real-Time via Peer-to-Peer or BroadcastChannel
- Since the app is hosted on GitHub Pages (static only), real-time sync must be achieved without a server
- Recommended approach: **[Peer.js](https://peerjs.com/)** (WebRTC, no server needed beyond a free STUN/TURN relay) or a similar WebRTC-based P2P library
- Alternative: **[PartyKit](https://www.partykit.io/)** or **[Ably](https://ably.com/)** free-tier WebSocket services (adds a third-party dependency but simplifies implementation)
- The host's browser acts as the session authority (state owner)
- Participants connect directly to the host peer

---

## Technical Architecture

### Hosting
- Static site hosted on **GitHub Pages**
- Repository: `usales-quiz` (this repo)
- Deployment: push to `main` branch, GitHub Actions publishes to `gh-pages`

### Stack Recommendations
- **Framework**: Vanilla JS / TypeScript, or a lightweight framework like **Vite + Svelte** or **Vite + React** — keep bundle size minimal
- **Real-time**: PeerJS (WebRTC DataChannel) — host peer is the source of truth
- **Styling**: Tailwind CSS v4 (with CSS custom properties for the token system) or plain CSS; CSS variables for the full dark/light token set
- **Fonts**: Inter + JetBrains Mono via Google Fonts
- **Icons**: Lucide Icons (SVG, tree-shaken)
- **Animations**: CSS keyframes + Web Animations API; no heavy animation library needed
- **Name generation**: small local word list (adjectives + animals), no external API needed

### Data Flow

```
[Host Browser]
   |-- creates PeerJS peer, gets Peer ID
   |-- encodes Peer ID as invite code (short hash or base-36)
   |-- displays invite code + QR code (optional)
   |
   +<-- [Participant A connects via DataChannel]
   +<-- [Participant B connects via DataChannel]
   ...

On BUZZ event from Participant X:
   Host broadcasts "BUZZED: Participant X" to all connected peers
   All UIs update to show winner

On RESET from Host:
   Host broadcasts "RESET" to all peers
   All UIs return to ready state
```

### Session State (managed by host)

```ts
type SessionState =
  | { status: 'waiting' }         // lobby, not yet ready
  | { status: 'ready' }           // buzzer enabled for all
  | { status: 'buzzed'; winner: string }  // someone buzzed in
```

### Message Protocol (DataChannel, JSON)

```ts
// Host -> Participants
type HostMessage =
  | { type: 'STATE_UPDATE'; state: SessionState }
  | { type: 'PARTICIPANT_LIST'; names: string[] }

// Participant -> Host
type ParticipantMessage =
  | { type: 'JOIN'; name: string }
  | { type: 'BUZZ' }
```

---

## Page / Screen Structure

### `/` — Landing Page
- App title + short description
- Two options: **"Create Session"** (host) | **"Join Session"** (participant)

### `/host` — Host View
- Displays invite code (large, copyable) and optional QR code
- List of joined participants
- "Start Round" button (transitions session to `ready`)
- Winner display when someone buzzes
- "Unbuzz / Reset" button
- "End Session" button

### `/join` — Participant View
- Input for invite code (if not pre-filled via URL param `?code=XXXX`)
- Input for display name (with "Generate random name" button)
- After joining: large BUZZ button (disabled until host starts round)
- Winner announcement overlay when buzzed

---

## URL Design

Support deep-linking so the host can share a direct join URL:

```
https://<org>.github.io/usales-quiz/?code=ZEBRA42
```

This pre-fills the invite code field on the join page so participants only need to enter their name.

---

## UI/UX Requirements

### Responsive Layout
- **Mobile-first but fully desktop-capable** — the layout must feel equally at home on a phone screen and a widescreen monitor
- On mobile: single-column, full-screen buzzer dominates
- On desktop: wider layout with more breathing room; host view can use a two-column split (participant list left, controls right)
- Large, finger-friendly tap targets on touch devices; hover states and keyboard focus rings on desktop

### Dark Mode / Light Mode
- Support both themes; respect `prefers-color-scheme` by default
- Provide a manual toggle in the UI so users can override their system preference
- Persist the user's preference in `localStorage`

### Color System — Slack-inspired

The palette uses neutral, near-black/near-white surfaces with a set of distinct accent colors. Accents are used for participant avatars/name chips, session codes, button highlights, and state indicators. Each participant in the lobby is automatically assigned one of the accent colors so the list feels lively and visually distinct.

#### Dark theme (default dark surfaces)
| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#1a1d21` | App background |
| `--bg-surface` | `#222529` | Cards, panels |
| `--bg-elevated` | `#2c2f33` | Modals, dropdowns |
| `--text-primary` | `#f2f3f5` | Body text |
| `--text-secondary` | `#9b9ea4` | Labels, hints |
| `--border` | `#393c41` | Dividers |

#### Light theme
| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#f8f8f8` | App background |
| `--bg-surface` | `#ffffff` | Cards, panels |
| `--bg-elevated` | `#f0f0f0` | Modals, dropdowns |
| `--text-primary` | `#1a1d21` | Body text |
| `--text-secondary` | `#616061` | Labels, hints |
| `--border` | `#e8e8e8` | Dividers |

#### Accent palette (same in both themes)
| Name | Hex | Usage example |
|---|---|---|
| Aubergine | `#4a154b` | Primary brand color (header, logo) |
| Blue | `#1264a3` | Host actions, primary CTAs |
| Green | `#007a5a` | Ready state, success |
| Yellow | `#ecb22e` | Waiting / lobby state |
| Red | `#e01e5a` | Buzzed-in state, destructive actions |
| Orange | `#de8300` | Accent / alternate participant chips |
| Teal | `#0f7b6c` | Accent / alternate participant chips |
| Purple | `#6f42c1` | Accent / alternate participant chips |

Accent assignment for participant name chips: rotate through the non-semantic accents (orange, teal, purple, blue) deterministically based on join order so the same participant always shows the same color within a session.

### Animations

All animations should feel snappy and purposeful — not decorative noise. Use CSS transitions/animations and the Web Animations API; avoid heavy JS animation libraries.

| Trigger | Animation | Notes |
|---|---|---|
| Page load / route change | Fade + slide up (200 ms ease-out) | Panels enter from slightly below |
| Participant joins lobby | Chip slides in from left, subtle scale-up (150 ms) | Each new name pops in individually |
| Session goes `ready` | Buzzer button pulses with a soft glowing ring (looping, CSS keyframe) | Green glow, 1.5 s period |
| BUZZ pressed (winner) | Button flashes bright, then locks; confetti burst (CSS or canvas) | Winner's name slams in with a scale-up + bounce (spring curve) |
| BUZZ pressed (too slow) | Button shakes briefly (CSS keyframe, 300 ms) + dims | Communicates "too late" without being harsh |
| Reset / Unbuzz | Button and winner name fade out; buzzer smoothly re-enables with a ripple effect | 250 ms ease-in-out |
| Theme toggle | Background and text cross-fade (150 ms) | Avoid jarring flash |
| Hover on interactive elements | Subtle lift (translateY -1px) + shadow increase | 100 ms ease |

### Visual States — Buzzer Button

| State | Appearance |
|---|---|
| `waiting` | Muted, flat — gray surface, secondary text "Waiting for host…" |
| `ready` | Bold accent color (green), pulsing glow ring, large "BUZZ!" label |
| `buzzed` (this user won) | Bright flash → locked gold/yellow, "You buzzed in!" label |
| `buzzed` (another user won) | Dims to red tint, locked, "[Name] was first!" label |
| Disabled / not joined | Fully dimmed, non-interactive |

### Typography
- Font: **Inter** (Google Fonts) — clean, modern, highly legible at all sizes
- Buzzer button label: 2–3 rem, bold
- Winner announcement: 3–4 rem, extrabold, center-aligned
- Invite code display: monospace (e.g. `JetBrains Mono` or system monospace), large, letter-spaced

### Iconography
- Use a small icon set — **Lucide Icons** (tree-shakeable, SVG-based) for UI chrome
- No icon libraries that add significant bundle weight

### Accessibility (baseline)
- All interactive elements reachable by keyboard (Tab + Enter/Space)
- Focus rings visible in both themes
- Color is never the sole differentiator of state (always paired with text or icon)
- Meets WCAG AA contrast for primary text on all backgrounds

- Works in latest Chrome, Firefox, Safari, Edge

---

## Out of Scope (v1)

- Scorekeeping or leaderboards
- Question/answer content management
- Teams app integration (taskpane)
- Accessibility audit (nice to have for v2)
- Offline support / PWA

---

## Constraints

- **No backend** — everything must run in the browser
- **No user data storage** — nothing is persisted beyond the session lifetime
- **Free hosting** — GitHub Pages only
- **No sign-in** — anonymous participation is a hard requirement

---

## Open Questions

1. **Real-time library choice**: PeerJS is the lowest-friction fully serverless option, but relies on a public PeerJS cloud server for signaling. Is using a free third-party signaling server acceptable, or does the org require a fully self-contained solution?
2. **Invite code UX**: Should the invite code be human-readable (e.g. `GRUMPY-42`) or is a shorter opaque code (e.g. `X7K2`) preferred?
3. **QR code**: Nice-to-have for the host screen so mobile participants can scan instead of typing — include in v1 or defer?
4. **Participant limit**: Should there be a soft cap on participants per session (e.g. 30)?

---

## Milestones

| # | Milestone | Description |
|---|-----------|-------------|
| 1 | Project scaffold | Vite + chosen framework, GitHub Actions deploy pipeline, blank GitHub Pages deployment |
| 2 | P2P connection | Host creates session, participant connects, basic DataChannel messaging works |
| 3 | Name & join flow | Landing page, name generation, join by code |
| 4 | Buzzer core | Buzzer button, state sync, winner display, host reset |
| 5 | Polish & QA | Responsive design, edge cases (host disconnects, late joins), browser testing |
| 6 | Launch | Deployed to GitHub Pages, shared with team |

---

## Repository Structure (Proposed)

```
usales-quiz/
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions: build + deploy to gh-pages
├── public/
│   └── favicon.ico
├── src/
│   ├── main.ts                # App entry point
│   ├── peer.ts                # PeerJS session logic
│   ├── names.ts               # Random name generator
│   ├── state.ts               # Session state machine
│   ├── components/
│   │   ├── LandingPage.ts
│   │   ├── HostView.ts
│   │   └── ParticipantView.ts
│   └── styles/
│       └── main.css
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── PROJECT_BRIEF.md           # This file
```

---

## Getting Started (Developer Setup)

```bash
# Clone the repo
git clone https://github.com/<org>/usales-quiz.git
cd usales-quiz

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

*Last updated: 2026-07-14 — added UI/UX design system, dark/light mode, animation spec*

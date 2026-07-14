# quiz-buzz — Project Brief

## Overview

**quiz-buzz** is a lightweight, serverless buzzer web app designed for remote team meetings on Microsoft Teams. It solves the problem of participants shouting answers simultaneously during quiz-style warmup exercises by providing a fair, first-come-first-served digital buzzer. No accounts, no installation, no backend.

---

## Problem Statement

During regular retrospectives and team meetings, warmup quizzes are a common icebreaker. The current approach — shouting answers over a Teams call — makes it impossible to determine who buzzed in first. This app replaces the shouting with a fair, real-time buzzer that everyone can join from their browser.

---

## Goals

- Anyone on the team can join a session instantly from a browser, no sign-up required
- The first person to hit the buzzer is clearly identified
- The host can reset the buzzer between questions
- The host awards or denies points after each buzz, keeping score throughout the session
- At the end of the session a fun animated scoreboard reveal shows the final ranking
- No backend infrastructure required — the app is fully static and hosted on GitHub Pages
- Anonymous participation: users choose a display name or get a random one generated

---

## Non-Goals

- No quiz content management (questions, answers, scoring) — this is purely a buzzer
- No authentication or persistent user accounts
- No server-side logic or databases
- No QR code support (v1)
- No Teams app integration / taskpane (v1)
- No offline / PWA support (v1)

---

## Target Audience

Remote team members participating in MS Teams meetings. Technical proficiency is mixed — the UI must be dead simple.

---

## User Roles

### Host
- Enters a session name and creates a session, receiving a short invite code
- Shares the invite code verbally or via Teams chat
- Sees who buzzed in first
- Awards a point ("correct") or denies it ("wrong") after each buzz — the buzzer clears either way and the session returns to ready
- Can reset the session without awarding a point (e.g. false start or skipped question)
- Ends the session at any time, triggering the final scoreboard reveal for all participants

### Participant
- Joins a session by entering the invite code (or following a pre-filled link)
- Chooses a display name or accepts a randomly generated one
- Hits the buzzer when they know the answer
- Sees confirmation that their buzz was registered, or sees who was first if they were too late
- Sees their own score update in real time after the host awards a point
- Scores are otherwise hidden during the session — the final ranking is only revealed at the end

---

## Core Features

### Session Management
- The host enters a session name on a setup screen, then creates the session
- A 6-character uppercase alphanumeric invite code is generated (e.g. `X7K2AF`), derived from the PeerJS Peer ID — no lookup table or backend needed
- Sessions support up to 30 participants; the host rejects `JOIN` messages once the cap is reached and late arrivals see a "Session is full" message
- Participants can also join via a pre-filled URL: `https://aarkro.github.io/quiz-buzz/?code=X7K2AF`

### Anonymous Identity
- On joining, users pick a display name
- If no name is entered, a random funny name is auto-generated (adjective + animal, e.g. "Sleepy Narwhal", "Grumpy Capybara") — similar to Google Docs anonymous users
- Names are ephemeral and tied only to the current session

### Buzzer
- A large, prominent "BUZZ" button is shown to all participants once the host starts a round
- The first participant to press it wins the round
- All other participants immediately see that the buzzer has been taken (button disabled)
- The winner's name is displayed prominently to everyone, including the host

### Scoring
- After someone buzzes in, the host sees two action buttons: **"Correct"** and **"Wrong"**
- **Correct**: awards 1 point to the buzzer winner, broadcasts the updated score to all peers, then resets to ready
- **Wrong**: no point awarded, broadcasts the result, then resets to ready
- The host also retains a plain **"Reset"** button for false starts or skipped questions (no point awarded, no wrong recorded)
- Each participant can see their own running score at all times; other participants' scores are hidden until the session ends
- Scores are tracked as in-memory state on the host and broadcast to each participant individually so no one can see others' totals mid-session

### Session End & Scoreboard Reveal
- The host can press **"End Session"** at any time
- The session transitions to a `finished` state; all participants are pushed to a results screen simultaneously
- The results screen shows a full ranked leaderboard — this is the first time everyone sees all scores
- The reveal is animated: participants are unveiled one by one from last place to first, building suspense, with the winner announced last with a distinct celebratory animation (confetti, crown icon, or similar)
- The scoreboard is read-only; no further buzzing is possible once the session is finished

### Unbuzz / Reset
- The host has a **"Reset"** button for false starts or skipped questions
- Pressing it returns the session to the ready state with no score change
- All participants' buzzers are re-enabled

### Real-Time — No Backend
The app is hosted on GitHub Pages (static only), so real-time sync is achieved entirely in-browser using **[PeerJS](https://peerjs.com/)** (WebRTC DataChannel). The host's browser is the session authority; participants connect directly to the host peer.

PeerJS requires a signaling server only for the initial WebRTC handshake (exchanging ICE candidates). Once the DataChannel is open, all app data flows directly between browsers and never touches any server. The signaling step uses HTTPS (port 443) and will pass through corporate proxies without issue. The subsequent peer-to-peer DataChannel uses DTLS over UDP where available, falling back to TCP/443 via TURN in stricter network environments.

The public PeerJS cloud signaling server is used for v1. If that proves unreachable on the company network, the fallback is either:
- Configuring a TURN relay (e.g. Metered OpenRelay, free tier)
- Self-hosting `peerjs-server` (a small Node.js process, deployable to Render / Railway free tier) and pointing the client to it via a single config option

---

## Technical Architecture

### Hosting
- Static site hosted on **GitHub Pages**
- Repository: `quiz-buzz` (this repo)
- Deployment: push to `main` branch triggers GitHub Actions, which builds and publishes to `gh-pages`

### Stack
- **Framework**: Vite + Svelte or Vite + React (TypeScript) — keep bundle size minimal
- **Real-time**: PeerJS (WebRTC DataChannel) — host peer is the source of truth
- **Styling**: Tailwind CSS v4 with CSS custom properties for the full token system
- **Fonts**: Inter + JetBrains Mono via Google Fonts
- **Icons**: Lucide Icons (SVG, tree-shaken)
- **Animations**: CSS keyframes + Web Animations API; no heavy animation library needed
- **Name generation**: small local word list (adjectives + animals), no external API needed

### Data Flow

```
[Host Browser]
   |-- creates PeerJS peer, gets Peer ID
   |-- derives 6-char invite code from Peer ID (uppercase)
   |-- displays invite code large and centered (no participants yet)
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
  | { status: 'waiting' }                                        // lobby, not yet ready
  | { status: 'ready' }                                          // buzzer enabled for all
  | { status: 'buzzed'; winner: string }                         // someone buzzed in, host deciding
  | { status: 'finished'; scores: Record<string, number> }       // session ended, reveal screen
```

### Message Protocol (DataChannel, JSON)

```ts
// Host -> Participants
type HostMessage =
  | { type: 'STATE_UPDATE'; state: SessionState }
  | { type: 'PARTICIPANT_LIST'; names: string[] }
  | { type: 'SCORE_UPDATE'; name: string; score: number }   // sent only to the relevant participant
  | { type: 'SESSION_FULL' }

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
- **Setup screen:** input for session name before the session is created
- **Before first participant joins:** invite code displayed large and centered on screen
- **After first participant joins:** invite code animates up into the right side of the header; session name appears in the left side of the header
- **Header (both views):** `[Session Name]` (left) ··· `👥 count / 30` and `Invite code: XXXX` (right, host only)
- Participant list with colored name chips and their current scores (visible only to the host)
- "Start Round" button (transitions session to `ready`)
- When buzzed: winner name displayed prominently + **"Correct"** and **"Wrong"** buttons + **"Reset"** (false start)
- "End Session" button — transitions to the results screen for all participants

### `/results` — Scoreboard Reveal (all participants)
- Triggered simultaneously for all connected peers when the host ends the session
- Animated ranked reveal: participants appear from last to first place, one by one
- Winner is revealed last with a distinct celebratory animation
- Final scores visible to everyone for the first time
- Read-only — no further interaction possible

### `/join` — Participant View
- Input for invite code (pre-filled if `?code=` URL param is present)
- Input for display name with "Generate random name" button
- After joining: large BUZZ button (disabled until host starts a round)
- Own score displayed below the buzzer (e.g. `Your score: 3`) — other participants' scores are not shown
- **Header:** `[Session Name]` (left) ··· `👥 count / 30` (right)
- Winner announcement overlay when someone buzzes, showing whether the host awarded the point or not

---

## UI/UX Requirements

### Responsive Layout
- Mobile-first but fully desktop-capable — the layout must feel equally at home on a phone screen and a widescreen monitor
- On mobile: single-column, full-screen buzzer dominates
- On desktop: wider layout with more breathing room; host view uses a two-column split (participant list left, controls right)
- Large, finger-friendly tap targets on touch; hover states and keyboard focus rings on desktop
- Supported browsers: latest Chrome, Firefox, Safari, Edge

### Dark Mode / Light Mode
- Respects `prefers-color-scheme` by default
- Manual toggle in the UI to override system preference, persisted in `localStorage`

### Color System — Slack-inspired

Neutral near-black/near-white surfaces for backgrounds and text; a set of distinct accent colors for state indicators, participant name chips, and interactive elements. Each participant is automatically assigned an accent color by join order so the lobby feels visually lively.

#### Dark theme
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
| Name | Hex | Usage |
|---|---|---|
| Aubergine | `#4a154b` | Primary brand color (header, logo) |
| Blue | `#1264a3` | Host actions, primary CTAs |
| Green | `#007a5a` | Ready state, success |
| Yellow | `#ecb22e` | Waiting / lobby state |
| Red | `#e01e5a` | Buzzed-in state, destructive actions |
| Orange | `#de8300` | Participant name chips |
| Teal | `#0f7b6c` | Participant name chips |
| Purple | `#6f42c1` | Participant name chips |

Participant chip colors rotate through Orange, Teal, Purple, Blue deterministically by join order.

### Animations

All animations are snappy and purposeful. Use CSS transitions/keyframes and the Web Animations API — no heavy JS animation libraries.

| Trigger | Animation |
|---|---|
| Page load / route change | Fade + slide up, 200 ms ease-out |
| Participant joins lobby | Chip slides in from left with subtle scale-up, 150 ms |
| Session goes `ready` | Buzzer button pulses with a soft green glowing ring, 1.5 s looping keyframe |
| BUZZ pressed — winner | Button flashes bright then locks; confetti burst; winner name slams in with scale-up + spring bounce |
| BUZZ pressed — too late | Button shakes briefly (300 ms keyframe) then dims |
| Host awards "Correct" | Score increments with a satisfying pop animation on the host's participant chip |
| Host awards "Wrong" | Brief shake on the winner chip; buzzer state clears with a fade |
| Reset / Unbuzz | Winner name and button state fade out; buzzer re-enables with a ripple, 250 ms ease-in-out |
| Scoreboard reveal | Participants slide in one by one from last to first (staggered, ~400 ms each); winner entry gets confetti + crown, distinct scale-up |
| Theme toggle | Background and text cross-fade, 150 ms |
| Hover on interactive elements | Subtle lift (`translateY -1px`) + shadow increase, 100 ms |

### Buzzer Button States

| State | Appearance |
|---|---|
| `waiting` | Muted flat gray, secondary text "Waiting for host…" |
| `ready` | Bold green, pulsing glow ring, large "BUZZ!" label |
| `buzzed` — this user won | Bright flash → locked gold/yellow, "You buzzed in!" |
| `buzzed` — another user won | Dims to red tint, locked, "[Name] was first!" |
| Not yet joined | Fully dimmed, non-interactive |

### Typography
- Body: **Inter** (Google Fonts)
- Invite code / monospace elements: **JetBrains Mono**, large, letter-spaced
- Buzzer label: 2–3 rem bold
- Winner announcement: 3–4 rem extrabold, center-aligned

### Iconography
- **Lucide Icons** — tree-shakeable SVG set, no bundle bloat

### Accessibility (baseline)
- All interactive elements keyboard-navigable (Tab + Enter/Space)
- Visible focus rings in both themes
- State is never communicated by color alone — always paired with text or an icon
- WCAG AA contrast for primary text on all background tokens

---

## Constraints

- **No backend** — everything runs in the browser
- **No user data storage** — nothing persisted beyond the session lifetime
- **Free hosting** — GitHub Pages only
- **No sign-in** — anonymous participation is a hard requirement

---

## Milestones

| # | Milestone | Description |
|---|-----------|-------------|
| 1 | Project scaffold | Vite + chosen framework, GitHub Actions deploy pipeline, blank GitHub Pages deployment |
| 2 | P2P connection | Host creates session, participant connects, basic DataChannel messaging works |
| 3 | Name & join flow | Landing page, name generation, join by code |
| 4 | Buzzer core | Buzzer button, state sync, winner display, host reset |
| 5 | Scoring | Correct/Wrong buttons, per-participant score tracking, own-score display, session end |
| 6 | Scoreboard reveal | Results screen with staggered animated reveal, winner celebration |
| 7 | Polish & QA | Responsive design, edge cases (host disconnects, late joins), browser testing |
| 8 | Launch | Deployed to GitHub Pages, shared with team |

---

## Repository Structure (Proposed)

```
quiz-buzz/
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
│   ├── scores.ts              # Score tracking and broadcast logic
│   ├── components/
│   │   ├── LandingPage.ts
│   │   ├── HostView.ts
│   │   ├── ParticipantView.ts
│   │   └── ResultsScreen.ts   # Scoreboard reveal
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
git clone https://github.com/AarKro/quiz-buzz.git
cd quiz-buzz

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

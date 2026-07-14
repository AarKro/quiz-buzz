import { Peer, PeerOptions } from 'peerjs';

export type SessionState =
  | { status: 'waiting' }
  // Buzzers live. `queue` holds everyone who buzzed, in buzz order; the
  // first entry is currently answering. Buzzing stays open while a queue
  // exists — later buzzers line up behind.
  | { status: 'ready'; queue: string[] }
  | { status: 'finished'; scores: Record<string, number> };

export interface Participant {
  id: string;
  name: string;
  score: number;
}

export type HostMessage =
  // Sent once to a participant right after their JOIN is accepted. Carries the
  // final (possibly de-duplicated) name so the client can match later
  // SCORE_UPDATE / winner announcements against it.
  | { type: 'WELCOME'; assignedName: string; sessionName: string; state: SessionState }
  | { type: 'STATE_UPDATE'; state: SessionState }
  | { type: 'PARTICIPANT_LIST'; names: string[] }
  | { type: 'SCORE_UPDATE'; name: string; score: number }
  | { type: 'SESSION_FULL' };

export type ParticipantMessage =
  | { type: 'JOIN'; name: string }
  | { type: 'BUZZ' };

export const MAX_PARTICIPANTS = 30;

// How long we wait for the signaling server / host before giving up.
export const CONNECT_TIMEOUT_MS = 15000;

// Utility to generate a 6-character random uppercase alphanumeric code
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getPeerIdFromCode(code: string): string {
  return `quizbuzz-${code.trim().toUpperCase()}`;
}

/**
 * Central factory for Peer instances so host and participant share the exact
 * same server/ICE configuration.
 *
 * By default the public PeerJS cloud broker is used. That broker is sometimes
 * down or blocked by corporate networks, so the server can be overridden at
 * build time via env vars (e.g. in `.env.local`) to point at a self-hosted
 * `peerjs-server`:
 *
 *   VITE_PEER_HOST=peer.example.com
 *   VITE_PEER_PORT=443            (default: 443)
 *   VITE_PEER_PATH=/              (default: /)
 *   VITE_PEER_KEY=peerjs          (default: peerjs)
 *   VITE_PEER_SECURE=true         (default: true, set "false" for local dev)
 */
export function createPeer(id?: string): Peer {
  const options: PeerOptions = {
    debug: 1, // only log errors
    config: {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    }
  };

  const host = import.meta.env.VITE_PEER_HOST as string | undefined;
  if (host) {
    options.host = host;
    options.port = Number(import.meta.env.VITE_PEER_PORT ?? 443);
    options.path = (import.meta.env.VITE_PEER_PATH as string | undefined) ?? '/';
    options.key = (import.meta.env.VITE_PEER_KEY as string | undefined) ?? 'peerjs';
    options.secure = import.meta.env.VITE_PEER_SECURE !== 'false';
  }

  return id ? new Peer(id, options) : new Peer(options);
}

/** Map raw PeerJS error types to actionable, human-readable messages. */
export function describePeerError(errorType: string | undefined, inviteCode?: string): string {
  switch (errorType) {
    case 'peer-unavailable':
      return `No session found${inviteCode ? ` for code ${inviteCode}` : ''}. Double-check the invite code — the host may also have ended the session.`;
    case 'network':
    case 'socket-error':
    case 'socket-closed':
    case 'server-error':
      return 'Could not reach the connection server. It may be down or blocked by your network — please try again in a moment.';
    case 'browser-incompatible':
      return 'Your browser does not support the real-time connections (WebRTC) this app needs. Please try a modern browser like Chrome, Edge or Firefox.';
    default:
      return 'Connection failed unexpectedly. Please check your network and try again.';
  }
}

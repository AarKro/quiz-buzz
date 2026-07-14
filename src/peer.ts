export type SessionState =
  | { status: 'waiting' }
  | { status: 'ready' }
  | { status: 'buzzed'; winner: string }
  | { status: 'finished'; scores: Record<string, number> };

export type HostMessage =
  | { type: 'STATE_UPDATE'; state: SessionState }
  | { type: 'PARTICIPANT_LIST'; names: string[] }
  | { type: 'SCORE_UPDATE'; name: string; score: number }
  | { type: 'SESSION_FULL' };

export type ParticipantMessage =
  | { type: 'JOIN'; name: string }
  | { type: 'BUZZ' };

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

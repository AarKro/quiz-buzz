import { useEffect, useRef, useState } from 'react';
import { Peer, DataConnection } from 'peerjs';
import {
  SessionState,
  Participant,
  HostMessage,
  ParticipantMessage,
  MAX_PARTICIPANTS,
  CONNECT_TIMEOUT_MS,
  createPeer,
  generateInviteCode,
  getPeerIdFromCode,
  describePeerError
} from '../peer';

export type HostStatus = 'idle' | 'connecting' | 'open' | 'error';

const MAX_ID_RETRIES = 3;

/**
 * Owns the host side of a session: the Peer instance, all participant
 * connections and the authoritative session state machine.
 *
 * PeerJS events fire outside the React render cycle, so refs are the source
 * of truth for message handling; React state mirrors them for rendering.
 * This avoids stale closures and side effects inside setState updaters.
 */
export function useHostSession() {
  const [status, setStatus] = useState<HostStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [participants, setParticipantsState] = useState<Participant[]>([]);
  const [sessionState, setSessionStateState] = useState<SessionState>({ status: 'waiting' });

  const peerRef = useRef<Peer | null>(null);
  const sessionNameRef = useRef('');
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const participantsRef = useRef<Participant[]>([]);
  const sessionStateRef = useRef<SessionState>({ status: 'waiting' });
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParticipants = (next: Participant[]) => {
    participantsRef.current = next;
    setParticipantsState(next);
  };

  const setSessionState = (next: SessionState) => {
    sessionStateRef.current = next;
    setSessionStateState(next);
  };

  const clearConnectTimeout = () => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  };

  const destroyPeer = () => {
    clearConnectTimeout();
    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current.clear();
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => destroyPeer, []);

  const broadcast = (msg: HostMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  const transitionTo = (next: SessionState) => {
    setSessionState(next);
    broadcast({ type: 'STATE_UPDATE', state: next });
  };

  /** "Max" -> "Max 2" -> "Max 3" ... until the name is free (case-insensitive). */
  const uniqueName = (requested: string) => {
    const taken = new Set(participantsRef.current.map(p => p.name.toLowerCase()));
    let candidate = requested;
    let suffix = 2;
    while (taken.has(candidate.toLowerCase())) {
      candidate = `${requested} ${suffix}`;
      suffix++;
    }
    return candidate;
  };

  const handleParticipantMessage = (conn: DataConnection, data: unknown) => {
    const msg = data as ParticipantMessage;

    if (msg.type === 'JOIN') {
      if (participantsRef.current.some(p => p.id === conn.peer)) return; // duplicate JOIN

      if (participantsRef.current.length >= MAX_PARTICIPANTS) {
        const full: HostMessage = { type: 'SESSION_FULL' };
        conn.send(full);
        setTimeout(() => conn.close(), 1000);
        return;
      }

      const assignedName = uniqueName(msg.name.trim().slice(0, 20) || 'Anonymous');
      const next = [...participantsRef.current, { id: conn.peer, name: assignedName, score: 0 }];
      setParticipants(next);

      const welcome: HostMessage = {
        type: 'WELCOME',
        assignedName,
        sessionName: sessionNameRef.current,
        state: sessionStateRef.current
      };
      conn.send(welcome);
      broadcast({ type: 'PARTICIPANT_LIST', names: next.map(p => p.name) });
    } else if (msg.type === 'BUZZ') {
      const state = sessionStateRef.current;
      if (state.status !== 'ready') return; // round not running
      const player = participantsRef.current.find(p => p.id === conn.peer);
      if (!player || state.queue.includes(player.name)) return; // already in line
      transitionTo({ status: 'ready', queue: [...state.queue, player.name] });
    }
  };

  const handleConnectionClosed = (conn: DataConnection) => {
    connectionsRef.current.delete(conn.peer);

    // Keep the roster intact once the session is finished so the results
    // screen still shows everyone's score.
    if (sessionStateRef.current.status === 'finished') return;

    const leaving = participantsRef.current.find(p => p.id === conn.peer);
    if (!leaving) return;

    const next = participantsRef.current.filter(p => p.id !== conn.peer);
    setParticipants(next);
    broadcast({ type: 'PARTICIPANT_LIST', names: next.map(p => p.name) });

    // Drop a leaving player out of the buzz queue.
    const state = sessionStateRef.current;
    if (state.status === 'ready' && state.queue.includes(leaving.name)) {
      transitionTo({ status: 'ready', queue: state.queue.filter(n => n !== leaving.name) });
    }
  };

  const createSession = (name: string, attempt = 0) => {
    destroyPeer();
    setErrorMessage(null);
    setStatus('connecting');
    setParticipants([]);
    setSessionState({ status: 'waiting' });
    sessionNameRef.current = name;
    setSessionName(name);

    const code = generateInviteCode();
    setInviteCode(code);

    const peer = createPeer(getPeerIdFromCode(code));
    peerRef.current = peer;

    connectTimeoutRef.current = setTimeout(() => {
      destroyPeer();
      setStatus('error');
      setErrorMessage(describePeerError('network'));
    }, CONNECT_TIMEOUT_MS);

    peer.on('open', () => {
      clearConnectTimeout();
      setStatus('open');
    });

    // Signaling-server drop (e.g. laptop sleep). Existing WebRTC connections
    // keep working, but reconnect so new participants can still join.
    peer.on('disconnected', () => {
      if (!peer.destroyed) peer.reconnect();
    });

    peer.on('error', (err) => {
      console.error('Host peer error:', err);
      if (err.type === 'unavailable-id' && attempt < MAX_ID_RETRIES) {
        createSession(name, attempt + 1); // code collision: retry with a fresh code
        return;
      }
      // Errors on individual participant connections shouldn't kill the session.
      if (err.type === 'peer-unavailable') return;
      destroyPeer();
      setStatus('error');
      setErrorMessage(describePeerError(err.type));
    });

    peer.on('connection', (conn) => {
      // Attach the data handler immediately so no early message is missed.
      conn.on('data', (data) => handleParticipantMessage(conn, data));
      conn.on('open', () => {
        connectionsRef.current.set(conn.peer, conn);
      });
      conn.on('close', () => handleConnectionClosed(conn));
      conn.on('error', () => handleConnectionClosed(conn));
    });
  };

  const startRound = () => transitionTo({ status: 'ready', queue: [] });
  const resetRound = () => transitionTo({ status: 'waiting' });

  /** Top of the queue answered correctly: award the point, clear the round. */
  const awardCorrect = (winnerName: string) => {
    const next = participantsRef.current.map(p => {
      if (p.name !== winnerName) return p;
      const updated = { ...p, score: p.score + 1 };
      const conn = connectionsRef.current.get(p.id);
      if (conn?.open) {
        const scoreMsg: HostMessage = { type: 'SCORE_UPDATE', name: p.name, score: updated.score };
        conn.send(scoreMsg);
      }
      return updated;
    });
    setParticipants(next);
    transitionTo({ status: 'waiting' });
  };

  /** Top of the queue answered wrong: pop them, the next in line is up. */
  const awardWrong = () => {
    const state = sessionStateRef.current;
    if (state.status !== 'ready' || state.queue.length === 0) return;
    transitionTo({ status: 'ready', queue: state.queue.slice(1) });
  };

  const endSession = () => {
    const scores: Record<string, number> = {};
    participantsRef.current.forEach(p => {
      scores[p.name] = p.score;
    });
    transitionTo({ status: 'finished', scores });
  };

  const closeSession = () => {
    destroyPeer();
    setStatus('idle');
    setErrorMessage(null);
    setParticipants([]);
    setSessionState({ status: 'waiting' });
    setInviteCode('');
    sessionNameRef.current = '';
    setSessionName('');
  };

  return {
    status,
    errorMessage,
    sessionName,
    inviteCode,
    participants,
    sessionState,
    createSession,
    startRound,
    resetRound,
    awardCorrect,
    awardWrong,
    endSession,
    closeSession,
    clearError: () => setErrorMessage(null)
  };
}

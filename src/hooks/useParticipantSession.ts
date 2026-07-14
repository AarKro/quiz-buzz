import { useEffect, useRef, useState } from 'react';
import { Peer, DataConnection } from 'peerjs';
import {
  SessionState,
  HostMessage,
  ParticipantMessage,
  CONNECT_TIMEOUT_MS,
  createPeer,
  getPeerIdFromCode,
  describePeerError
} from '../peer';

export type ParticipantStatus = 'idle' | 'connecting' | 'joined' | 'error';

/**
 * Owns the participant side of a session: the Peer instance and the single
 * connection to the host. Mirrors the host hook's pattern of using refs as
 * the source of truth inside PeerJS callbacks.
 */
export function useParticipantSession() {
  const [status, setStatus] = useState<ParticipantStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Name as confirmed by the host (may differ from the requested one, e.g. "Max 2")
  const [assignedName, setAssignedName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [participantCount, setParticipantCount] = useState(1);
  const [sessionState, setSessionStateState] = useState<SessionState>({ status: 'waiting' });

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const assignedNameRef = useRef('');
  const sessionStateRef = useRef<SessionState>({ status: 'waiting' });
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => destroyPeer, []);

  const failWith = (message: string) => {
    destroyPeer();
    setStatus('error');
    setErrorMessage(message);
  };

  const handleHostMessage = (data: unknown) => {
    const msg = data as HostMessage;

    switch (msg.type) {
      case 'WELCOME':
        clearConnectTimeout();
        assignedNameRef.current = msg.assignedName;
        setAssignedName(msg.assignedName);
        setSessionName(msg.sessionName);
        setSessionState(msg.state);
        setStatus('joined');
        break;
      case 'STATE_UPDATE':
        setSessionState(msg.state);
        break;
      case 'PARTICIPANT_LIST':
        setParticipantCount(msg.names.length);
        break;
      case 'SCORE_UPDATE':
        if (msg.name === assignedNameRef.current) {
          setMyScore(msg.score);
        }
        break;
      case 'SESSION_FULL':
        failWith('This session is full (max 30 players). Ask the host to make room and try again.');
        break;
    }
  };

  const join = (code: string, requestedName: string) => {
    destroyPeer();
    setErrorMessage(null);
    setStatus('connecting');
    setMyScore(0);
    setParticipantCount(1);
    setAssignedName('');
    assignedNameRef.current = '';
    setSessionName('');
    setInviteCode(code.trim().toUpperCase());
    setSessionState({ status: 'waiting' });

    const peer = createPeer();
    peerRef.current = peer;

    // Covers the whole handshake: signaling server, host connection and WELCOME.
    connectTimeoutRef.current = setTimeout(() => {
      failWith(describePeerError('network'));
    }, CONNECT_TIMEOUT_MS);

    peer.on('error', (err) => {
      console.error('Participant peer error:', err);
      failWith(describePeerError(err.type, code.toUpperCase()));
    });

    peer.on('disconnected', () => {
      if (!peer.destroyed) peer.reconnect();
    });

    peer.on('open', () => {
      const conn = peer.connect(getPeerIdFromCode(code), { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        const joinMsg: ParticipantMessage = { type: 'JOIN', name: requestedName };
        conn.send(joinMsg);
      });

      conn.on('data', handleHostMessage);

      conn.on('close', () => {
        // A close after the final scoreboard arrived is expected (the host
        // left or started a new session) — stay on the results screen.
        if (sessionStateRef.current.status === 'finished') return;
        failWith('Connection lost. The host may have closed the session.');
      });
    });
  };

  const buzz = () => {
    if (sessionStateRef.current.status !== 'ready') return;
    if (connRef.current?.open) {
      const msg: ParticipantMessage = { type: 'BUZZ' };
      connRef.current.send(msg);
    }
  };

  const leave = () => {
    destroyPeer();
    setStatus('idle');
    setErrorMessage(null);
  };

  return {
    status,
    errorMessage,
    assignedName,
    sessionName,
    inviteCode,
    myScore,
    participantCount,
    sessionState,
    join,
    buzz,
    leave,
    clearError: () => setErrorMessage(null)
  };
}

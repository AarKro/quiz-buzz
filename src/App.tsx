import { useState, useEffect, useRef } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { Sun, Moon, AlertCircle } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { ParticipantView } from './components/ParticipantView';
import { HostView } from './components/HostView';
import { ResultsScreen } from './components/ResultsScreen';
import {
  SessionState,
  HostMessage,
  ParticipantMessage,
  generateInviteCode,
  getPeerIdFromCode
} from './peer';

export default function App() {
  // Theme Management
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove('light-mode');
      html.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark-mode');
      html.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // App Role / Navigation
  const [role, setRole] = useState<'landing' | 'host' | 'participant' | 'results'>('landing');
  const [sessionName, setSessionName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Participant State
  const [myName, setMyName] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [participantCount, setParticipantCount] = useState(1);
  const [sessionState, setSessionState] = useState<SessionState>({ status: 'waiting' });

  // Host State
  const [participants, setParticipants] = useState<{ id: string; name: string; score: number }[]>([]);

  // Refs for Peer connections
  const peerRef = useRef<Peer | null>(null);
  // For Host: connections map
  const hostConnectionsRef = useRef<Map<string, DataConnection>>(new Map());
  // For Participant: connection to host
  const participantConnRef = useRef<DataConnection | null>(null);

  // Extract ?code=XXX from URL to join directly
  const [urlInviteCode, setUrlInviteCode] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setUrlInviteCode(code.trim().toUpperCase());
    }
  }, []);

  // Cleanup peer ref on unmount
  useEffect(() => {
    return () => {
      cleanupPeer();
    };
  }, []);

  const cleanupPeer = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (participantConnRef.current) {
      participantConnRef.current.close();
      participantConnRef.current = null;
    }
    hostConnectionsRef.current.forEach(conn => conn.close());
    hostConnectionsRef.current.clear();
  };

  // ---------------------------------------------------------------------------
  // HOST WORKFLOW
  // ---------------------------------------------------------------------------
  const handleCreateSession = (name: string) => {
    cleanupPeer();
    setErrorMessage(null);
    setSessionName(name);

    const code = generateInviteCode();
    setInviteCode(code);
    const peerId = getPeerIdFromCode(code);

    const peer = new Peer(peerId, {
      debug: 1 // only log errors
    });

    peerRef.current = peer;

    peer.on('open', () => {
      setRole('host');
      setSessionState({ status: 'waiting' });
      setParticipants([]);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        // Retry with another code
        handleCreateSession(name);
      } else {
        setErrorMessage('Failed to initialize connection. Please check your network.');
      }
    });

    peer.on('connection', (conn) => {
      // Handle incoming participant connections
      conn.on('open', () => {
        // Check session capacity cap (30 participants)
        if (hostConnectionsRef.current.size >= 30) {
          const rejectMsg: HostMessage = { type: 'SESSION_FULL' };
          conn.send(rejectMsg);
          setTimeout(() => conn.close(), 1000);
          return;
        }

        // Add to connections map
        hostConnectionsRef.current.set(conn.peer, conn);

        // Listen for data
        conn.on('data', (data: any) => {
          const msg = data as ParticipantMessage;

          if (msg.type === 'JOIN') {
            // Check if name is duplicate; append number if duplicate
            let finalName = msg.name.trim();
            setParticipants(prev => {
              let duplicateCount = 0;
              prev.forEach(p => {
                if (p.name.toLowerCase().startsWith(finalName.toLowerCase())) {
                  duplicateCount++;
                }
              });
              if (duplicateCount > 0) {
                finalName = `${finalName} ${duplicateCount + 1}`;
              }

              const newPlayers = [...prev, { id: conn.peer, name: finalName, score: 0 }];

              // Broadcast updated state to all connected peers
              broadcastToAll({
                type: 'PARTICIPANT_LIST',
                names: newPlayers.map(p => p.name)
              });

              // Share current session state with the new participant
              const stateUpdateMsg: HostMessage = {
                type: 'STATE_UPDATE',
                state: sessionState
              };
              conn.send(stateUpdateMsg);

              return newPlayers;
            });
          } else if (msg.type === 'BUZZ') {
            // Find participant name
            setParticipants(prev => {
              const player = prev.find(p => p.id === conn.peer);
              const playerName = player ? player.name : 'Unknown Player';

              setSessionState(currentState => {
                if (currentState.status === 'ready') {
                  const newState: SessionState = { status: 'buzzed', winner: playerName };
                  // Broadcast buzz winner
                  broadcastToAll({
                    type: 'STATE_UPDATE',
                    state: newState
                  });
                  return newState;
                }
                return currentState;
              });

              return prev;
            });
          }
        });
      });

      conn.on('close', () => {
        hostConnectionsRef.current.delete(conn.peer);
        setParticipants(prev => {
          const removed = prev.find(p => p.id === conn.peer);
          const filtered = prev.filter(p => p.id !== conn.peer);
          if (removed) {
            broadcastToAll({
              type: 'PARTICIPANT_LIST',
              names: filtered.map(p => p.name)
            });
          }
          return filtered;
        });
      });
    });
  };

  const broadcastToAll = (msg: HostMessage) => {
    hostConnectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  };

  const handleStartRound = () => {
    const newState: SessionState = { status: 'ready' };
    setSessionState(newState);
    broadcastToAll({
      type: 'STATE_UPDATE',
      state: newState
    });
  };

  const handleAwardCorrect = (winnerName: string) => {
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (p.name === winnerName) {
          const newScore = p.score + 1;
          // Send personalized score update
          const conn = hostConnectionsRef.current.get(p.id);
          if (conn && conn.open) {
            conn.send({
              type: 'SCORE_UPDATE',
              name: winnerName,
              score: newScore
            });
          }
          return { ...p, score: newScore };
        }
        return p;
      });

      // Automatically reset to waiting state
      const nextState: SessionState = { status: 'waiting' };
      setSessionState(nextState);
      broadcastToAll({
        type: 'STATE_UPDATE',
        state: nextState
      });

      return updated;
    });
  };

  const handleAwardWrong = (_winnerName: string) => {
    // No points, but transitions to waiting
    const nextState: SessionState = { status: 'waiting' };
    setSessionState(nextState);
    broadcastToAll({
      type: 'STATE_UPDATE',
      state: nextState
    });
  };

  const handleResetRound = () => {
    const nextState: SessionState = { status: 'waiting' };
    setSessionState(nextState);
    broadcastToAll({
      type: 'STATE_UPDATE',
      state: nextState
    });
  };

  const handleEndSession = () => {
    setParticipants(prev => {
      // Build final scores list
      const finalScores: Record<string, number> = {};
      prev.forEach(p => {
        finalScores[p.name] = p.score;
      });

      const finishedState: SessionState = { status: 'finished', scores: finalScores };
      setSessionState(finishedState);
      broadcastToAll({
        type: 'STATE_UPDATE',
        state: finishedState
      });

      setRole('results');
      return prev;
    });
  };

  const handleRestart = () => {
    cleanupPeer();
    setRole('landing');
  };

  // ---------------------------------------------------------------------------
  // PARTICIPANT WORKFLOW
  // ---------------------------------------------------------------------------
  const handleJoinSession = (code: string, name: string) => {
    cleanupPeer();
    setErrorMessage(null);
    setMyName(name);
    setMyScore(0);
    setInviteCode(code);

    const peer = new Peer({ debug: 1 });
    peerRef.current = peer;

    peer.on('open', () => {
      const hostPeerId = getPeerIdFromCode(code);
      const conn = peer.connect(hostPeerId, { reliable: true });
      participantConnRef.current = conn;

      conn.on('open', () => {
        // Request to join the session
        conn.send({
          type: 'JOIN',
          name: name
        });
        setRole('participant');
      });

      conn.on('data', (data: any) => {
        const msg = data as HostMessage;

        if (msg.type === 'STATE_UPDATE') {
          setSessionState(msg.state);
          if (msg.state.status === 'finished') {
            setRole('results');
          }
        } else if (msg.type === 'PARTICIPANT_LIST') {
          setParticipantCount(msg.names.length);
        } else if (msg.type === 'SCORE_UPDATE') {
          if (msg.name === name) {
            setMyScore(msg.score);
          }
        } else if (msg.type === 'SESSION_FULL') {
          setErrorMessage('Session is full (cap reached: 30 participants)');
          cleanupPeer();
          setRole('landing');
        }
      });

      conn.on('close', () => {
        setErrorMessage('Connection lost. The host might have closed or disconnected.');
        cleanupPeer();
        setRole('landing');
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      setErrorMessage('Could not connect to host. Check your invite code.');
      setRole('landing');
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between theme-bg-primary transition-colors">
      {/* Upper Alerts Banner */}
      {errorMessage && (
        <div className="bg-red-500 text-white px-4 py-3 text-sm font-semibold flex items-center justify-between shadow">
          <div className="flex items-center gap-2 max-w-lg mx-auto w-full">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-white hover:opacity-80 font-bold px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {role === 'landing' && (
          <LandingPage
            onCreateSession={handleCreateSession}
            onJoinSession={handleJoinSession}
            initialCode={urlInviteCode}
          />
        )}

        {role === 'host' && (
          <HostView
            sessionName={sessionName}
            inviteCode={inviteCode}
            participants={participants}
            sessionState={sessionState}
            onStartRound={handleStartRound}
            onAwardCorrect={handleAwardCorrect}
            onAwardWrong={handleAwardWrong}
            onResetRound={handleResetRound}
            onEndSession={handleEndSession}
          />
        )}

        {role === 'participant' && (
          <ParticipantView
            sessionName={sessionName}
            inviteCode={inviteCode}
            myName={myName}
            participantCount={participantCount}
            sessionState={sessionState}
            myScore={myScore}
            onBuzz={() => {
              if (participantConnRef.current && participantConnRef.current.open) {
                participantConnRef.current.send({ type: 'BUZZ' });
              }
            }}
            onLeave={() => {
              cleanupPeer();
              setRole('landing');
            }}
          />
        )}

        {role === 'results' && (
          <ResultsScreen
            scores={
              sessionState.status === 'finished'
                ? sessionState.scores
                : participants.reduce<Record<string, number>>((acc, curr) => {
                    acc[curr.name] = curr.score;
                    return acc;
                  }, {})
            }
            isHost={role === 'results' && peerRef.current?.id === getPeerIdFromCode(inviteCode)}
            onRestart={handleRestart}
          />
        )}
      </div>

      {/* Absolute Bottom Floating theme controller */}
      <footer className="py-4 text-center">
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border theme-border theme-bg-surface hover:theme-bg-elevated theme-text-primary text-xs font-bold transition shadow-sm cursor-pointer"
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-500 fill-current" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

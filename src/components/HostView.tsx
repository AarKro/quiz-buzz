import React, { useEffect, useRef, useState } from 'react';
import { Users, Zap, Check, X, RefreshCw, Trophy, Copy, Shield, ArrowLeft } from 'lucide-react';
import { SessionState, Participant, MAX_PARTICIPANTS } from '../peer';
import { getParticipantColor } from '../names';

interface HostViewProps {
  sessionName: string;
  inviteCode: string;
  participants: Participant[];
  sessionState: SessionState;
  onStartRound: () => void;
  onAwardCorrect: (winnerName: string) => void;
  onAwardWrong: (winnerName: string) => void;
  onResetRound: () => void;
  onEndSession: () => void;
  onCancelSession: () => void;
}

export const HostView: React.FC<HostViewProps> = ({
  sessionName,
  inviteCode,
  participants,
  sessionState,
  onStartRound,
  onAwardCorrect,
  onAwardWrong,
  onResetRound,
  onEndSession,
  onCancelSession
}) => {
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  const inviteUrl = `${window.location.origin}${window.location.pathname}?code=${inviteCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // Clipboard API unavailable (e.g. insecure context): fall back to a
      // temporary textarea + execCommand.
      const textarea = document.createElement('textarea');
      textarea.value = inviteUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const hasParticipants = participants.length > 0;

  // Render the Invite Code Screen when no participants have joined yet
  if (!hasParticipants) {
    return (
      <div className="flex flex-col min-h-screen justify-between p-6 max-w-lg mx-auto text-center animate-fade-slide-up">
        {/* Top: allow the host to back out before anyone joins */}
        <div className="flex justify-start">
          <button
            onClick={onCancelSession}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border theme-border hover:theme-bg-elevated theme-text-secondary text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cancel Session</span>
          </button>
        </div>

        {/* Big Large Invite Center Screen */}
        <div className="space-y-6">
          <p className="text-[var(--color-aubergine)] dark:text-[var(--text-accent-yellow)] font-extrabold uppercase tracking-widest text-xs">
            Host Dashboard · {sessionName}
          </p>
          <h2 className="text-2xl font-extrabold theme-text-primary">
            Waiting for participants...
          </h2>
          <p className="theme-text-secondary text-sm max-w-md mx-auto">
            Share the invite code or URL with your team on MS Teams to get started. Up to {MAX_PARTICIPANTS} players can join.
          </p>

          <div className="p-6 theme-bg-surface border-2 theme-border rounded-3xl shadow-md inline-block w-full">
            <p className="theme-text-secondary text-xs uppercase tracking-wider font-semibold mb-2">
              Invite Code
            </p>
            <div className="font-mono-jetbrains text-4xl sm:text-5xl font-extrabold tracking-widest theme-text-primary mb-4 select-all">
              {inviteCode}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row justify-center">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border theme-border hover:theme-bg-elevated theme-text-primary text-sm font-semibold transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[var(--text-accent-green)]" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                <span>{copied ? 'Copied!' : 'Copy Invite Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs theme-text-secondary flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Peer-to-peer session — the authority runs in your browser</span>
        </div>
      </div>
    );
  }

  // Active lobby screen once at least 1 person joins
  const isBuzzerActive = sessionState.status === 'ready';
  const isSomeoneBuzzed = sessionState.status === 'buzzed';
  const buzzedWinner = isSomeoneBuzzed ? sessionState.winner : null;

  const statusDotClass = isBuzzerActive
    ? 'bg-[var(--color-green)] animate-ping'
    : isSomeoneBuzzed
      ? 'bg-[var(--color-red)]'
      : 'bg-[var(--color-yellow)]';

  return (
    <div className="flex flex-col min-h-screen animate-fade-slide-up">
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b theme-border theme-bg-surface flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[var(--color-aubergine)] text-white">
            <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
          </span>
          <span className="font-bold text-sm truncate max-w-[120px] sm:max-w-[240px]">
            {sessionName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold theme-text-secondary">
            <span>Invite code:</span>
            <span className="font-mono-jetbrains font-bold text-[var(--text-accent-blue)]">{inviteCode}</span>
          </div>
          <button
            onClick={handleCopyLink}
            title="Copy Invite Link"
            className="p-1.5 rounded-lg border theme-border hover:theme-bg-elevated transition text-xs flex items-center gap-1.5 cursor-pointer theme-text-primary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--text-accent-green)]" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Link'}</span>
          </button>
          <div className="flex items-center gap-1 text-xs font-semibold theme-text-secondary bg-[var(--bg-primary)] px-2 py-1 rounded-full border theme-border">
            <Users className="w-3 h-3" aria-hidden="true" />
            <span>{participants.length}/{MAX_PARTICIPANTS}</span>
          </div>
        </div>
      </header>

      {/* Main Host Area (Desktop 2-column layout, Mobile single column) */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Participant Lobby list & scores */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="theme-bg-surface border theme-border rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold theme-text-primary text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--text-accent-blue)]" aria-hidden="true" />
              <span>Participants ({participants.length})</span>
            </h3>

            <div className="space-y-2 max-h-[260px] md:max-h-[500px] overflow-y-auto pr-1">
              {participants.map((p, idx) => {
                const color = getParticipantColor(idx);
                const isCurrentlyBuzzed = isSomeoneBuzzed && buzzedWinner === p.name;
                return (
                  <div
                    key={p.id}
                    className={`
                      flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150
                      ${isCurrentlyBuzzed
                        ? 'border-[var(--color-yellow)] bg-yellow-500/10 scale-[1.02] shadow-sm'
                        : 'theme-border theme-bg-elevated/40'}
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color.text }}
                        aria-hidden="true"
                      />
                      <span className="font-bold text-sm truncate theme-text-primary">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentlyBuzzed && (
                        <span className="text-[var(--text-accent-yellow)] animate-bounce">
                          <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
                        </span>
                      )}
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-500/10 theme-text-primary">
                        {p.score} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Columns: Control Center */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Main Action Console */}
          <div className="theme-bg-surface border theme-border rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-between min-h-[320px]">
            {/* Header/Status indication */}
            <div className="text-center md:text-left">
              <p className="theme-text-secondary text-xs font-semibold uppercase tracking-wider mb-1">
                Buzzer Console Status
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`} aria-hidden="true" />
                <span className="font-bold theme-text-primary" role="status">
                  {sessionState.status === 'waiting' && 'Lobby mode - waiting to start'}
                  {isBuzzerActive && 'Buzzer active - players can buzz!'}
                  {isSomeoneBuzzed && 'Buzzer locked! Winner deciding'}
                </span>
              </div>
            </div>

            {/* Display Big Center Status */}
            <div className="my-8 text-center flex flex-col items-center justify-center flex-1">
              {sessionState.status === 'waiting' && (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/10 text-[var(--text-accent-yellow)] flex items-center justify-center mx-auto">
                    <Zap className="w-8 h-8" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-extrabold theme-text-primary">Ready for next question?</h2>
                  <button
                    onClick={onStartRound}
                    className="bg-[var(--color-green)] hover:opacity-95 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-base flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Zap className="w-5 h-5 fill-current" aria-hidden="true" />
                    <span>Start Round (Buzzers On)</span>
                  </button>
                </div>
              )}

              {isBuzzerActive && (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-[var(--text-accent-green)] flex items-center justify-center mx-auto animate-pulse">
                    <Zap className="w-10 h-10 fill-current" aria-hidden="true" />
                  </div>
                  <h2 className="text-3xl font-black theme-text-primary">Waiting for Buzz...</h2>
                  <p className="theme-text-secondary text-sm">
                    Players are looking at their screens. Hit Reset if you need to stop.
                  </p>
                  <button
                    onClick={onResetRound}
                    className="px-6 py-2 rounded-xl border theme-border hover:theme-bg-elevated theme-text-primary text-xs font-bold transition mx-auto cursor-pointer"
                  >
                    Reset Buzzer
                  </button>
                </div>
              )}

              {isSomeoneBuzzed && buzzedWinner && (
                <div className="space-y-6 w-full max-w-md animate-spring-bounce">
                  <p className="text-[var(--text-accent-yellow)] font-bold text-xs uppercase tracking-widest">
                    ⚡ Fast-fingered winner! ⚡
                  </p>
                  <h2 className="text-4xl font-black theme-text-primary leading-tight truncate px-4">
                    {buzzedWinner}
                  </h2>
                  <p className="theme-text-secondary text-sm">
                    Award points or reset buzzer below.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => onAwardCorrect(buzzedWinner)}
                      className="bg-[var(--color-green)] hover:opacity-95 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-6 h-6 stroke-[3]" aria-hidden="true" />
                      <span>Correct</span>
                    </button>
                    <button
                      onClick={() => onAwardWrong(buzzedWinner)}
                      className="bg-[var(--color-red)] hover:opacity-95 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <X className="w-6 h-6 stroke-[3]" aria-hidden="true" />
                      <span>Wrong</span>
                    </button>
                  </div>

                  <button
                    onClick={onResetRound}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border theme-border hover:theme-bg-elevated theme-text-secondary text-xs font-bold transition mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset (No penalty)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom: End game control */}
            <div className="border-t theme-border pt-4 flex items-center justify-between">
              <span className="text-xs theme-text-secondary">
                Finished asking questions?
              </span>
              <button
                onClick={onEndSession}
                className="bg-red-500/10 hover:bg-red-500 text-[var(--text-accent-red)] hover:text-white border border-red-500/20 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trophy className="w-4 h-4" aria-hidden="true" />
                <span>End & Reveal Scoreboard</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

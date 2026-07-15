import React, { useEffect, useRef, useState } from 'react';
import { Users, Zap, Check, X, RefreshCw, Trophy, Copy, Shield, ArrowLeft } from 'lucide-react';
import { SessionState, Participant, MAX_PARTICIPANTS } from '../peer';
import { getPlayerColor } from '../names';
import { PlayerAvatar } from './PlayerAvatar';

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
  themeToggle?: React.ReactNode;
}

/** One card in the buzz-queue stack, carrying the player's own color. */
const BuzzCard: React.FC<{ name: string; top: boolean }> = ({ name, top }) => {
  const color = getPlayerColor(name);
  return (
    <div
      className={`h-24 md:h-28 rounded-2xl border-2 theme-bg-surface flex items-center justify-center gap-3 px-6 ${top ? 'shadow-lg' : 'shadow-sm'}`}
      style={{
        borderColor: top ? color.fg : color.border,
        backgroundImage: `linear-gradient(0deg, ${color.bg}, ${color.bg})`
      }}
    >
      <PlayerAvatar name={name} size="md" />
      <span className="text-2xl md:text-3xl font-black theme-text-primary truncate">{name}</span>
    </div>
  );
};

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
  onCancelSession,
  themeToggle
}) => {
  const [copied, setCopied] = useState(false);
  // Card of the just-dismissed wrong answer, kept around for its exit animation
  const [leavingCard, setLeavingCard] = useState<string | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leavingResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      if (leavingResetRef.current) clearTimeout(leavingResetRef.current);
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
      <div className="flex flex-col flex-1 w-full justify-between gap-6 p-4 sm:p-6 max-w-lg mx-auto text-center animate-fade-slide-up">
        {/* Top: back out before anyone joins; theme toggle on the right */}
        <div className="flex justify-between items-center">
          <button
            onClick={onCancelSession}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border theme-border hover:theme-bg-elevated theme-text-secondary text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cancel Session</span>
          </button>
          {themeToggle}
        </div>

        {/* Big Large Invite Center Screen */}
        <div className="space-y-6">
          <p className="text-[var(--color-aubergine)] dark:text-[var(--text-accent-yellow)] font-extrabold uppercase tracking-widest text-xs">
            {sessionName}
          </p>
          <h2 className="text-2xl font-extrabold theme-text-primary">
            Waiting for participants...
          </h2>
          <p className="theme-text-secondary text-sm max-w-md mx-auto">
            Share the invite code or link with your team.
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
          <span>Peer-to-peer — nothing leaves your browser</span>
        </div>
      </div>
    );
  }

  // Active lobby screen once at least 1 person joins
  const isRoundLive = sessionState.status === 'ready';
  const queue = sessionState.status === 'ready' ? sessionState.queue : [];
  const answering = queue[0] ?? null;

  const handleWrong = () => {
    if (!answering) return;
    setLeavingCard(answering);
    onAwardWrong(answering);
    if (leavingResetRef.current) clearTimeout(leavingResetRef.current);
    leavingResetRef.current = setTimeout(() => setLeavingCard(null), 350);
  };

  const statusDotClass = !isRoundLive
    ? 'bg-[var(--color-yellow)]'
    : queue.length === 0
      ? 'bg-[var(--color-green)] animate-ping'
      : 'bg-[var(--color-red)]';

  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
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
            className="h-9 px-2.5 rounded-lg border theme-border hover:theme-bg-elevated transition text-xs flex items-center gap-1.5 cursor-pointer theme-text-primary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--text-accent-green)]" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Link'}</span>
          </button>
          <div className="h-9 flex items-center gap-1 text-xs font-semibold theme-text-secondary bg-[var(--bg-primary)] px-2.5 rounded-full border theme-border">
            <Users className="w-3 h-3" aria-hidden="true" />
            <span>{participants.length}/{MAX_PARTICIPANTS}</span>
          </div>
          {themeToggle}
        </div>
      </header>

      {/* Main Host Area (Desktop 2-column layout, Mobile single column).
          On mobile the buzzer console comes FIRST so Start/Correct/Wrong stay
          above the fold regardless of how many participants join. */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Buzzer Console (first on mobile, right column on desktop) */}
        <div className="md:col-span-2 md:order-2 flex flex-col gap-4">
          {/* Main Action Console. The card swipe-out flies past this panel;
              body{overflow-x:clip} stops it from widening the page. */}
          <div className="theme-bg-surface border theme-border rounded-2xl p-4 sm:p-6 shadow-sm flex-1 flex flex-col justify-between min-h-[300px] md:min-h-[320px]">
            {/* Status indication */}
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`} aria-hidden="true" />
              <span className="font-mono-jetbrains font-bold text-xs uppercase tracking-wider theme-text-secondary" role="status">
                {!isRoundLive && 'Waiting to start'}
                {isRoundLive && queue.length === 0 && 'Buzzers live'}
                {isRoundLive && queue.length > 0 && `Buzzers live · ${queue.length} in line`}
              </span>
            </div>

            {/* Display Big Center Status */}
            <div className="my-6 md:my-8 text-center flex flex-col items-center justify-center flex-1">
              {sessionState.status === 'waiting' && (
                <div className="space-y-5">
                  <h2 className="text-xl md:text-2xl font-extrabold theme-text-primary text-balance">
                    Ready for the next question?
                  </h2>
                  <button
                    onClick={onStartRound}
                    className="bg-[var(--color-green)] hover:opacity-95 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-base flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Zap className="w-5 h-5 fill-current" aria-hidden="true" />
                    <span>Start Round</span>
                  </button>
                </div>
              )}

              {isRoundLive && queue.length === 0 && (
                <div className="space-y-5">
                  {leavingCard ? (
                    // Last wrong answer is still swiping out — keep the stage
                    <div className="relative h-24 md:h-28 w-full max-w-md mx-auto">
                      <div className="absolute inset-x-0 top-0 animate-swipe-out">
                        <BuzzCard name={leavingCard} top />
                      </div>
                    </div>
                  ) : (
                    <h2 className="text-2xl md:text-3xl font-black theme-text-primary">
                      <Zap className="inline w-6 h-6 md:w-7 md:h-7 mr-2 -mt-1 text-[var(--text-accent-green)] fill-current animate-pulse" aria-hidden="true" />
                      Waiting for a buzz...
                    </h2>
                  )}
                  <button
                    onClick={onResetRound}
                    className="px-6 py-2.5 rounded-xl border theme-border hover:theme-bg-elevated theme-text-primary text-xs font-bold transition mx-auto cursor-pointer"
                  >
                    Reset Buzzer
                  </button>
                </div>
              )}

              {isRoundLive && queue.length > 0 && (
                <div className="space-y-5 md:space-y-6 w-full max-w-md">
                  {/* Buzz-queue card stack: top card is answering, the rest
                      peek out behind it in buzz order */}
                  <div className="relative h-36 md:h-44">
                    {leavingCard && (
                      <div className="absolute inset-x-0 top-0 z-40 animate-swipe-out">
                        <BuzzCard name={leavingCard} top />
                      </div>
                    )}
                    {queue.slice(0, 3).map((name, i) => (
                      <div
                        key={name}
                        className="absolute inset-x-0 top-0 transition-all duration-300 animate-card-enter"
                        style={{
                          transform: `translateY(${i * 20}px) scale(${1 - i * 0.05})`,
                          zIndex: 30 - i * 10,
                          opacity: 1 - i * 0.3
                        }}
                      >
                        <BuzzCard name={name} top={i === 0} />
                      </div>
                    ))}
                    {queue.length > 3 && (
                      <div className="absolute -bottom-1 inset-x-0 flex items-center justify-center gap-1.5">
                        {queue.slice(3, 9).map(name => (
                          <PlayerAvatar key={name} name={name} size="xs" />
                        ))}
                        <span className="text-xs font-semibold theme-text-secondary">
                          {queue.length > 9 ? `+${queue.length - 9} more in line` : 'in line'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button
                      onClick={() => answering && onAwardCorrect(answering)}
                      className="bg-[var(--color-green)] hover:opacity-95 text-white font-bold py-4 px-4 md:px-6 rounded-2xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-6 h-6 stroke-[3]" aria-hidden="true" />
                      <span>Correct</span>
                    </button>
                    <button
                      onClick={handleWrong}
                      className="bg-[var(--color-red)] hover:opacity-95 text-white font-bold py-4 px-4 md:px-6 rounded-2xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
                    <span>Reset Buzzer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom: End game control */}
            <div className="border-t theme-border pt-4 flex justify-center sm:justify-end">
              <button
                onClick={onEndSession}
                className="bg-red-500/10 hover:bg-red-500 text-[var(--text-accent-red)] hover:text-white border border-red-500/20 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trophy className="w-4 h-4" aria-hidden="true" />
                <span>End & Reveal Scores</span>
              </button>
            </div>
          </div>
        </div>

        {/* Participant Lobby list & scores (second on mobile, left column on desktop) */}
        <div className="md:col-span-1 md:order-1 flex flex-col gap-4">
          <div className="theme-bg-surface border theme-border rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold theme-text-primary text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--text-accent-blue)]" aria-hidden="true" />
              <span>Participants ({participants.length})</span>
            </h3>

            <div className="space-y-2 max-h-[220px] md:max-h-[500px] overflow-y-auto pr-1">
              {participants.map((p) => {
                const color = getPlayerColor(p.name);
                const queuePosition = queue.indexOf(p.name);
                const isAnswering = queuePosition === 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl border transition-all duration-150 theme-border theme-bg-elevated/40"
                    style={isAnswering ? { borderColor: color.fg, backgroundColor: color.bg } : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PlayerAvatar name={p.name} size="sm" />
                      <span className="font-bold text-sm truncate theme-text-primary">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAnswering && (
                        <Zap className="w-4 h-4 fill-current animate-bounce" style={{ color: color.fg }} aria-hidden="true" />
                      )}
                      {queuePosition > 0 && (
                        <span className="text-[10px] font-bold font-mono-jetbrains px-1.5 py-0.5 rounded-full bg-slate-500/10 theme-text-secondary">
                          #{queuePosition + 1}
                        </span>
                      )}
                      <span className="text-[11px] font-bold font-mono-jetbrains tabular-nums whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-500/10 theme-text-primary">
                        {p.score} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

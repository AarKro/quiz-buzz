import React, { useEffect, useState, useRef } from 'react';
import { Users, Zap, Award, LogOut } from 'lucide-react';
import { SessionState, MAX_PARTICIPANTS } from '../peer';

interface ParticipantViewProps {
  sessionName: string;
  inviteCode: string;
  myName: string;
  participantCount: number;
  sessionState: SessionState;
  myScore: number;
  onBuzz: () => void;
  onLeave: () => void;
  themeToggle?: React.ReactNode;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  sessionName,
  inviteCode,
  myName,
  participantCount,
  sessionState,
  myScore,
  onBuzz,
  onLeave,
  themeToggle
}) => {
  const [hasShaked, setHasShaked] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(false);
  const buzzButtonRef = useRef<HTMLButtonElement>(null);

  const queue = sessionState.status === 'ready' ? sessionState.queue : [];
  const myQueuePosition = queue.indexOf(myName); // -1 = not in line
  const canBuzz = sessionState.status === 'ready' && myQueuePosition === -1;
  const isMeAnswering = myQueuePosition === 0;
  const isMeQueued = myQueuePosition > 0;
  const isWaiting = sessionState.status === 'waiting';
  const answering = queue[0] ?? null;

  // Keyboard shortcut: buzz with Space/Enter from anywhere on the page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore held-down keys
      if (e.code === 'Space' || e.code === 'Enter') {
        if (canBuzz && document.activeElement !== buzzButtonRef.current) {
          e.preventDefault();
          handleBuzz();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionState]);

  const handleBuzz = () => {
    if (canBuzz) {
      setButtonFlash(true);
      onBuzz();
      setTimeout(() => setButtonFlash(false), 500);
    } else {
      // Shake on invalid press
      setHasShaked(true);
      setTimeout(() => setHasShaked(false), 300);
    }
  };

  const buzzerStateClass = canBuzz
    ? 'bg-[var(--color-green)] text-white border-emerald-400 active:scale-95 active:shadow-inner cursor-pointer'
    : isMeAnswering
      ? 'bg-[var(--color-yellow)] text-slate-900 border-yellow-300 animate-spring-bounce cursor-default'
      : isMeQueued
        ? 'bg-[var(--color-blue)] text-white border-sky-400 cursor-default'
        : 'bg-neutral-500/20 theme-text-secondary border-neutral-500/10 cursor-not-allowed shadow-none';

  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b theme-border theme-bg-surface flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[var(--color-aubergine)] text-white">
            <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
          </span>
          <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-[300px]">
            {sessionName || 'Quiz Session'}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-secondary bg-[var(--bg-primary)] px-2.5 py-1 rounded-full border theme-border">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{participantCount}/{MAX_PARTICIPANTS}</span>
          </div>
          {themeToggle}
          <button
            onClick={onLeave}
            className="p-2 rounded-lg text-[var(--text-accent-red)] hover:bg-red-500/10 transition cursor-pointer"
            title="Leave Session"
            aria-label="Leave Session"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-lg mx-auto w-full">
        {/* Welcome card */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl font-extrabold theme-text-primary">
            {myName}
          </h2>
          <p className="text-xs font-mono-jetbrains tracking-wider text-[var(--text-accent-blue)] mt-1 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 inline-block">
            CODE: {inviteCode}
          </p>
        </div>

        {/* Big Buzzer Button Container. Sized against BOTH width and dynamic
            viewport height so the buzzer, status and score all fit on short
            phones (e.g. iPhone SE) without scrolling. */}
        <div className="relative w-[min(20rem,84vw,46dvh)] aspect-square my-2 sm:my-4 flex items-center justify-center">
          {/* Pulsing ring while this player can still buzz */}
          {canBuzz && (
            <div className="absolute inset-0 rounded-full bg-[var(--color-green)] opacity-20 animate-pulse-green pointer-events-none" aria-hidden="true" />
          )}

          <button
            ref={buzzButtonRef}
            disabled={sessionState.status === 'finished' || isWaiting || isMeAnswering || isMeQueued}
            onClick={handleBuzz}
            className={`
              w-[min(18rem,75vw,41dvh)] aspect-square rounded-full font-black text-3xl sm:text-4xl tracking-wider select-none
              flex flex-col items-center justify-center gap-1 border-8 shadow-2xl transition-all duration-150
              outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--color-blue)]
              ${buzzerStateClass}
              ${buttonFlash ? 'brightness-150 scale-105' : ''}
              ${hasShaked ? 'animate-shake' : ''}
            `}
          >
            {canBuzz && (
              <>
                <Zap className="w-12 h-12 fill-white animate-bounce" aria-hidden="true" />
                <span>BUZZ!</span>
              </>
            )}

            {isMeAnswering && (
              <>
                <Award className="w-12 h-12 animate-bounce" aria-hidden="true" />
                <span>YOU!</span>
              </>
            )}

            {isMeQueued && (
              <>
                <span className="text-5xl sm:text-6xl">#{myQueuePosition + 1}</span>
                <span className="text-sm font-semibold uppercase tracking-wider opacity-80">in line</span>
              </>
            )}

            {isWaiting && (
              <span className="text-base font-semibold px-4">
                Waiting for host...
              </span>
            )}
          </button>
        </div>

        {/* Player Status Message */}
        <div className="h-12 flex items-center justify-center mt-2 sm:mt-4" role="status" aria-live="polite">
          {canBuzz && queue.length === 0 && (
            <p className="theme-text-primary font-semibold text-lg animate-pulse">
              Know the answer? Buzz!
            </p>
          )}
          {isMeAnswering && (
            <p className="text-[var(--text-accent-yellow)] font-bold text-lg animate-bounce">
              Give your answer!
            </p>
          )}
          {!isMeAnswering && answering && (
            <p className="theme-text-secondary text-sm">
              {answering} is answering
            </p>
          )}
        </div>

        {/* Score display */}
        <div className="mt-4 sm:mt-8 theme-bg-surface border theme-border rounded-2xl px-6 py-3 sm:py-4 shadow-sm inline-flex items-center gap-3">
          <Award className="w-5 h-5 text-[var(--text-accent-yellow)]" aria-hidden="true" />
          <span className="font-semibold theme-text-secondary text-sm">Your Score:</span>
          <span className="text-2xl font-black theme-text-primary transition-all duration-300">
            {myScore}
          </span>
        </div>
      </main>
    </div>
  );
};

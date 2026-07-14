import React, { useEffect, useState, useRef } from 'react';
import { Users, Zap, Award, LogOut } from 'lucide-react';
import { SessionState } from '../peer';

interface ParticipantViewProps {
  sessionName: string;
  inviteCode: string;
  myName: string;
  participantCount: number;
  sessionState: SessionState;
  myScore: number;
  onBuzz: () => void;
  onLeave: () => void;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  sessionName,
  inviteCode,
  myName,
  participantCount,
  sessionState,
  myScore,
  onBuzz,
  onLeave
}) => {
  const [hasShaked, setHasShaked] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(false);
  const buzzButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard navigation for space/enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (sessionState.status === 'ready' && document.activeElement !== buzzButtonRef.current) {
          e.preventDefault();
          handleBuzz();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionState]);

  const handleBuzz = () => {
    if (sessionState.status === 'ready') {
      setButtonFlash(true);
      onBuzz();
      setTimeout(() => setButtonFlash(false), 500);
    } else {
      // Shake on invalid press
      setHasShaked(true);
      setTimeout(() => setHasShaked(false), 300);
    }
  };

  const isBuzzerEnabled = sessionState.status === 'ready';
  const isMeWinner = sessionState.status === 'buzzed' && sessionState.winner === myName;
  const isSomeoneElseWinner = sessionState.status === 'buzzed' && sessionState.winner !== myName;

  return (
    <div className="flex flex-col min-h-screen animate-fade-slide-up">
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 border-b theme-border theme-bg-surface flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[var(--color-aubergine)] text-white">
            <Zap className="w-4 h-4 fill-current" />
          </span>
          <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-[300px]">
            {sessionName || 'Quiz Session'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-secondary bg-[var(--bg-primary)] px-2.5 py-1 rounded-full border theme-border">
            <Users className="w-3.5 h-3.5" />
            <span>{participantCount}/30</span>
          </div>
          <button
            onClick={onLeave}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition"
            title="Leave Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
        {/* Welcome card */}
        <div className="mb-6">
          <p className="theme-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">
            Logged in as
          </p>
          <h2 className="text-xl font-extrabold theme-text-primary">
            {myName}
          </h2>
          <p className="text-xs font-mono-jetbrains tracking-wider text-[var(--color-blue)] mt-1 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 inline-block">
            CODE: {inviteCode}
          </p>
        </div>

        {/* Big Buzzer Button Container */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-4 flex items-center justify-center">
          {/* Pulsing ring if ready */}
          {isBuzzerEnabled && (
            <div className="absolute inset-0 rounded-full bg-[var(--color-green)] opacity-20 animate-pulse-green pointer-events-none" />
          )}

          <button
            ref={buzzButtonRef}
            disabled={sessionState.status === 'finished' || sessionState.status === 'waiting'}
            onClick={handleBuzz}
            className={`
              w-64 h-64 sm:w-72 sm:h-72 rounded-full font-black text-3xl sm:text-4xl tracking-wider select-none
              flex flex-col items-center justify-center gap-1 border-8 shadow-2xl transition-all duration-150 cursor-pointer
              outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--color-blue)]
              ${isBuzzerEnabled 
                ? 'bg-[var(--color-green)] text-white border-emerald-400 active:scale-95 active:shadow-inner' 
                : ''}
              ${isMeWinner 
                ? 'bg-[var(--color-yellow)] text-slate-900 border-yellow-300 animate-spring-bounce' 
                : ''}
              ${isSomeoneElseWinner 
                ? 'bg-[var(--color-red)] text-white border-rose-400 opacity-60' 
                : ''}
              ${sessionState.status === 'waiting' 
                ? 'bg-neutral-500/20 text-neutral-400 border-neutral-500/10 cursor-not-allowed shadow-none' 
                : ''}
              ${buttonFlash ? 'brightness-150 scale-105' : ''}
              ${hasShaked ? 'animate-shake' : ''}
            `}
          >
            {isBuzzerEnabled && (
              <>
                <Zap className="w-12 h-12 fill-white animate-bounce" />
                <span>BUZZ!</span>
              </>
            )}

            {isMeWinner && (
              <>
                <Award className="w-12 h-12 animate-bounce" />
                <span>YOU!</span>
              </>
            )}

            {isSomeoneElseWinner && (
              <span className="text-xl px-4 line-clamp-3 leading-snug">
                {sessionState.winner} <br />
                <span className="text-sm font-semibold uppercase tracking-wider opacity-80">was first!</span>
              </span>
            )}

            {sessionState.status === 'waiting' && (
              <span className="text-base font-semibold px-4">
                Waiting for host...
              </span>
            )}
          </button>
        </div>

        {/* Player Status Message */}
        <div className="h-12 flex items-center justify-center mt-4">
          {sessionState.status === 'ready' && (
            <p className="theme-text-primary font-semibold text-lg animate-pulse">
              Hit the button as fast as you can!
            </p>
          )}
          {sessionState.status === 'waiting' && (
            <p className="theme-text-secondary text-sm">
              Keep your finger ready for the next round
            </p>
          )}
          {isMeWinner && (
            <p className="text-[var(--color-yellow)] font-bold text-lg animate-bounce">
              Host is verifying your answer!
            </p>
          )}
          {isSomeoneElseWinner && (
            <p className="text-[var(--color-red)] font-semibold text-base">
              A bit too slow. Wait for the host to reset.
            </p>
          )}
        </div>

        {/* Score display */}
        <div className="mt-8 theme-bg-surface border theme-border rounded-2xl px-6 py-4 shadow-sm inline-flex items-center gap-3">
          <Award className="w-5 h-5 text-[var(--color-yellow)]" />
          <span className="font-semibold theme-text-secondary text-sm">Your Score:</span>
          <span className="text-2xl font-black theme-text-primary transition-all duration-300">
            {myScore}
          </span>
        </div>
      </main>
    </div>
  );
};

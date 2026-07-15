import React, { useEffect, useState, useRef } from 'react';
import { Users, Zap, Award, LogOut } from 'lucide-react';
import { SessionState, MAX_PARTICIPANTS } from '../peer';
import { getPlayerColor } from '../names';
import { PlayerListSheet } from './PlayerListSheet';

interface ParticipantViewProps {
  sessionName: string;
  myName: string;
  participantNames: string[];
  sessionState: SessionState;
  myScore: number;
  onBuzz: () => void;
  onLeave: () => void;
  themeToggle?: React.ReactNode;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  sessionName,
  myName,
  participantNames,
  sessionState,
  myScore,
  onBuzz,
  onLeave,
  themeToggle
}) => {
  const [hasShaked, setHasShaked] = useState(false);
  const [buttonFlash, setButtonFlash] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const buzzButtonRef = useRef<HTMLButtonElement>(null);
  const participantCount = Math.max(participantNames.length, 1);

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

  // Buzzer states sit on the player-colored ground. The live buzzer is
  // WHITE with the player's color as text — maximum pop on every jersey
  // (a green button would melt into the teal player's background).
  const buzzerStateClass = canBuzz
    ? 'bg-white border-white/50 active:scale-95 active:shadow-inner cursor-pointer'
    : isMeAnswering
      ? 'bg-[var(--color-yellow)] text-slate-900 border-yellow-300 animate-spring-bounce cursor-default'
      : isMeQueued
        ? 'bg-white/15 text-white border-white/30 cursor-default'
        : 'bg-black/25 text-white/75 border-white/10 cursor-not-allowed shadow-none';

  const myColor = getPlayerColor(myName);

  return (
    // The whole screen wears the player's color — their "jersey".
    <div
      className="flex flex-col flex-1 animate-fade-slide-up"
      style={{
        background: `linear-gradient(180deg, ${myColor.strong} 0%, color-mix(in srgb, ${myColor.strong} 80%, black) 100%)`
      }}
    >
      {/* Header — transparent, part of the jersey background */}
      <header className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="p-1 rounded-md bg-white/15">
            <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
          </span>
          <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-[300px]">
            {sessionName || 'Quiz Session'}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowPlayers(true)}
            aria-label={`Show all ${participantCount} players`}
            className="h-9 flex items-center gap-1.5 text-xs font-semibold text-white/85 bg-white/10 hover:bg-white/20 px-2.5 rounded-full border border-white/25 transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{participantCount}/{MAX_PARTICIPANTS}</span>
          </button>
          {themeToggle}
          <button
            onClick={onLeave}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Leave Session"
            aria-label="Leave Session"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-lg mx-auto w-full">
        {/* Player identity — the colored screen IS the avatar */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl font-black text-white drop-shadow-sm">
            {myName}
          </h2>
        </div>

        {/* Big Buzzer Button Container. Sized against BOTH width and dynamic
            viewport height so the buzzer, status and score all fit on short
            phones (e.g. iPhone SE) without scrolling. */}
        <div className="relative w-[min(20rem,84vw,46dvh)] aspect-square my-2 sm:my-4 flex items-center justify-center">
          {/* Pulsing ring while this player can still buzz */}
          {canBuzz && (
            <div className="absolute inset-0 rounded-full bg-white opacity-15 animate-pulse-green pointer-events-none" aria-hidden="true" />
          )}

          <button
            ref={buzzButtonRef}
            disabled={sessionState.status === 'finished' || isWaiting || isMeAnswering || isMeQueued}
            onClick={handleBuzz}
            style={canBuzz ? { color: myColor.strong } : undefined}
            className={`
              w-[min(18rem,75vw,41dvh)] aspect-square rounded-full font-black text-3xl sm:text-4xl tracking-wider select-none
              flex flex-col items-center justify-center gap-1 border-8 shadow-2xl transition-all duration-150
              outline-none focus:ring-4 focus:ring-white/60
              ${buzzerStateClass}
              ${buttonFlash ? 'brightness-150 scale-105' : ''}
              ${hasShaked ? 'animate-shake' : ''}
            `}
          >
            {canBuzz && (
              <>
                <Zap className="w-12 h-12 fill-current animate-bounce" aria-hidden="true" />
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
                <span className="text-5xl sm:text-6xl font-mono-jetbrains">#{myQueuePosition + 1}</span>
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
            <p className="text-white font-semibold text-lg animate-pulse">
              Know the answer? Buzz!
            </p>
          )}
          {isMeAnswering && (
            <p className="text-white font-bold text-lg animate-bounce drop-shadow-sm">
              Give your answer!
            </p>
          )}
          {!isMeAnswering && answering && (
            <p className="text-white/85 text-sm">
              {answering} is answering
            </p>
          )}
        </div>

        {/* Score readout — plain scoreboard text, deliberately not a button-like chip */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-mono-jetbrains font-bold uppercase tracking-[0.25em] text-white/60">
            Score
          </span>
          <span className="text-4xl font-black font-mono-jetbrains tabular-nums text-white transition-all duration-300">
            {myScore}
          </span>
        </div>
      </main>

      <PlayerListSheet
        open={showPlayers}
        onClose={() => setShowPlayers(false)}
        names={participantNames}
        myName={myName}
        queue={queue}
      />
    </div>
  );
};

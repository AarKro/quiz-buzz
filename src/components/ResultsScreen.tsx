import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Crown, Play, Sparkles, FastForward, Home } from 'lucide-react';

interface ResultsScreenProps {
  scores: Record<string, number>;
  onRestart: () => void;
  isHost: boolean;
}

const REVEAL_INTERVAL_MS = 1000;

const CONFETTI_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#00bcd4', '#009688', '#4caf50', '#ffeb3b', '#ff9800'
];

interface ConfettiPiece {
  x: number;
  y: number;
  r: number;
  d: number;
  color: string;
  tilt: number;
  tiltAngleIncremental: number;
  tiltAngle: number;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ scores, onRestart, isHost }) => {
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Sort ascending so players reveal in order of suspense (last place first,
  // winner last). Ties are ordered by name so the result is deterministic.
  const sortedPlayers = useMemo(
    () =>
      Object.entries(scores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name)),
    [scores]
  );

  const [visibleCount, setVisibleCount] = useState(prefersReducedMotion ? sortedPlayers.length : 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isWinnerRevealed = visibleCount >= sortedPlayers.length && sortedPlayers.length > 0;

  // Staggered reveal: schedule the next player one step at a time
  useEffect(() => {
    if (visibleCount >= sortedPlayers.length) return;
    const timer = setTimeout(() => setVisibleCount(c => c + 1), REVEAL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [visibleCount, sortedPlayers.length]);

  const skipReveal = () => setVisibleCount(sortedPlayers.length);

  // Simple HTML5 Canvas Confetti animation once the winner is revealed
  useEffect(() => {
    if (!isWinnerRevealed || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: ConfettiPiece[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > canvas.height) {
          pieces[idx] = { ...p, x: Math.random() * canvas.width, y: -20, tilt: Math.random() * 10 - 5 };
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isWinnerRevealed, prefersReducedMotion]);

  const winner = sortedPlayers[sortedPlayers.length - 1];

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-6 max-w-xl mx-auto w-full select-none overflow-hidden animate-fade-slide-up">
      {/* Confetti overlay background */}
      {isWinnerRevealed && !prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-50"
          aria-hidden="true"
        />
      )}

      {/* Header */}
      <div className="text-center mt-4">
        <div className="inline-flex p-3 rounded-2xl bg-yellow-500/10 text-[var(--text-accent-yellow)] mb-3">
          <Trophy className="w-8 h-8 fill-current" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight theme-text-primary">
          The Final Standings
        </h1>
        <p className="theme-text-secondary text-sm mt-1">
          {isWinnerRevealed ? 'Results are fully revealed!' : 'Revealing standings... hold your breath!'}
        </p>
        {!isWinnerRevealed && sortedPlayers.length > 0 && (
          <button
            onClick={skipReveal}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border theme-border hover:theme-bg-elevated theme-text-secondary text-xs font-bold transition cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Skip reveal</span>
          </button>
        )}
      </div>

      {/* Main Leaderboard */}
      <div className="my-8 flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        <div className="space-y-3">
          {sortedPlayers.length === 0 ? (
            <div className="text-center py-10 theme-text-secondary">
              No participant joined this session.
            </div>
          ) : (
            sortedPlayers.map((player, idx) => {
              const displayIndex = sortedPlayers.length - idx; // Rank (1 is winner)
              const isRevealed = idx < visibleCount;
              const isFirstPlace = idx === sortedPlayers.length - 1;
              const highlightWinner = isFirstPlace && isWinnerRevealed;

              if (!isRevealed) return null;

              return (
                <div
                  key={player.name}
                  className={`
                    flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 animate-spring-bounce
                    ${highlightWinner
                      ? 'border-[var(--color-yellow)] bg-yellow-500/10 shadow-lg scale-105 relative z-10'
                      : 'theme-border theme-bg-surface'}
                  `}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0
                      ${highlightWinner
                        ? 'bg-[var(--color-yellow)] text-slate-900'
                        : 'bg-slate-500/10 theme-text-primary'}
                    `}>
                      {highlightWinner ? <Crown className="w-4.5 h-4.5 fill-current" aria-hidden="true" /> : displayIndex}
                    </span>
                    <span className={`font-extrabold truncate ${highlightWinner ? 'text-lg text-[var(--text-accent-yellow)]' : 'theme-text-primary'}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-lg ${highlightWinner ? 'text-xl theme-text-primary' : 'theme-text-secondary'}`}>
                      {player.score}
                    </span>
                    <span className="text-xs font-semibold theme-text-secondary uppercase">pts</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Celebratory Banner */}
      {isWinnerRevealed && winner && (
        <div className="text-center bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl mb-8 animate-spring-bounce">
          <div className="flex items-center justify-center gap-2 text-[var(--text-accent-green)] mb-1">
            <Sparkles className="w-5 h-5 fill-current" aria-hidden="true" />
            <span className="font-black text-sm uppercase tracking-wider">Congratulations!</span>
            <Sparkles className="w-5 h-5 fill-current" aria-hidden="true" />
          </div>
          <p className="theme-text-primary font-black text-2xl truncate">
            {winner.name} Wins!
          </p>
          <p className="theme-text-secondary text-xs mt-1">
            With a staggering score of {winner.score} points!
          </p>
        </div>
      )}

      {/* Bottom Button Action */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2">
        {isHost ? (
          <button
            onClick={onRestart}
            className="w-full bg-[var(--color-blue)] hover:opacity-95 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>Create New Session</span>
          </button>
        ) : (
          <>
            <p className="theme-text-secondary text-xs text-center">
              The Host can start a new quiz session at any time. Thank you for playing!
            </p>
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border theme-border hover:theme-bg-elevated theme-text-primary text-xs font-bold transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Home</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

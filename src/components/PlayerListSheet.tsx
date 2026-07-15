import React, { useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { getPlayerColor } from '../names';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerListSheetProps {
  open: boolean;
  onClose: () => void;
  names: string[];
  myName: string;
  /** Current buzz queue, used to badge who is answering / in line */
  queue: string[];
}

/** Bottom sheet listing everyone in the session. */
export const PlayerListSheet: React.FC<PlayerListSheetProps> = ({
  open,
  onClose,
  names,
  myName,
  queue
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Players in this session"
        className="absolute inset-x-0 bottom-0 theme-bg-surface rounded-t-3xl shadow-2xl animate-sheet-up max-h-[70dvh] flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="w-10 h-1 rounded-full bg-slate-500/30 mx-auto mt-3" aria-hidden="true" />

        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-bold theme-text-primary">
            Players <span className="font-mono-jetbrains text-sm theme-text-secondary">({names.length})</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close player list"
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:theme-bg-elevated theme-text-secondary transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <ul className="overflow-y-auto px-4 pb-2 space-y-2">
          {names.map((name) => {
            const queuePosition = queue.indexOf(name);
            const isAnswering = queuePosition === 0;
            const color = getPlayerColor(name);
            return (
              <li
                key={name}
                className="flex items-center justify-between p-2.5 rounded-xl border theme-border theme-bg-elevated/40"
                style={isAnswering ? { borderColor: color.fg, backgroundColor: color.bg } : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlayerAvatar name={name} size="sm" />
                  <span className="font-bold text-sm truncate theme-text-primary">{name}</span>
                  {name === myName && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-slate-500/10 theme-text-secondary">
                      you
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAnswering && (
                    <Zap className="w-4 h-4 fill-current" style={{ color: color.fg }} aria-hidden="true" />
                  )}
                  {queuePosition > 0 && (
                    <span className="text-[10px] font-bold font-mono-jetbrains px-1.5 py-0.5 rounded-full bg-slate-500/10 theme-text-secondary">
                      #{queuePosition + 1}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

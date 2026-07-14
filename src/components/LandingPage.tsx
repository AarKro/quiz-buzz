import React, { useState, useRef, useEffect } from 'react';
import { Play, Users, ArrowRight, ArrowLeft, User, RefreshCw, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { generateRandomName } from '../names';

const CODE_LENGTH = 6;

interface LandingPageProps {
  onCreateSession: (sessionName: string) => void;
  onJoinSession: (code: string, name: string) => void;
  initialCode?: string;
  connecting?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

function codeToDigits(code: string): string[] {
  const digits = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH).split('');
  while (digits.length < CODE_LENGTH) {
    digits.push('');
  }
  return digits;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateSession,
  onJoinSession,
  initialCode = '',
  connecting = false,
  error = null,
  onClearError
}) => {
  const [mode, setMode] = useState<'menu' | 'host-setup' | 'join-setup'>('menu');
  const [sessionName, setSessionName] = useState('');
  const [participantName, setParticipantName] = useState('');

  const [codeDigits, setCodeDigits] = useState<string[]>(() => codeToDigits(initialCode));
  // Tracking focused field to hide/show the "•" placeholder dynamically
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Local Form Validations
  const [sessionNameError, setSessionNameError] = useState<string | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [participantNameError, setParticipantNameError] = useState<string | null>(null);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync initialCode changes (e.g. from URL pre-fill)
  useEffect(() => {
    if (initialCode) {
      setCodeDigits(codeToDigits(initialCode));
      setMode('join-setup');
    }
  }, [initialCode]);

  const clearFieldErrors = () => {
    onClearError?.();
    setInviteCodeError(null);
  };

  const handleDigitChange = (index: number, value: string) => {
    clearFieldErrors();
    const val = value.toUpperCase().slice(-1); // Only take the last character typed
    if (!/^[A-Z0-9]?$/.test(val)) return; // Allow only alphanumeric characters

    const nextDigits = [...codeDigits];
    nextDigits[index] = val;
    setCodeDigits(nextDigits);

    // Auto-focus next input if a value is typed
    if (val && index < CODE_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      clearFieldErrors();
      const nextDigits = [...codeDigits];
      if (!codeDigits[index] && index > 0) {
        // If current digit is empty, clear the previous digit and focus it
        nextDigits[index - 1] = '';
        setCodeDigits(nextDigits);
        digitRefs.current[index - 1]?.focus();
      } else {
        nextDigits[index] = '';
        setCodeDigits(nextDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      e.preventDefault();
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    clearFieldErrors();
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
    if (pastedText) {
      setCodeDigits(codeToDigits(pastedText));
      // Focus the last filled input or the last input
      const lastIndex = Math.min(pastedText.length, CODE_LENGTH - 1);
      digitRefs.current[lastIndex]?.focus();
    }
  };

  const handleGenerateName = () => {
    setParticipantName(generateRandomName());
    setParticipantNameError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connecting) return;
    if (!sessionName.trim()) {
      setSessionNameError('Session name cannot be empty.');
      return;
    }
    onCreateSession(sessionName.trim());
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connecting) return;
    const finalCode = codeDigits.join('').toUpperCase();
    const finalName = participantName.trim();

    let hasError = false;

    if (finalCode.length < CODE_LENGTH) {
      setInviteCodeError('Invite code must be exactly 6 characters.');
      hasError = true;
    }

    if (!finalName) {
      setParticipantNameError('Display name cannot be empty.');
      hasError = true;
    }

    if (hasError) return;

    onJoinSession(finalCode, finalName);
  };

  const handleBackToMenu = () => {
    onClearError?.();
    setSessionNameError(null);
    setInviteCodeError(null);
    setParticipantNameError(null);
    setMode('menu');
  };

  const renderError = (message: string) => (
    <div
      role="alert"
      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--text-accent-red)] text-xs font-semibold flex items-center gap-2 animate-shake"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );

  return (
    <div className="max-w-md w-full mx-auto px-4 py-6 sm:py-8 animate-fade-slide-up">
      {/* Brand Logo & Title */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-aubergine)] text-white shadow-lg mb-4 animate-float">
          <Zap className="w-9 h-9 fill-yellow-400 text-yellow-400" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight theme-text-primary mb-2">
          quiz<span className="text-[var(--text-accent-blue)]">-buzz</span>
        </h1>
        <p className="theme-text-secondary text-sm">
          Lightweight, real-time buzzer for your team games
        </p>
      </div>

      {mode === 'menu' && (
        <div className="space-y-4">
          {error && renderError(error)}

          <button
            onClick={() => setMode('host-setup')}
            className="w-full flex items-center justify-between p-5 rounded-2xl theme-bg-surface border-2 theme-border hover:border-[var(--color-blue)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-primary)] hover:brightness-95 hover:dark:brightness-110 transition-all duration-150 group shadow-sm text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-[var(--text-accent-blue)]">
                <Play className="w-6 h-6 fill-current" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-lg theme-text-primary">Create a Session</h3>
                <p className="theme-text-secondary text-xs">Host and moderate a buzzer match</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 theme-text-secondary group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>

          <button
            onClick={() => {
              setMode('join-setup');
              if (!participantName) {
                setParticipantName(generateRandomName());
              }
            }}
            className="w-full flex items-center justify-between p-5 rounded-2xl theme-bg-surface border-2 theme-border hover:border-[var(--color-green)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-primary)] hover:brightness-95 hover:dark:brightness-110 transition-all duration-150 group shadow-sm text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-[var(--text-accent-green)]">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-lg theme-text-primary">Join a Session</h3>
                <p className="theme-text-secondary text-xs">Buzz in to answer questions</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 theme-text-secondary group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
        </div>
      )}

      {mode === 'host-setup' && (
        <form onSubmit={handleCreateSubmit} className="theme-bg-surface rounded-2xl border theme-border p-6 shadow-md space-y-4">
          <h2 className="text-xl font-bold theme-text-primary">Create Session</h2>

          {(error || sessionNameError) && renderError(sessionNameError || error || '')}

          <div>
            <label htmlFor="session-name" className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Session Name
            </label>
            <input
              id="session-name"
              type="text"
              placeholder="e.g., Friday Warmup Quiz"
              value={sessionName}
              onChange={(e) => {
                onClearError?.();
                setSessionNameError(null);
                setSessionName(e.target.value);
              }}
              className={`w-full px-4 py-3 rounded-xl border theme-bg-elevated theme-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] transition-all text-base sm:text-sm
                ${sessionNameError ? 'border-red-500' : 'theme-border'}`}
              maxLength={40}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackToMenu}
              disabled={connecting}
              className="flex-1 px-4 py-3 rounded-xl border theme-border bg-transparent theme-text-primary hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-primary)] hover:brightness-90 hover:dark:brightness-125 flex items-center justify-center gap-1.5 text-sm font-extrabold transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="flex-1 bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/85 active:bg-[var(--color-blue)]/70 hover:brightness-90 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Connecting…</span>
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      )}

      {mode === 'join-setup' && (
        <form onSubmit={handleJoinSubmit} className="theme-bg-surface rounded-2xl border theme-border p-6 shadow-md space-y-4">
          <h2 className="text-xl font-bold theme-text-primary">Join Session</h2>

          {(error || inviteCodeError || participantNameError) &&
            renderError(inviteCodeError || participantNameError || error || '')}

          <fieldset>
            <legend className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Invite Code (6 letters/digits)
            </legend>
            {/* 6 split digit inputs (flexible width so they fit 320px screens) */}
            <div className="flex justify-between gap-1.5 sm:gap-2 my-2">
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { digitRefs.current[idx] = el; }}
                  type="text"
                  inputMode="text"
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Invite code character ${idx + 1} of ${CODE_LENGTH}`}
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(idx, e)}
                  onPaste={handleDigitPaste}
                  onFocus={() => setFocusedIndex(idx)}
                  onBlur={() => setFocusedIndex(null)}
                  className={`w-full min-w-0 max-w-12 h-12 text-center text-xl font-black rounded-xl border-2 theme-bg-elevated theme-text-primary focus:outline-none focus:border-[var(--color-green)] focus:ring-2 focus:ring-[var(--color-green)] transition-all uppercase font-mono-jetbrains
                    ${inviteCodeError ? 'border-red-500' : 'theme-border'}`}
                  placeholder={focusedIndex === idx ? '' : '•'}
                />
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="display-name" className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Your Display Name
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3.5 theme-text-secondary">
                  <User className="w-4 h-4" aria-hidden="true" />
                </span>
                <input
                  id="display-name"
                  type="text"
                  placeholder="Anonymous Animal"
                  value={participantName}
                  onChange={(e) => {
                    onClearError?.();
                    setParticipantNameError(null);
                    setParticipantName(e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border theme-bg-elevated theme-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-green)] transition-all text-base sm:text-sm
                    ${participantNameError ? 'border-red-500' : 'theme-border'}`}
                  maxLength={20}
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateName}
                title="Generate funny name"
                aria-label="Generate a random display name"
                className="p-3 rounded-xl border theme-border bg-transparent theme-text-primary hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-primary)] hover:brightness-90 hover:dark:brightness-125 transition-all duration-150 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackToMenu}
              disabled={connecting}
              className="flex-1 px-4 py-3 rounded-xl border theme-border bg-transparent theme-text-primary hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-primary)] hover:brightness-90 hover:dark:brightness-125 flex items-center justify-center gap-1.5 text-sm font-extrabold transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="flex-1 font-extrabold py-3 px-4 rounded-xl shadow-md transition text-sm cursor-pointer bg-[var(--color-green)] hover:bg-[var(--color-green)]/85 active:bg-[var(--color-green)]/70 hover:brightness-90 text-white flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Connecting…</span>
                </>
              ) : (
                'Join Game'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

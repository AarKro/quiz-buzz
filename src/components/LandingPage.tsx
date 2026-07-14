import React, { useState, useRef, useEffect } from 'react';
import { Play, Users, ArrowRight, User, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { generateRandomName } from '../names';

interface LandingPageProps {
  onCreateSession: (sessionName: string) => void;
  onJoinSession: (code: string, name: string) => void;
  initialCode?: string;
  error?: string | null;
  onClearError?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateSession,
  onJoinSession,
  initialCode = '',
  error = null,
  onClearError
}) => {
  const [mode, setMode] = useState<'menu' | 'host-setup' | 'join-setup'>('menu');
  const [sessionName, setSessionName] = useState('');
  const [participantName, setParticipantName] = useState('');

  // 6 digit invite code inputs
  const [codeDigits, setCodeDigits] = useState<string[]>(() => {
    const initial = initialCode.toUpperCase().slice(0, 6).split('');
    while (initial.length < 6) {
      initial.push('');
    }
    return initial;
  });

  // Local Form Validations
  const [sessionNameError, setSessionNameError] = useState<string | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [participantNameError, setParticipantNameError] = useState<string | null>(null);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync initialCode changes (e.g. from URL pre-fill)
  useEffect(() => {
    if (initialCode) {
      const parts = initialCode.toUpperCase().slice(0, 6).split('');
      while (parts.length < 6) {
        parts.push('');
      }
      setCodeDigits(parts);
      setMode('join-setup');
    }
  }, [initialCode]);

  const handleDigitChange = (index: number, value: string) => {
    if (onClearError) onClearError();
    setInviteCodeError(null); // Clear validation error as they write
    const val = value.toUpperCase().slice(-1); // Only take the last character typed
    if (!/^[A-Z0-9]?$/.test(val)) return; // Allow only alphanumeric characters

    const nextDigits = [...codeDigits];
    nextDigits[index] = val;
    setCodeDigits(nextDigits);

    // Auto-focus next input if a value is typed
    if (val && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onClearError) onClearError();
    setInviteCodeError(null); // Clear validation error as they write
    if (e.key === 'Backspace') {
      if (!codeDigits[index] && index > 0) {
        // If current digit is empty, clear the previous digit and focus it
        const nextDigits = [...codeDigits];
        nextDigits[index - 1] = '';
        setCodeDigits(nextDigits);
        digitRefs.current[index - 1]?.focus();
      } else {
        // Clear current digit
        const nextDigits = [...codeDigits];
        nextDigits[index] = '';
        setCodeDigits(nextDigits);
      }
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (onClearError) onClearError();
    setInviteCodeError(null); // Clear validation error as they write
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (pastedText) {
      const nextDigits = pastedText.split('');
      while (nextDigits.length < 6) {
        nextDigits.push('');
      }
      setCodeDigits(nextDigits);
      // Focus the last non-empty input or the last input
      const lastIndex = Math.min(pastedText.length, 5);
      digitRefs.current[lastIndex]?.focus();
    }
  };

  const handleGenerateName = () => {
    setParticipantName(generateRandomName());
    setParticipantNameError(null); // Clear validation error on generate
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setSessionNameError('Session name cannot be empty.');
      return;
    }
    onCreateSession(sessionName.trim());
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = codeDigits.join('').toUpperCase();
    const finalName = participantName.trim();

    let hasError = false;

    if (finalCode.length < 6) {
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

  const isCodeComplete = codeDigits.join('').length === 6;

  const handleBackToMenu = () => {
    if (onClearError) onClearError();
    setSessionNameError(null);
    setInviteCodeError(null);
    setParticipantNameError(null);
    setMode('menu');
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 animate-fade-slide-up">
      {/* Brand Logo & Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-aubergine)] text-white shadow-lg mb-4 animate-float">
          <Zap className="w-9 h-9 fill-yellow-400 text-yellow-400" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight theme-text-primary mb-2">
          quiz<span className="text-[var(--color-blue)]">-buzz</span>
        </h1>
        <p className="theme-text-secondary text-sm">
          Lightweight, real-time buzzer for your team games
        </p>
      </div>

      {mode === 'menu' && (
        <div className="space-y-4">
          <button
            onClick={() => setMode('host-setup')}
            className="w-full flex items-center justify-between p-5 rounded-2xl theme-bg-surface border-2 theme-border hover:border-[var(--color-blue)] transition-all duration-100 group shadow-sm text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-[var(--color-blue)]">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-lg theme-text-primary">Create a Session</h3>
                <p className="theme-text-secondary text-xs">Host and moderate a buzzer match</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 theme-text-secondary group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              setMode('join-setup');
              if (!participantName) {
                setParticipantName(generateRandomName());
              }
            }}
            className="w-full flex items-center justify-between p-5 rounded-2xl theme-bg-surface border-2 theme-border hover:border-[var(--color-green)] transition-all duration-100 group shadow-sm text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-[var(--color-green)]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg theme-text-primary">Join a Session</h3>
                <p className="theme-text-secondary text-xs">Buzz in to answer questions</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 theme-text-secondary group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {mode === 'host-setup' && (
        <form onSubmit={handleCreateSubmit} className="theme-bg-surface rounded-2xl border theme-border p-6 shadow-md space-y-4">
          <h2 className="text-xl font-bold theme-text-primary">Create Session</h2>
          
          {(error || sessionNameError) && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{sessionNameError || error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Session Name
            </label>
            <input
              type="text"
              placeholder="e.g., Friday Warmup Quiz"
              value={sessionName}
              onChange={(e) => {
                if (onClearError) onClearError();
                setSessionNameError(null); // Clear validation error as they write
                setSessionName(e.target.value);
              }}
              className={`w-full px-4 py-3 rounded-xl border theme-bg-elevated theme-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] transition-all text-sm
                ${sessionNameError ? 'border-red-500' : 'theme-border'}`}
              maxLength={40}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="flex-1 px-4 py-3 rounded-xl border theme-border theme-text-secondary hover:theme-bg-elevated hover:theme-text-primary bg-transparent text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[var(--color-blue)] hover:opacity-90 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition text-sm cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {mode === 'join-setup' && (
        <form onSubmit={handleJoinSubmit} className="theme-bg-surface rounded-2xl border theme-border p-6 shadow-md space-y-4">
          <h2 className="text-xl font-bold theme-text-primary">Join Session</h2>

          {(error || inviteCodeError || participantNameError) && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{inviteCodeError || participantNameError || error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Invite Code (6 letters/digits)
            </label>
            {/* 6 split digit inputs */}
            <div className="flex justify-between gap-2 my-2">
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { digitRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(idx, e)}
                  onPaste={idx === 0 ? handleDigitPaste : undefined}
                  className={`w-12 h-12 text-center text-xl font-black rounded-xl border-2 theme-bg-elevated theme-text-primary focus:outline-none focus:border-[var(--color-green)] focus:ring-2 focus:ring-[var(--color-green)] transition-all uppercase font-mono-jetbrains
                    ${inviteCodeError ? 'border-red-500' : 'theme-border'}`}
                  placeholder="•"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Your Display Name
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3.5 theme-text-secondary">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Anonymous Animal"
                  value={participantName}
                  onChange={(e) => {
                    if (onClearError) onClearError();
                    setParticipantNameError(null); // Clear validation error as they write
                    setParticipantName(e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border theme-bg-elevated theme-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-green)] transition-all text-sm
                    ${participantNameError ? 'border-red-500' : 'theme-border'}`}
                  maxLength={20}
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateName}
                title="Generate funny name"
                className="p-3 rounded-xl border theme-border hover:theme-bg-elevated theme-text-primary transition-all duration-150 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="flex-1 px-4 py-3 rounded-xl border theme-border theme-text-secondary hover:theme-bg-elevated hover:theme-text-primary bg-transparent text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 font-extrabold py-3 px-4 rounded-xl shadow-md transition text-sm cursor-pointer bg-[var(--color-green)] hover:opacity-90 text-white"
            >
              Join Game
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

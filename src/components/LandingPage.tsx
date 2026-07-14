import React, { useState } from 'react';
import { Play, Users, ArrowRight, User, RefreshCw, Zap } from 'lucide-react';
import { generateRandomName } from '../names';

interface LandingPageProps {
  onCreateSession: (sessionName: string) => void;
  onJoinSession: (code: string, name: string) => void;
  initialCode?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateSession,
  onJoinSession,
  initialCode = ''
}) => {
  const [mode, setMode] = useState<'menu' | 'host-setup' | 'join-setup'>('menu');
  const [sessionName, setSessionName] = useState('');
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [participantName, setParticipantName] = useState('');

  const handleGenerateName = () => {
    setParticipantName(generateRandomName());
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionName.trim()) {
      onCreateSession(sessionName.trim());
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = inviteCode.trim().toUpperCase();
    const finalName = participantName.trim() || generateRandomName();
    if (finalCode) {
      onJoinSession(finalCode, finalName);
    }
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
          <div>
            <label className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Session Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Friday Warmup Quiz"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border theme-border theme-bg-elevated theme-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] transition-all text-sm"
              maxLength={40}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMode('menu')}
              className="flex-1 px-4 py-3 rounded-xl border theme-border theme-text-secondary hover:theme-bg-elevated text-sm font-semibold transition"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-[var(--color-blue)] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition text-sm"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {mode === 'join-setup' && (
        <form onSubmit={handleJoinSubmit} className="theme-bg-surface rounded-2xl border theme-border p-6 shadow-md space-y-4">
          <h2 className="text-xl font-bold theme-text-primary">Join Session</h2>

          <div>
            <label className="block text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-2">
              Invite Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g., X7K2AF"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl border theme-border theme-bg-elevated theme-text-primary font-mono-jetbrains tracking-widest text-lg uppercase focus:outline-none focus:ring-2 focus:ring-[var(--color-green)] transition-all text-center"
              maxLength={6}
              autoFocus={!initialCode}
            />
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
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border theme-border theme-bg-elevated theme-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-green)] transition-all text-sm"
                  maxLength={20}
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateName}
                title="Generate funny name"
                className="p-3 rounded-xl border theme-border hover:theme-bg-elevated theme-text-primary transition flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMode('menu')}
              className="flex-1 px-4 py-3 rounded-xl border theme-border theme-text-secondary hover:theme-bg-elevated text-sm font-semibold transition"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-[var(--color-green)] hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition text-sm"
            >
              Join Game
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

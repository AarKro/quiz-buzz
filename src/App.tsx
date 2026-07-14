import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { ParticipantView } from './components/ParticipantView';
import { HostView } from './components/HostView';
import { ResultsScreen } from './components/ResultsScreen';
import { useTheme } from './hooks/useTheme';
import { useHostSession } from './hooks/useHostSession';
import { useParticipantSession } from './hooks/useParticipantSession';

type Role = 'landing' | 'host' | 'participant';

export default function App() {
  const { darkMode, toggleTheme } = useTheme();

  const [role, setRole] = useState<Role>('landing');

  const host = useHostSession();
  const participant = useParticipantSession();

  // Extract ?code=XXX from URL to join directly
  const [urlInviteCode, setUrlInviteCode] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setUrlInviteCode(code.trim().toUpperCase());
    }
  }, []);

  // Route based on connection lifecycle
  useEffect(() => {
    if (role === 'landing' && host.status === 'open') setRole('host');
  }, [role, host.status]);

  useEffect(() => {
    if (role === 'landing' && participant.status === 'joined') setRole('participant');
  }, [role, participant.status]);

  // Kicked / connection lost: fall back to landing, error stays visible there
  useEffect(() => {
    if (role === 'participant' && participant.status === 'error') setRole('landing');
  }, [role, participant.status]);

  useEffect(() => {
    if (role === 'host' && host.status === 'error') setRole('landing');
  }, [role, host.status]);

  const handleHostRestart = () => {
    host.closeSession();
    setRole('landing');
  };

  const handleParticipantLeave = () => {
    const active = participant.sessionState.status;
    if (active === 'ready' || active === 'buzzed') {
      const confirmed = window.confirm('Leave the session while a round is running?');
      if (!confirmed) return;
    }
    participant.leave();
    setRole('landing');
  };

  const isConnecting = host.status === 'connecting' || participant.status === 'connecting';
  const landingError = host.errorMessage ?? participant.errorMessage;

  const hostFinished = role === 'host' && host.sessionState.status === 'finished';
  const participantFinished = role === 'participant' && participant.sessionState.status === 'finished';

  return (
    <div className="min-h-dvh flex flex-col justify-between theme-bg-primary transition-colors">
      <div className="flex-1 flex flex-col justify-center">
        {role === 'landing' && (
          <LandingPage
            onCreateSession={host.createSession}
            onJoinSession={participant.join}
            initialCode={urlInviteCode}
            connecting={isConnecting}
            error={landingError}
            onClearError={() => {
              host.clearError();
              participant.clearError();
            }}
          />
        )}

        {role === 'host' && !hostFinished && (
          <HostView
            sessionName={host.sessionName}
            inviteCode={host.inviteCode}
            participants={host.participants}
            sessionState={host.sessionState}
            onStartRound={host.startRound}
            onAwardCorrect={host.awardCorrect}
            onAwardWrong={host.awardWrong}
            onResetRound={host.resetRound}
            onEndSession={host.endSession}
            onCancelSession={handleHostRestart}
          />
        )}

        {role === 'participant' && !participantFinished && (
          <ParticipantView
            sessionName={participant.sessionName}
            inviteCode={participant.inviteCode}
            myName={participant.assignedName}
            participantCount={participant.participantCount}
            sessionState={participant.sessionState}
            myScore={participant.myScore}
            onBuzz={participant.buzz}
            onLeave={handleParticipantLeave}
          />
        )}

        {hostFinished && host.sessionState.status === 'finished' && (
          <ResultsScreen
            scores={host.sessionState.scores}
            isHost
            onRestart={handleHostRestart}
          />
        )}

        {participantFinished && participant.sessionState.status === 'finished' && (
          <ResultsScreen
            scores={participant.sessionState.scores}
            isHost={false}
            onRestart={() => {
              participant.leave();
              setRole('landing');
            }}
          />
        )}
      </div>

      <footer className="py-3 text-center">
        <button
          onClick={toggleTheme}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border theme-border theme-bg-surface hover:theme-bg-elevated theme-text-primary text-xs font-bold transition shadow-sm cursor-pointer"
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[var(--text-accent-yellow)] fill-current" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-500 fill-current" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

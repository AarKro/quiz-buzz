import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
  /** Style for placement on a player-colored background instead of a neutral surface */
  onColor?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, onToggle, onColor = false }) => (
  <button
    onClick={onToggle}
    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    title={darkMode ? 'Light mode' : 'Dark mode'}
    className={`h-9 w-9 flex items-center justify-center rounded-lg border transition cursor-pointer ${
      onColor
        ? 'border-white/25 bg-white/10 hover:bg-white/20 text-white'
        : 'theme-border theme-bg-surface hover:theme-bg-elevated theme-text-primary'
    }`}
  >
    {darkMode ? (
      <Sun className={`w-4 h-4 ${onColor ? 'text-yellow-300' : 'text-[var(--text-accent-yellow)]'}`} aria-hidden="true" />
    ) : (
      <Moon className={`w-4 h-4 ${onColor ? 'text-white' : 'text-slate-500'}`} aria-hidden="true" />
    )}
  </button>
);

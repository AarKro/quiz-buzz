import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, onToggle }) => (
  <button
    onClick={onToggle}
    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    title={darkMode ? 'Light mode' : 'Dark mode'}
    className="p-2 rounded-lg border theme-border theme-bg-surface hover:theme-bg-elevated theme-text-primary transition cursor-pointer"
  >
    {darkMode ? (
      <Sun className="w-4 h-4 text-[var(--text-accent-yellow)]" aria-hidden="true" />
    ) : (
      <Moon className="w-4 h-4 text-slate-500" aria-hidden="true" />
    )}
  </button>
);

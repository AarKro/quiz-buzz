import { useEffect, useState } from 'react';

export function useTheme() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove('light-mode', 'light');
      html.classList.add('dark-mode', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark-mode', 'dark');
      html.classList.add('light-mode', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return { darkMode, toggleTheme: () => setDarkMode(prev => !prev) };
}

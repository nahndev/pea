'use client';

import { Button } from '@tomato/ui';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '../lib/theme.constants';

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const getSnapshot = () => document.documentElement.classList.contains('dark');
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // storage can be unavailable (private mode); the toggle still works for this session
    }
  };

  return (
    <Button variant="ghost" intent="neutral" size="icon" onClick={toggle} aria-label="Toggle dark mode">
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

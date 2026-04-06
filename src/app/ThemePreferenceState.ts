import { createContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemePreferenceContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (nextPreference: ThemePreference) => void;
}

export const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

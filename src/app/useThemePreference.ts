import { useContext } from 'react';
import { ThemePreferenceContext } from './ThemePreferenceState';

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider.');
  }

  return context;
}

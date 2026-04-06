import { useContext } from 'react';
import { FontPreferenceContext } from './FontPreferenceState';

export function useFontPreference() {
  const context = useContext(FontPreferenceContext);

  if (!context) {
    throw new Error('useFontPreference must be used within a FontPreferenceProvider.');
  }

  return context;
}

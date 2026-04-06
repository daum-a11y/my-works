import { useContext } from 'react';
import { FontPreferenceContext } from '../preferences/FontPreferenceState';

export function useFontPreference() {
  const context = useContext(FontPreferenceContext);

  if (!context) {
    throw new Error('useFontPreference must be used within a FontPreferenceProvider.');
  }

  return context;
}

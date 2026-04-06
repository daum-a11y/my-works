import { createContext } from 'react';

export type FontPreference = 'pretendard' | 'ongothic' | 'system';

export interface FontPreferenceContextValue {
  fontPreference: FontPreference;
  setFontPreference: (nextPreference: FontPreference) => void;
}

export const FontPreferenceContext = createContext<FontPreferenceContextValue | null>(null);

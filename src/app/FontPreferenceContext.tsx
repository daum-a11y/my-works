import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import {
  FontPreferenceContext,
  type FontPreference,
  type FontPreferenceContextValue,
} from './FontPreferenceState';

const STORAGE_KEY = 'my-works:font-preference';
const DEFAULT_FONT_PREFERENCE: FontPreference = 'pretendard';

function isFontPreference(value: string | null): value is FontPreference {
  return value === 'pretendard' || value === 'ongothic' || value === 'system';
}

function readStoredFontPreference(): FontPreference {
  if (typeof window === 'undefined') {
    return DEFAULT_FONT_PREFERENCE;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  return isFontPreference(storedValue) ? storedValue : DEFAULT_FONT_PREFERENCE;
}

export function FontPreferenceProvider({ children }: PropsWithChildren) {
  const [fontPreference, setFontPreference] = useState<FontPreference>(readStoredFontPreference);

  useEffect(() => {
    document.documentElement.dataset.fontPreference = fontPreference;
    window.localStorage.setItem(STORAGE_KEY, fontPreference);
  }, [fontPreference]);

  const value = useMemo<FontPreferenceContextValue>(
    () => ({
      fontPreference,
      setFontPreference,
    }),
    [fontPreference],
  );

  return <FontPreferenceContext.Provider value={value}>{children}</FontPreferenceContext.Provider>;
}

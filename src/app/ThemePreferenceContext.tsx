import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import {
  ThemePreferenceContext,
  type ResolvedTheme,
  type ThemePreference,
  type ThemePreferenceContextValue,
} from './ThemePreferenceState';

const STORAGE_KEY = 'my-works:theme-preference';
const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveThemePreference(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function readStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_PREFERENCE;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  return isThemePreference(storedValue) ? storedValue : DEFAULT_THEME_PREFERENCE;
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [themePreference, setThemePreference] =
    useState<ThemePreference>(readStoredThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveThemePreference(readStoredThemePreference()),
  );

  useEffect(() => {
    const nextResolvedTheme = resolveThemePreference(themePreference);

    document.documentElement.dataset.themePreference = themePreference;
    document.documentElement.dataset.themeResolved = nextResolvedTheme;
    window.localStorage.setItem(STORAGE_KEY, themePreference);
    setResolvedTheme(nextResolvedTheme);

    if (themePreference !== 'system' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      document.documentElement.dataset.themeResolved = systemTheme;
      setResolvedTheme(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference,
    }),
    [resolvedTheme, themePreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

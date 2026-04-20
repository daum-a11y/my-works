import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { FontPreferenceProvider } from '../preferences/FontPreferenceContext';
import { ThemePreferenceProvider } from '../preferences/ThemePreferenceContext';
import { UserSettingsPage } from '../pages/settings/UserSettingsPage';

describe('UserSettingsPage', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    delete document.documentElement.dataset.fontPreference;
    delete document.documentElement.dataset.themePreference;
    delete document.documentElement.dataset.themeResolved;
  });

  function renderSettingsPage() {
    return render(
      <ThemePreferenceProvider>
        <FontPreferenceProvider>
          <MemoryRouter initialEntries={['/settings']}>
            <Routes>
              <Route path="/settings" element={<UserSettingsPage />} />
            </Routes>
          </MemoryRouter>
        </FontPreferenceProvider>
      </ThemePreferenceProvider>,
    );
  }

  it('renders font and theme settings on the settings page', async () => {
    renderSettingsPage();

    expect(screen.getByRole('heading', { level: 1, name: '환경 설정' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '폰트 설정' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '테마 설정' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Pretendard/ })).toBeChecked();
      expect(screen.getByRole('radio', { name: /시스템설정/ })).toBeChecked();
    });
  });

  it('stores the selected font in localStorage and applies it app-wide', async () => {
    const user = userEvent.setup();

    renderSettingsPage();

    await waitFor(() => {
      expect(document.documentElement.dataset.fontPreference).toBe('pretendard');
    });

    await user.click(screen.getByRole('radio', { name: /KoddiUD OnGothic/ }));

    expect(document.documentElement.dataset.fontPreference).toBe('ongothic');
    expect(window.localStorage.getItem('my-works:font-preference')).toBe('ongothic');

    cleanup();

    renderSettingsPage();

    expect(screen.getByRole('radio', { name: /KoddiUD OnGothic/ })).toBeChecked();
    expect(document.documentElement.dataset.fontPreference).toBe('ongothic');
  });

  it('stores the selected theme in localStorage and applies the resolved theme', async () => {
    const user = userEvent.setup();

    renderSettingsPage();

    await waitFor(() => {
      expect(document.documentElement.dataset.themePreference).toBe('system');
    });

    await user.click(screen.getByRole('radio', { name: /다크모드/ }));

    expect(document.documentElement.dataset.themePreference).toBe('dark');
    expect(document.documentElement.dataset.themeResolved).toBe('dark');
    expect(window.localStorage.getItem('my-works:theme-preference')).toBe('dark');

    cleanup();

    renderSettingsPage();

    expect(screen.getByRole('radio', { name: /다크모드/ })).toBeChecked();
    expect(document.documentElement.dataset.themePreference).toBe('dark');
    expect(document.documentElement.dataset.themeResolved).toBe('dark');
  });
});

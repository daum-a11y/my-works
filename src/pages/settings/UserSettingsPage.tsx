import { useFontPreference } from '../../hooks/useFontPreference';
import { useThemePreference } from '../../hooks/useThemePreference';
import { PageHeader } from '../../components/shared';
import { UserProfileFontSection, UserProfileThemeSection } from '../profile/UserProfileSections';

export function UserSettingsPage() {
  const { fontPreference, setFontPreference } = useFontPreference();
  const { themePreference, setThemePreference } = useThemePreference();

  return (
    <section className="settings-page page-view" aria-labelledby="settings-title">
      <PageHeader title="환경 설정" id="settings-title" />

      <div className="content-area">
        <UserProfileFontSection
          fontPreference={fontPreference}
          onFontPreferenceChange={setFontPreference}
        />

        <UserProfileThemeSection
          themePreference={themePreference}
          onThemePreferenceChange={setThemePreference}
        />
      </div>
    </section>
  );
}

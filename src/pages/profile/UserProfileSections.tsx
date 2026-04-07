import type { FontPreference } from '../../preferences/FontPreferenceState';
import type { ThemePreference } from '../../preferences/ThemePreferenceState';
import { USER_PROFILE_FONT_OPTIONS, USER_PROFILE_THEME_OPTIONS } from './UserProfilePage.constants';

interface UserProfileAccountSectionProps {
  accountId?: string;
  name?: string;
  email?: string;
  roleLabel: string;
  editing: boolean;
  editButtonRef: React.RefObject<HTMLButtonElement | null>;
  onEdit: () => void;
}

export function UserProfileAccountSection({
  accountId,
  name,
  email,
  roleLabel,
  editing,
  editButtonRef,
  onEdit,
}: UserProfileAccountSectionProps) {
  return (
    <section aria-labelledby="profile-summary-title">
      <div className="password-settings-page__panel-header">
        <h2 id="profile-summary-title" className="password-settings-page__panel-title">
          계정
        </h2>
        {!editing ? (
          <button
            ref={editButtonRef}
            type="button"
            className="password-settings-page__button password-settings-page__button--primary"
            onClick={onEdit}
          >
            비밀번호 변경
          </button>
        ) : null}
      </div>

      <dl className="password-settings-page__profile-list">
        <div className="password-settings-page__profile-row">
          <dt>ID</dt>
          <dd>{accountId ?? '-'}</dd>
        </div>
        <div className="password-settings-page__profile-row">
          <dt>이름</dt>
          <dd>{name ?? '-'}</dd>
        </div>
        <div className="password-settings-page__profile-row">
          <dt>이메일</dt>
          <dd>{email ?? '-'}</dd>
        </div>
        <div className="password-settings-page__profile-row">
          <dt>권한</dt>
          <dd>{roleLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

interface UserProfileFontSectionProps {
  fontPreference: FontPreference;
  onFontPreferenceChange: (value: FontPreference) => void;
}

export function UserProfileFontSection({
  fontPreference,
  onFontPreferenceChange,
}: UserProfileFontSectionProps) {
  return (
    <section aria-labelledby="font-settings-title">
      <div className="password-settings-page__panel-header">
        <h2 id="font-settings-title" className="password-settings-page__panel-title">
          폰트 설정
        </h2>
      </div>

      <fieldset className="password-settings-page__font-fieldset">
        <legend className="sr-only">전역 폰트 선택</legend>
        <div className="password-settings-page__font-options">
          {USER_PROFILE_FONT_OPTIONS.map((option) => (
            <label key={option.value} className="password-settings-page__font-option">
              <input
                className="password-settings-page__font-radio"
                type="radio"
                name="fontPreference"
                value={option.value}
                checked={fontPreference === option.value}
                onChange={() => onFontPreferenceChange(option.value)}
              />
              <span className="password-settings-page__font-option-copy">
                <span className="password-settings-page__font-option-label">
                  {option.label}
                  {option.value === 'pretendard' ? ' (기본값)' : ''}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

interface UserProfileThemeSectionProps {
  themePreference: ThemePreference;
  onThemePreferenceChange: (value: ThemePreference) => void;
}

export function UserProfileThemeSection({
  themePreference,
  onThemePreferenceChange,
}: UserProfileThemeSectionProps) {
  return (
    <section aria-labelledby="theme-settings-title">
      <div className="password-settings-page__panel-header">
        <h2 id="theme-settings-title" className="password-settings-page__panel-title">
          테마 설정
        </h2>
      </div>

      <fieldset className="password-settings-page__setting-fieldset">
        <legend className="sr-only">전역 테마 선택</legend>
        <div className="password-settings-page__setting-options">
          {USER_PROFILE_THEME_OPTIONS.map((option) => (
            <label key={option.value} className="password-settings-page__setting-option">
              <input
                className="password-settings-page__setting-radio"
                type="radio"
                name="themePreference"
                value={option.value}
                checked={themePreference === option.value}
                onChange={() => onThemePreferenceChange(option.value)}
              />
              <span className="password-settings-page__setting-option-copy">
                <span className="password-settings-page__setting-option-label">
                  {option.label}
                  {option.value === 'system' ? ' (기본값)' : ''}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

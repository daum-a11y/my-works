import { Badge, Button, Radio, RadioGroup, StructuredList } from 'krds-react';
import { PageSection } from '../../components/shared';
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
    <PageSection
      title="계정"
      titleId="profile-summary-title"
      aria-labelledby="profile-summary-title"
      actions={
        !editing ? (
          <Button
            size="medium"
            ref={editButtonRef}
            type="button"
            onClick={onEdit}
            variant="primary"
          >
            비밀번호 변경
          </Button>
        ) : null
      }
    >
      <StructuredList className="sm">
        {[
          { label: 'ID', value: accountId ?? '-' },
          { label: '이름', value: name ?? '-' },
          { label: '이메일', value: email ?? '-' },
          {
            label: '권한',
            value: (
              <Badge
                variant="light"
                color={roleLabel === '관리자' ? 'information' : 'gray'}
                size="small"
              >
                {roleLabel}
              </Badge>
            ),
          },
        ].map((item, index) => (
          <li key={`${item.label}-${index}`} className="structured-item">
            <div className="in">
              <div className="card-body">
                <div className="c-text">
                  <strong className="c-tit">{item.label}</strong>
                  <span className="c-txt">{item.value}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </StructuredList>
    </PageSection>
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
    <PageSection
      title="폰트 설정"
      titleId="font-settings-title"
      aria-labelledby="font-settings-title"
    >
      <fieldset className="krds-page-settings__font-fieldset">
        <legend className="sr-only">전역 폰트 선택</legend>
        <RadioGroup
          name="fontPreference"
          value={fontPreference}
          onChange={(value) => onFontPreferenceChange(value as FontPreference)}
        >
          {USER_PROFILE_FONT_OPTIONS.map((option) => (
            <Radio key={option.value} id={`font-preference-${option.value}`} value={option.value}>
              {option.label}
              {option.value === 'pretendard' ? ' (기본값)' : ''}
            </Radio>
          ))}
        </RadioGroup>
      </fieldset>
    </PageSection>
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
    <PageSection
      title="테마 설정"
      titleId="theme-settings-title"
      aria-labelledby="theme-settings-title"
    >
      <fieldset className="krds-page-settings__setting-fieldset">
        <legend className="sr-only">전역 테마 선택</legend>
        <RadioGroup
          name="themePreference"
          value={themePreference}
          onChange={(value) => onThemePreferenceChange(value as ThemePreference)}
        >
          {USER_PROFILE_THEME_OPTIONS.map((option) => (
            <Radio key={option.value} id={`theme-preference-${option.value}`} value={option.value}>
              {option.label}
              {option.value === 'system' ? ' (기본값)' : ''}
            </Radio>
          ))}
        </RadioGroup>
      </fieldset>
    </PageSection>
  );
}

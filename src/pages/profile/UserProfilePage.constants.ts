import type { FontPreference } from '../../preferences/FontPreferenceState';
import type { ThemePreference } from '../../preferences/ThemePreferenceState';

export const USER_PROFILE_FONT_OPTIONS: Array<{ value: FontPreference; label: string }> = [
  {
    value: 'pretendard',
    label: 'Pretendard',
  },
  {
    value: 'ongothic',
    label: 'KoddiUD OnGothic',
  },
  {
    value: 'system',
    label: '시스템폰트',
  },
];

export const USER_PROFILE_THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  {
    value: 'system',
    label: '시스템설정',
  },
  {
    value: 'light',
    label: '라이트모드',
  },
  {
    value: 'dark',
    label: '다크모드',
  },
];

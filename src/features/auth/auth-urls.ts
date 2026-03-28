import { env } from '../../lib/env';

export const PASSWORD_RECOVERY_PATH = '/auth/recovery';

function getBaseUrl() {
  if (env.appUrl) {
    return env.appUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return '';
}

export function getPasswordRecoveryRedirectUrl() {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${PASSWORD_RECOVERY_PATH}`;
}

export function isPasswordRecoveryUrl() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);

  return (
    window.location.pathname === PASSWORD_RECOVERY_PATH ||
    hashParams.get('type') === 'recovery' ||
    queryParams.get('type') === 'recovery'
  );
}

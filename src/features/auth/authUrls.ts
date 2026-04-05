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

export function isPasswordRecoveryPath() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.pathname === PASSWORD_RECOVERY_PATH;
}

export function isPasswordRecoveryUrl() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  const hasRecoveryToken =
    Boolean(hashParams.get('access_token')) ||
    Boolean(hashParams.get('token_hash')) ||
    Boolean(queryParams.get('access_token')) ||
    Boolean(queryParams.get('token_hash'));

  return (
    (isPasswordRecoveryPath() ||
      hashParams.get('type') === 'recovery' ||
      queryParams.get('type') === 'recovery') &&
    (hashParams.get('type') === 'recovery' ||
      queryParams.get('type') === 'recovery' ||
      hasRecoveryToken)
  );
}

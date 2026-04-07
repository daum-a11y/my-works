import { GLOBAL_LOADING_SPINNER_DEFAULTS } from './GlobalLoadingSpinner.constants';
import type { GlobalLoadingSpinnerProps } from './GlobalLoadingSpinner.types';

export function GlobalLoadingSpinner({
  overlay = GLOBAL_LOADING_SPINNER_DEFAULTS.overlay,
}: GlobalLoadingSpinnerProps) {
  return (
    <div
      className={
        overlay
          ? 'global-loading-spinner global-loading-spinner--overlay'
          : 'global-loading-spinner'
      }
      aria-label="로딩 중"
      role="status"
    >
      <div className="global-loading-spinner__indicator" />
    </div>
  );
}

import { Spinner } from 'krds-react';

export interface GlobalLoadingSpinnerProps {
  overlay?: boolean;
}

const GLOBAL_LOADING_SPINNER_DEFAULTS = {
  overlay: false,
} as const;

export function GlobalLoadingSpinner({
  overlay = GLOBAL_LOADING_SPINNER_DEFAULTS.overlay,
}: GlobalLoadingSpinnerProps) {
  return (
    <div
      style={
        overlay
          ? {
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.72)',
              zIndex: 10,
            }
          : {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '96px',
            }
      }
      className={
        overlay
          ? 'global-loading-spinner global-loading-spinner--overlay'
          : 'global-loading-spinner'
      }
      aria-label="로딩 중"
      role="status"
    >
      <Spinner />
    </div>
  );
}

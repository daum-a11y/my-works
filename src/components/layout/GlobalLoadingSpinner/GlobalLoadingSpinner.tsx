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

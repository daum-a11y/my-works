export function GlobalLoadingSpinner({ overlay = false }: { overlay?: boolean }) {
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

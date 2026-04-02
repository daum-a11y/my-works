export function GlobalLoadingSpinner({ overlay = false }: { overlay?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: overlay ? '100%' : '100vh',
        background: overlay ? 'rgba(255, 255, 255, 0.72)' : '#ffffff',
      }}
      aria-label="로딩 중"
      role="status"
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-strong)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

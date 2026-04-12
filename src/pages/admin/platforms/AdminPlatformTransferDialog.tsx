import { useEffect } from 'react';
import type { AdminPlatformItem } from '../admin.types';

interface AdminPlatformTransferDialogProps {
  isOpen: boolean;
  isPending: boolean;
  sourcePlatform: AdminPlatformItem;
  targetPlatforms: readonly AdminPlatformItem[];
  targetPlatformId: string;
  dropExisting: boolean;
  errorMessage?: string;
  onTargetPlatformChange: (platformId: string) => void;
  onDropExistingChange: (dropExisting: boolean) => void;
  onClose: () => void;
  onSave: () => Promise<void> | void;
}

export function AdminPlatformTransferDialog({
  isOpen,
  isPending,
  sourcePlatform,
  targetPlatforms,
  targetPlatformId,
  dropExisting,
  errorMessage = '',
  onTargetPlatformChange,
  onDropExistingChange,
  onClose,
  onSave,
}: AdminPlatformTransferDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="admin-crud-page">
      <div
        className="admin-crud-page__dialog-scrim"
        onClick={() => {
          if (!isPending) {
            onClose();
          }
        }}
      >
        <section
          className="admin-crud-page__dialog"
          role="dialog"
          aria-modal="true"
          aria-label="플랫폼 전환"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="admin-crud-page__dialog-header">
            <div className="admin-crud-page__dialog-heading">
              <h2 className="admin-crud-page__dialog-title">플랫폼 전환</h2>
            </div>
          </header>

          {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

          <div className="admin-crud-page__dialog-form">
            <div className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">현재 항목</span>
              <p className="admin-crud-page__readonly-value">{sourcePlatform.name}</p>
            </div>
            <label className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">변경할 항목</span>
              <select
                className="admin-crud-page__field-select"
                value={targetPlatformId}
                onChange={(event) => onTargetPlatformChange(event.target.value)}
                disabled={isPending}
              >
                {targetPlatforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-crud-page__checkbox-field">
              <input
                type="checkbox"
                checked={dropExisting}
                onChange={(event) => onDropExistingChange(event.target.checked)}
                disabled={isPending}
              />
              <span>기존 항목 삭제</span>
            </label>
          </div>

          <footer className="admin-crud-page__dialog-footer">
            <div className="admin-crud-page__actions">
              <button
                type="button"
                className="admin-crud-page__button admin-crud-page__button--secondary"
                onClick={onClose}
                disabled={isPending}
              >
                취소
              </button>
              <button
                type="button"
                className="admin-crud-page__button admin-crud-page__button--primary"
                onClick={() => void onSave()}
                disabled={isPending || !targetPlatformId}
              >
                저장
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import type { AdminTaskTypeItem } from '../admin.types';

interface AdminTaskTypeTransferDialogProps {
  isOpen: boolean;
  isPending: boolean;
  sourceTaskType: AdminTaskTypeItem;
  targetTaskTypes: readonly AdminTaskTypeItem[];
  targetTaskTypeId: string;
  errorMessage?: string;
  onTargetTaskTypeChange: (taskTypeId: string) => void;
  onClose: () => void;
  onSave: () => void;
}

function formatTaskType(item: AdminTaskTypeItem) {
  return `${item.type1} / ${item.type2}`;
}

export function AdminTaskTypeTransferDialog({
  isOpen,
  isPending,
  sourceTaskType,
  targetTaskTypes,
  targetTaskTypeId,
  errorMessage = '',
  onTargetTaskTypeChange,
  onClose,
  onSave,
}: AdminTaskTypeTransferDialogProps) {
  const type1Options = useMemo(
    () => Array.from(new Set(targetTaskTypes.map((taskType) => taskType.type1))),
    [targetTaskTypes],
  );
  const selectedTargetTaskType = useMemo(
    () => targetTaskTypes.find((taskType) => taskType.id === targetTaskTypeId) ?? null,
    [targetTaskTypeId, targetTaskTypes],
  );
  const selectedType1 = selectedTargetTaskType?.type1 ?? type1Options[0] ?? '';
  const type2Options = useMemo(
    () => targetTaskTypes.filter((taskType) => taskType.type1 === selectedType1),
    [selectedType1, targetTaskTypes],
  );

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

  useEffect(() => {
    if (!isOpen || !type2Options.length) {
      return;
    }

    if (!type2Options.some((taskType) => taskType.id === targetTaskTypeId)) {
      onTargetTaskTypeChange(type2Options[0].id);
    }
  }, [isOpen, onTargetTaskTypeChange, targetTaskTypeId, type2Options]);

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
          aria-label="업무 타입 전환"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="admin-crud-page__dialog-header">
            <div className="admin-crud-page__dialog-heading">
              <h2 className="admin-crud-page__dialog-title">업무 타입 전환</h2>
            </div>
          </header>

          {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

          <div className="admin-crud-page__dialog-form">
            <div className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">현재 항목</span>
              <p className="admin-crud-page__readonly-value">{formatTaskType(sourceTaskType)}</p>
            </div>
            <label className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">변경할 타입1</span>
              <select
                className="admin-crud-page__field-select"
                value={selectedType1}
                onChange={(event) => {
                  const nextTaskType = targetTaskTypes.find(
                    (taskType) => taskType.type1 === event.target.value,
                  );
                  onTargetTaskTypeChange(nextTaskType?.id ?? '');
                }}
                disabled={isPending}
              >
                {type1Options.map((type1) => (
                  <option key={type1} value={type1}>
                    {type1}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">변경할 타입2</span>
              <select
                className="admin-crud-page__field-select"
                value={targetTaskTypeId}
                onChange={(event) => onTargetTaskTypeChange(event.target.value)}
                disabled={isPending || !selectedType1}
              >
                {type2Options.map((taskType) => (
                  <option key={taskType.id} value={taskType.id}>
                    {taskType.type2}
                  </option>
                ))}
              </select>
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
                onClick={onSave}
                disabled={isPending || !targetTaskTypeId}
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

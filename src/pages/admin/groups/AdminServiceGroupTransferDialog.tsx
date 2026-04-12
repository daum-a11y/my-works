import { useEffect, useMemo } from 'react';
import type { AdminCostGroupItem, AdminServiceGroupItem } from '../admin.types';

interface AdminServiceGroupTransferDialogProps {
  isOpen: boolean;
  isPending: boolean;
  sourceServiceGroup: AdminServiceGroupItem;
  costGroups: readonly AdminCostGroupItem[];
  targetServiceGroups: readonly AdminServiceGroupItem[];
  targetServiceGroupId: string;
  dropExisting: boolean;
  errorMessage?: string;
  onTargetServiceGroupChange: (serviceGroupId: string) => void;
  onDropExistingChange: (dropExisting: boolean) => void;
  onClose: () => void;
  onSave: () => void;
}

function formatServiceGroup(item: AdminServiceGroupItem) {
  const costGroupName = item.costGroupName ? `${item.costGroupName} / ` : '';

  if (!item.serviceGroupName && !item.serviceName) {
    return `${costGroupName}${item.name}`;
  }
  if (!item.serviceGroupName) {
    return `${costGroupName}${item.serviceName}`;
  }
  if (!item.serviceName) {
    return `${costGroupName}${item.serviceGroupName}`;
  }
  return `${costGroupName}${item.serviceGroupName} / ${item.serviceName}`;
}

export function AdminServiceGroupTransferDialog({
  isOpen,
  isPending,
  sourceServiceGroup,
  costGroups,
  targetServiceGroups,
  targetServiceGroupId,
  dropExisting,
  errorMessage = '',
  onTargetServiceGroupChange,
  onDropExistingChange,
  onClose,
  onSave,
}: AdminServiceGroupTransferDialogProps) {
  const costGroupOptions = useMemo(
    () =>
      Array.from(new Set(targetServiceGroups.map((item) => item.costGroupId ?? ''))).map(
        (costGroupId) => ({
          id: costGroupId,
          name:
            costGroups.find((costGroup) => costGroup.id === costGroupId)?.name ??
            targetServiceGroups.find((item) => (item.costGroupId ?? '') === costGroupId)
              ?.costGroupName ??
            '',
        }),
      ),
    [costGroups, targetServiceGroups],
  );
  const selectedTargetServiceGroup = useMemo(
    () => targetServiceGroups.find((item) => item.id === targetServiceGroupId) ?? null,
    [targetServiceGroupId, targetServiceGroups],
  );
  const selectedCostGroupId =
    selectedTargetServiceGroup?.costGroupId ?? costGroupOptions[0]?.id ?? '';
  const costGroupServiceGroups = useMemo(
    () => targetServiceGroups.filter((item) => (item.costGroupId ?? '') === selectedCostGroupId),
    [selectedCostGroupId, targetServiceGroups],
  );
  const groupOptions = useMemo(
    () => Array.from(new Set(costGroupServiceGroups.map((item) => item.serviceGroupName))),
    [costGroupServiceGroups],
  );
  const selectedGroupName = selectedTargetServiceGroup?.serviceGroupName ?? groupOptions[0] ?? '';
  const serviceNameOptions = useMemo(
    () => costGroupServiceGroups.filter((item) => item.serviceGroupName === selectedGroupName),
    [costGroupServiceGroups, selectedGroupName],
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
    if (!isOpen || !serviceNameOptions.length) {
      return;
    }

    if (!serviceNameOptions.some((item) => item.id === targetServiceGroupId)) {
      onTargetServiceGroupChange(serviceNameOptions[0].id);
    }
  }, [isOpen, onTargetServiceGroupChange, serviceNameOptions, targetServiceGroupId]);

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
          aria-label="서비스 그룹 전환"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="admin-crud-page__dialog-header">
            <div className="admin-crud-page__dialog-heading">
              <h2 className="admin-crud-page__dialog-title">서비스 그룹 전환</h2>
            </div>
          </header>

          {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

          <div className="admin-crud-page__dialog-form">
            <div className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">현재 항목</span>
              <p className="admin-crud-page__readonly-value">
                {formatServiceGroup(sourceServiceGroup)}
              </p>
            </div>
            <label className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">변경할 청구그룹</span>
              <select
                className="admin-crud-page__field-select"
                value={selectedCostGroupId}
                onChange={(event) => {
                  const nextServiceGroup = targetServiceGroups.find(
                    (item) => (item.costGroupId ?? '') === event.target.value,
                  );
                  onTargetServiceGroupChange(nextServiceGroup?.id ?? '');
                }}
                disabled={isPending}
              >
                {costGroupOptions.map((costGroup) => (
                  <option key={costGroup.id} value={costGroup.id}>
                    {costGroup.name || '-'}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">변경할 서비스 그룹</span>
              <select
                className="admin-crud-page__field-select"
                value={selectedGroupName}
                onChange={(event) => {
                  const nextServiceGroup = costGroupServiceGroups.find(
                    (item) => item.serviceGroupName === event.target.value,
                  );
                  onTargetServiceGroupChange(nextServiceGroup?.id ?? '');
                }}
                disabled={isPending}
              >
                {groupOptions.map((groupName) => (
                  <option key={groupName} value={groupName}>
                    {groupName || '-'}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-crud-page__stack-field">
              <span className="admin-crud-page__field-label">변경할 서비스명</span>
              <select
                className="admin-crud-page__field-select"
                value={targetServiceGroupId}
                onChange={(event) => onTargetServiceGroupChange(event.target.value)}
                disabled={isPending || !serviceNameOptions.length}
              >
                {serviceNameOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.serviceName || '-'}
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
                onClick={onSave}
                disabled={isPending || !targetServiceGroupId}
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

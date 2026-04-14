import { useEffect, useMemo } from 'react';
import { Button, Checkbox, CriticalAlert, Modal, Select } from 'krds-react';
import { KrdsStructuredInfoList } from '../../../components/shared';
import type { AdminTaskTypeItem } from '../admin.types';

interface AdminTaskTypeTransferDialogProps {
  isOpen: boolean;
  isPending: boolean;
  sourceTaskType: AdminTaskTypeItem;
  targetTaskTypes: readonly AdminTaskTypeItem[];
  targetTaskTypeId: string;
  dropExisting: boolean;
  errorMessage?: string;
  onTargetTaskTypeChange: (taskTypeId: string) => void;
  onDropExistingChange: (dropExisting: boolean) => void;
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
  dropExisting,
  errorMessage = '',
  onTargetTaskTypeChange,
  onDropExistingChange,
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
    <div className="krds-page-admin">
      <Modal.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            onClose();
          }
        }}
        closeOnEsc={!isPending}
        closeOnOverlayClick={!isPending}
        size="md"
      >
        <Modal.Content aria-label="업무 타입 전환">
          <Modal.Header title="업무 타입 전환" />

          {errorMessage ? (
            <CriticalAlert alerts={[{ variant: 'danger', message: errorMessage }]} />
          ) : null}

          <Modal.Body>
            <KrdsStructuredInfoList
              items={[{ label: '현재 항목', value: formatTaskType(sourceTaskType) }]}
            />
            <Select
              id="task-type-transfer-target-type1"
              label="변경할 타입1"
              value={selectedType1}
              onChange={(value) => {
                const nextTaskType = targetTaskTypes.find((taskType) => taskType.type1 === value);
                onTargetTaskTypeChange(nextTaskType?.id ?? '');
              }}
              disabled={isPending}
              options={type1Options.map((type1) => ({ value: type1, label: type1 }))}
            />
            <Select
              id="task-type-transfer-target-type2"
              label="변경할 타입2"
              value={targetTaskTypeId}
              onChange={onTargetTaskTypeChange}
              disabled={isPending || !selectedType1}
              options={type2Options.map((taskType) => ({
                value: taskType.id,
                label: taskType.type2,
              }))}
            />
            <Checkbox
              id="task-type-transfer-drop-existing"
              label="기존 항목 삭제"
              checked={dropExisting}
              onChange={(event) => onDropExistingChange(event.target.checked)}
              disabled={isPending}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
              취소
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onSave}
              disabled={isPending || !targetTaskTypeId}
            >
              저장
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </div>
  );
}

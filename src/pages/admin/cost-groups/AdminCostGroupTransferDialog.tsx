import { useEffect } from 'react';
import { Button, Checkbox, CriticalAlert, Modal, Select } from 'krds-react';
import { KrdsStructuredInfoList } from '../../../components/shared';
import type { AdminCostGroupItem } from '../admin.types';

interface AdminCostGroupTransferDialogProps {
  isOpen: boolean;
  isPending: boolean;
  sourceCostGroup: AdminCostGroupItem;
  targetCostGroups: readonly AdminCostGroupItem[];
  targetCostGroupId: string;
  dropExisting: boolean;
  errorMessage?: string;
  onTargetCostGroupChange: (costGroupId: string) => void;
  onDropExistingChange: (dropExisting: boolean) => void;
  onClose: () => void;
  onSave: () => void;
}

export function AdminCostGroupTransferDialog({
  isOpen,
  isPending,
  sourceCostGroup,
  targetCostGroups,
  targetCostGroupId,
  dropExisting,
  errorMessage = '',
  onTargetCostGroupChange,
  onDropExistingChange,
  onClose,
  onSave,
}: AdminCostGroupTransferDialogProps) {
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
        <Modal.Content aria-label="청구그룹 전환">
          <Modal.Header title="청구그룹 전환" />

          {errorMessage ? (
            <CriticalAlert alerts={[{ variant: 'danger', message: errorMessage }]} />
          ) : null}

          <Modal.Body>
            <KrdsStructuredInfoList
              items={[{ label: '현재 항목', value: sourceCostGroup.name }]}
            />
            <Select
              id="cost-group-transfer-target"
              label="변경할 항목"
              value={targetCostGroupId}
              onChange={onTargetCostGroupChange}
              disabled={isPending}
              options={targetCostGroups.map((costGroup) => ({
                value: costGroup.id,
                label: costGroup.name,
              }))}
            />
            <Checkbox
              id="cost-group-transfer-drop-existing"
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
              disabled={isPending || !targetCostGroupId}
            >
              저장
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </div>
  );
}

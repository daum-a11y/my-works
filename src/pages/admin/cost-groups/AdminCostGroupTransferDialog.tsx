import { useCallback, useEffect } from 'react';
import { Button, Checkbox, CriticalAlert, Modal, Select, StructuredList } from 'krds-react';
import { cleanupKrdsModalState, useKrdsModalCleanup } from '../../../components/shared';
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
  useKrdsModalCleanup(isOpen);

  const handleClose = useCallback(() => {
    cleanupKrdsModalState();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, handleClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="admin-page">
      <Modal.Root
        usePortal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            handleClose();
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
            <StructuredList className="sm">
              <li className="structured-item">
                <div className="in">
                  <div className="card-body">
                    <div className="c-text">
                      <strong className="c-tit">현재 항목</strong>
                      <span className="c-txt">{sourceCostGroup.name}</span>
                    </div>
                  </div>
                </div>
              </li>
            </StructuredList>
            <Select
              size="medium"
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
            <Button
              size="medium"
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              size="medium"
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

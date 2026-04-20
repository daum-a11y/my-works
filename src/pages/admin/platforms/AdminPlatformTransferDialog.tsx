import { useCallback, useEffect } from 'react';
import { Button, Checkbox, CriticalAlert, Modal, Select, StructuredList } from 'krds-react';
import { cleanupKrdsModalState, useKrdsModalCleanup } from '../../../components/shared';
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
        <Modal.Content aria-label="플랫폼 전환">
          <Modal.Header title="플랫폼 전환" />

          {errorMessage ? (
            <CriticalAlert alerts={[{ variant: 'danger', message: errorMessage }]} />
          ) : null}

          <Modal.Body>
            <StructuredList className="sm">
              <li className="structured-item">
                <div className="in">
                  <div className="krds-structured-list-body card-body">
                    <div className="c-text">
                      <strong className="c-tit">현재 항목</strong>
                      <span className="c-txt">{sourcePlatform.name}</span>
                    </div>
                  </div>
                </div>
              </li>
            </StructuredList>
            <Select
              size="medium"
              id="platform-transfer-target"
              label="변경할 항목"
              value={targetPlatformId}
              onChange={onTargetPlatformChange}
              disabled={isPending}
              options={targetPlatforms.map((platform) => ({
                value: platform.id,
                label: platform.name,
              }))}
            />
            <Checkbox
              id="platform-transfer-drop-existing"
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
              onClick={() => void onSave()}
              disabled={isPending || !targetPlatformId}
            >
              저장
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </div>
  );
}

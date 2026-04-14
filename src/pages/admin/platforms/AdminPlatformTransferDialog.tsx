import { useCallback, useEffect } from 'react';
import { Button, Checkbox, CriticalAlert, Modal, Select } from 'krds-react';
import {
  cleanupKrdsModalState,
  KrdsStructuredInfoList,
  useKrdsModalCleanup,
} from '../../../components/shared';
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
    <div className="krds-page-admin">
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
            <KrdsStructuredInfoList items={[{ label: '현재 항목', value: sourcePlatform.name }]} />
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

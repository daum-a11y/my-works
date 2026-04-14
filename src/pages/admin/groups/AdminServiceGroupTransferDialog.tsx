import { useCallback, useEffect, useMemo } from 'react';
import { Button, Checkbox, CriticalAlert, Modal, Select } from 'krds-react';
import {
  cleanupKrdsModalState,
  KrdsStructuredInfoList,
  useKrdsModalCleanup,
} from '../../../components/shared';
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
  useKrdsModalCleanup(isOpen);

  const handleClose = useCallback(() => {
    cleanupKrdsModalState();
    onClose();
  }, [onClose]);

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
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, handleClose]);

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
        <Modal.Content aria-label="서비스 그룹 전환">
          <Modal.Header title="서비스 그룹 전환" />

          {errorMessage ? (
            <CriticalAlert alerts={[{ variant: 'danger', message: errorMessage }]} />
          ) : null}

          <Modal.Body>
            <KrdsStructuredInfoList
              items={[{ label: '현재 항목', value: formatServiceGroup(sourceServiceGroup) }]}
            />
            <Select
              size="medium"
              id="service-group-transfer-target-cost-group"
              label="변경할 청구그룹"
              value={selectedCostGroupId}
              onChange={(value) => {
                const nextServiceGroup = targetServiceGroups.find(
                  (item) => (item.costGroupId ?? '') === value,
                );
                onTargetServiceGroupChange(nextServiceGroup?.id ?? '');
              }}
              disabled={isPending}
              options={costGroupOptions.map((costGroup) => ({
                value: costGroup.id,
                label: costGroup.name || '-',
              }))}
            />
            <Select
              size="medium"
              id="service-group-transfer-target-group"
              label="변경할 서비스 그룹"
              value={selectedGroupName}
              onChange={(value) => {
                const nextServiceGroup = costGroupServiceGroups.find(
                  (item) => item.serviceGroupName === value,
                );
                onTargetServiceGroupChange(nextServiceGroup?.id ?? '');
              }}
              disabled={isPending}
              options={groupOptions.map((groupName) => ({
                value: groupName,
                label: groupName || '-',
              }))}
            />
            <Select
              size="medium"
              id="service-group-transfer-target-service"
              label="변경할 서비스명"
              value={targetServiceGroupId}
              onChange={onTargetServiceGroupChange}
              disabled={isPending || !serviceNameOptions.length}
              options={serviceNameOptions.map((item) => ({
                value: item.id,
                label: item.serviceName || '-',
              }))}
            />
            <Checkbox
              id="service-group-transfer-drop-existing"
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
              disabled={isPending || !targetServiceGroupId}
            >
              저장
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </div>
  );
}

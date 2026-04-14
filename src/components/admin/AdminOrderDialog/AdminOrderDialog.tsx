import { useEffect, useMemo, useState } from 'react';
import { GripHorizontal } from 'lucide-react';
import { Badge, Button, CriticalAlert, Modal, type BadgeProps } from 'krds-react';

export interface AdminOrderDialogItem {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: BadgeProps['color'];
  inactive?: boolean;
}

export interface AdminOrderDialogProps {
  title: string;
  description?: string;
  items: AdminOrderDialogItem[];
  isOpen: boolean;
  isPending: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSave: (ids: string[]) => Promise<void> | void;
}

const ADMIN_ORDER_DIALOG_DEFAULTS = {
  ERROR_MESSAGE: '',
} as const;

function moveItem<T>(items: readonly T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return [...items];
  }

  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  return nextItems;
}

export function AdminOrderDialog({
  title,
  description,
  items,
  isOpen,
  isPending,
  errorMessage = ADMIN_ORDER_DIALOG_DEFAULTS.ERROR_MESSAGE,
  onClose,
  onSave,
}: AdminOrderDialogProps) {
  const [draftItems, setDraftItems] = useState<AdminOrderDialogItem[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftItems(items);
      setDraggingId(null);
      setDropTargetId(null);
    }
  }, [isOpen, items]);

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

  const hasChanges = useMemo(
    () => draftItems.some((item, index) => item.id !== items[index]?.id),
    [draftItems, items],
  );

  if (!isOpen) {
    return null;
  }

  const moveBy = (itemId: string, direction: -1 | 1) => {
    setDraftItems((current) => {
      const currentIndex = current.findIndex((item) => item.id === itemId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      return moveItem(current, currentIndex, nextIndex);
    });
  };

  const handleDrop = (targetItemId: string) => {
    if (!draggingId || draggingId === targetItemId) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    setDraftItems((current) => {
      const fromIndex = current.findIndex((entry) => entry.id === draggingId);
      const toIndex = current.findIndex((entry) => entry.id === targetItemId);
      return moveItem(current, fromIndex, toIndex);
    });
    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleSave = async () => {
    await onSave(draftItems.map((item) => item.id));
  };

  return (
    <Modal.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onClose();
        }
      }}
      closeOnEsc={!isPending}
      closeOnOverlayClick={!isPending}
      size="lg"
    >
      <Modal.Content aria-label={title}>
        <Modal.Header title={title} />

        {errorMessage ? (
          <CriticalAlert alerts={[{ variant: 'danger', message: errorMessage }]} />
        ) : null}

        <Modal.Body>
          {description ? (
            <div id="admin-order-dialog-note">
              <CriticalAlert alerts={[{ variant: 'info', message: description }]} />
            </div>
          ) : null}

          <ol className="krds-page-admin__sortable-list">
            {draftItems.map((item, index) => {
              const isDragging = draggingId === item.id;
              const isDropTarget = dropTargetId === item.id && draggingId !== item.id;

              return (
                <li
                  key={item.id}
                  className={[
                    'krds-page-admin__sortable-item',
                    item.inactive ? 'krds-page-admin__sortable-item--inactive' : '',
                    isDragging ? 'krds-page-admin__sortable-item--dragging' : '',
                    isDropTarget ? 'krds-page-admin__sortable-item--drop-target' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnter={() => {
                    if (!draggingId || draggingId === item.id) {
                      setDropTargetId(null);
                      return;
                    }
                    setDropTargetId(item.id);
                  }}
                  onDragLeave={() => {
                    if (dropTargetId === item.id) {
                      setDropTargetId(null);
                    }
                  }}
                  onDrop={() => handleDrop(item.id)}
                >
                  <div className="krds-page-admin__sortable-body">
                    <div className="krds-page-admin__sortable-topline">
                      <span className="krds-page-admin__sortable-order">{index + 1}</span>
                      <strong className="krds-page-admin__sortable-title">{item.title}</strong>
                      {item.description ? (
                        <span className="krds-page-admin__sortable-description">
                          {item.description}
                        </span>
                      ) : null}
                      {item.badge ? (
                        <Badge
                          variant="light"
                          color={item.badgeColor ?? (item.inactive ? 'gray' : 'secondary')}
                          size="small"
                        >
                          {item.badge}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="icon"
                    size="medium"
                    className="krds-page-admin__sortable-handle"
                    aria-label={`${item.title} 순서 이동 핸들`}
                    aria-describedby={description ? 'admin-order-dialog-note' : undefined}
                    draggable={!isPending}
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropTargetId(null);
                    }}
                    onKeyDown={(event) => {
                      if (isPending) {
                        return;
                      }

                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        moveBy(item.id, -1);
                        return;
                      }

                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        moveBy(item.id, 1);
                      }
                    }}
                    disabled={isPending}
                  >
                    <GripHorizontal />
                  </Button>
                </li>
              );
            })}
          </ol>
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSave()}
            disabled={isPending || !hasChanges}
          >
            저장
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

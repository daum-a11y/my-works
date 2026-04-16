import { useCallback, useEffect, useMemo, useState } from 'react';
import { GripHorizontal } from 'lucide-react';
import { Badge, Button, CriticalAlert, Modal, type BadgeProps } from 'krds-react';
import { cleanupKrdsModalState, useKrdsModalCleanup } from '../../shared';

export interface AdminSortOrderDialogItem {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: BadgeProps['color'];
  inactive?: boolean;
}

export interface AdminSortOrderDialogProps {
  title: string;
  description?: string;
  items: AdminSortOrderDialogItem[];
  isOpen: boolean;
  isPending: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSave: (ids: string[]) => Promise<void> | void;
}

const ADMIN_SORT_ORDER_DIALOG_DEFAULTS = {
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

export function AdminSortOrderDialog({
  title,
  description,
  items,
  isOpen,
  isPending,
  errorMessage = ADMIN_SORT_ORDER_DIALOG_DEFAULTS.ERROR_MESSAGE,
  onClose,
  onSave,
}: AdminSortOrderDialogProps) {
  const [draftItems, setDraftItems] = useState<AdminSortOrderDialogItem[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  useKrdsModalCleanup(isOpen);

  const handleClose = useCallback(() => {
    cleanupKrdsModalState();
    onClose();
  }, [onClose]);

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
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, handleClose]);

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
      usePortal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          handleClose();
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
            <div id="admin-sort-order-dialog-note">
              <CriticalAlert alerts={[{ variant: 'info', message: description }]} />
            </div>
          ) : null}

          <ol className="sortable-list">
            {draftItems.map((item, index) => {
              const isDragging = draggingId === item.id;
              const isDropTarget = dropTargetId === item.id && draggingId !== item.id;

              return (
                <li
                  key={item.id}
                  className={[
                    'sortable-item',
                    item.inactive ? 'is-muted' : '',
                    isDragging ? 'is-dragging' : '',
                    isDropTarget ? 'is-drop-target' : '',
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
                  <div className="sortable-body">
                    <div className="sortable-topline">
                      <span className="sortable-order">{index + 1}</span>
                      <strong className="sortable-title">{item.title}</strong>
                      {item.description ? (
                        <span className="sortable-description">{item.description}</span>
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
                    className="sortable-handle"
                    aria-label={`${item.title} 순서 이동 핸들`}
                    aria-describedby={description ? 'admin-sort-order-dialog-note' : undefined}
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

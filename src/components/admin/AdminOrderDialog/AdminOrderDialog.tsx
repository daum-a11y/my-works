import { useEffect, useMemo, useState } from 'react';
import { GripHorizontal } from 'lucide-react';

export interface AdminOrderDialogItem {
  id: string;
  title: string;
  description?: string;
  badge?: string;
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
    <div
      className="admin-crud-page__dialog-scrim"
      onClick={() => {
        if (!isPending) {
          onClose();
        }
      }}
    >
      <section
        className="admin-crud-page__dialog admin-crud-page__dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-crud-page__dialog-header">
          <div className="admin-crud-page__dialog-heading">
            <h2 className="admin-crud-page__dialog-title">{title}</h2>
          </div>
        </header>

        {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

        <ol className="admin-crud-page__sortable-list">
          {draftItems.map((item, index) => {
            const isDragging = draggingId === item.id;
            const isDropTarget = dropTargetId === item.id && draggingId !== item.id;

            return (
              <li
                key={item.id}
                className={[
                  'admin-crud-page__sortable-item',
                  item.inactive ? 'admin-crud-page__sortable-item--inactive' : '',
                  isDragging ? 'admin-crud-page__sortable-item--dragging' : '',
                  isDropTarget ? 'admin-crud-page__sortable-item--drop-target' : '',
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
                <div className="admin-crud-page__sortable-body">
                  <div className="admin-crud-page__sortable-topline">
                    <span className="admin-crud-page__sortable-order">{index + 1}</span>
                    <strong className="admin-crud-page__sortable-title">{item.title}</strong>
                    {item.description ? (
                      <span className="admin-crud-page__sortable-description">
                        {item.description}
                      </span>
                    ) : null}
                    {item.badge ? (
                      <span className="admin-crud-page__sortable-badge">{item.badge}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-crud-page__sortable-handle"
                  aria-label={`${item.title} 순서 이동 핸들`}
                  aria-describedby="admin-order-dialog-note"
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
                </button>
              </li>
            );
          })}
        </ol>

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
              onClick={() => void handleSave()}
              disabled={isPending || !hasChanges}
            >
              저장
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

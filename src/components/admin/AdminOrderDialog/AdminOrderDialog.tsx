import { useEffect, useMemo, useState } from 'react';
import { ADMIN_ORDER_DIALOG_DEFAULTS } from './AdminOrderDialog.constants';
import type { AdminOrderDialogItem, AdminOrderDialogProps } from './AdminOrderDialog.types';

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
  isSaving,
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
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

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
        if (!isSaving) {
          onClose();
        }
      }}
    >
      <section
        className="admin-crud-page__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-crud-page__dialog-header">
          <div className="admin-crud-page__dialog-heading">
            <h2 className="admin-crud-page__dialog-title">{title}</h2>
            {description ? (
              <p className="admin-crud-page__dialog-description">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-crud-page__button admin-crud-page__button--secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            닫기
          </button>
        </header>

        {errorMessage ? <p className="admin-crud-page__helper-text">{errorMessage}</p> : null}

        <ol className="admin-crud-page__sortable-list">
          {draftItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === draftItems.length - 1;
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
                <button
                  type="button"
                  className="admin-crud-page__sortable-handle"
                  aria-label={`${item.title} 순서 이동 핸들`}
                  aria-describedby="admin-order-dialog-note"
                  draggable={!isSaving}
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTargetId(null);
                  }}
                  onKeyDown={(event) => {
                    if (isSaving) {
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
                  disabled={isSaving}
                >
                  <span className="admin-crud-page__sortable-handle-dots" aria-hidden="true" />
                </button>
                <div className="admin-crud-page__sortable-body">
                  <div className="admin-crud-page__sortable-topline">
                    <span className="admin-crud-page__sortable-order">{index + 1}</span>
                    <strong className="admin-crud-page__sortable-title">{item.title}</strong>
                    {item.badge ? (
                      <span className="admin-crud-page__sortable-badge">{item.badge}</span>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="admin-crud-page__sortable-description">{item.description}</p>
                  ) : null}
                </div>
                <span className="admin-crud-page__sortable-meta" aria-hidden="true">
                  {isFirst ? '첫 항목' : isLast ? '마지막 항목' : '이동 가능'}
                </span>
              </li>
            );
          })}
        </ol>

        <footer className="admin-crud-page__dialog-footer">
          <p className="admin-crud-page__dialog-note" id="admin-order-dialog-note">
            핸들을 드래그해 놓거나, 핸들에 포커스한 뒤 위아래 방향키로 순서를 바꾼 다음 저장합니다.
          </p>
          <div className="admin-crud-page__actions">
            <button
              type="button"
              className="admin-crud-page__button admin-crud-page__button--secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="button"
              className="admin-crud-page__button admin-crud-page__button--primary"
              onClick={() => void handleSave()}
              disabled={isSaving || !hasChanges}
            >
              저장
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

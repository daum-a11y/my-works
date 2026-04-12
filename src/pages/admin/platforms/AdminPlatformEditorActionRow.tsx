import { Link } from 'react-router-dom';

interface AdminPlatformEditorActionRowProps {
  isEditMode: boolean;
  deletePending: boolean;
  transferPending: boolean;
  transferBlocked: boolean;
  transferHelpText: string;
  savePending: boolean;
  onDelete: () => void;
  onTransfer: () => void;
}

export function AdminPlatformEditorActionRow({
  isEditMode,
  deletePending,
  transferPending,
  transferBlocked,
  transferHelpText,
  savePending,
  onDelete,
  onTransfer,
}: AdminPlatformEditorActionRowProps) {
  return (
    <div className="projects-feature__form-actions projects-feature__editor-form-actions">
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--start'
        }
      >
        {isEditMode ? (
          <>
            <button
              type="button"
              className={'projects-feature__delete-button'}
              onClick={onDelete}
              disabled={deletePending || transferPending}
            >
              삭제
            </button>
            <button
              type="button"
              className={'projects-feature__button projects-feature__button--secondary'}
              onClick={onTransfer}
              disabled={transferPending || transferBlocked || deletePending || savePending}
            >
              전환
            </button>
            {transferHelpText ? (
              <p className={'projects-feature__help-text'}>{transferHelpText}</p>
            ) : null}
          </>
        ) : null}
      </div>
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
        }
      >
        <Link
          to="/admin/platform"
          className={'projects-feature__button projects-feature__button--secondary'}
        >
          취소
        </Link>
        <button
          type="submit"
          className={'projects-feature__button projects-feature__button--primary'}
          disabled={savePending}
        >
          저장
        </button>
      </div>
    </div>
  );
}

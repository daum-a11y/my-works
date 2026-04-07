import { Link } from 'react-router-dom';

interface AdminTaskTypeEditorActionRowProps {
  isEditMode: boolean;
  deletePending: boolean;
  deleteBlocked: boolean;
  deleteHelpText: string;
  savePending: boolean;
  onDelete: () => void;
}

export function AdminTaskTypeEditorActionRow({
  isEditMode,
  deletePending,
  deleteBlocked,
  deleteHelpText,
  savePending,
  onDelete,
}: AdminTaskTypeEditorActionRowProps) {
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
              disabled={deletePending || deleteBlocked}
            >
              삭제
            </button>
            {deleteHelpText ? (
              <p className={'projects-feature__help-text'}>{deleteHelpText}</p>
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
          to="/admin/type"
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

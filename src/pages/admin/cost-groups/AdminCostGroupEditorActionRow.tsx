import { Link } from 'react-router-dom';

interface AdminCostGroupEditorActionRowProps {
  isEditMode: boolean;
  deletePending: boolean;
  transferPending: boolean;
  transferBlocked: boolean;
  transferHelpText: string;
  savePending: boolean;
  onDelete: () => void;
  onTransfer: () => void;
  onViewTasks: () => void;
}

export function AdminCostGroupEditorActionRow({
  isEditMode,
  deletePending,
  transferPending,
  transferBlocked,
  transferHelpText,
  savePending,
  onDelete,
  onTransfer,
  onViewTasks,
}: AdminCostGroupEditorActionRowProps) {
  const helpText = transferHelpText;

  return (
    <div className="projects-feature__form-actions projects-feature__editor-form-actions">
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--start'
        }
      >
        {isEditMode ? (
          <button
            type="button"
            className={'projects-feature__delete-button'}
            onClick={onDelete}
            disabled={deletePending || transferPending}
          >
            삭제
          </button>
        ) : null}
        {isEditMode ? (
          <button
            type="button"
            className={'projects-feature__button projects-feature__button--secondary'}
            onClick={onTransfer}
            disabled={transferPending || transferBlocked || deletePending || savePending}
          >
            전환
          </button>
        ) : null}
        {isEditMode ? (
          <button
            type="button"
            className={'projects-feature__button projects-feature__button--secondary'}
            onClick={onViewTasks}
            disabled={transferPending}
          >
            조회
          </button>
        ) : null}
        {helpText ? <span className="projects-feature__helper-text">{helpText}</span> : null}
      </div>
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
        }
      >
        <Link
          to="/admin/cost-group"
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

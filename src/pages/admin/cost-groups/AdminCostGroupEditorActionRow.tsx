import { Button } from 'krds-react';
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
          <Button
            type="button"
            className="projects-feature__delete-button"
            variant="secondary"
            size="medium"
            onClick={onDelete}
            disabled={deletePending || transferPending}
          >
            삭제
          </Button>
        ) : null}
        {isEditMode ? (
          <Button
            type="button"
            variant="secondary"
            size="medium"
            onClick={onTransfer}
            disabled={transferPending || transferBlocked || deletePending || savePending}
          >
            전환
          </Button>
        ) : null}
        {isEditMode ? (
          <Button
            type="button"
            variant="secondary"
            size="medium"
            onClick={onViewTasks}
            disabled={transferPending}
          >
            조회
          </Button>
        ) : null}
        {helpText ? <span className="projects-feature__helper-text">{helpText}</span> : null}
      </div>
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
        }
      >
        <Link to="/admin/cost-group" className="krds-btn secondary medium">
          취소
        </Link>
        <Button type="submit" variant="primary" size="medium" disabled={savePending}>
          저장
        </Button>
      </div>
    </div>
  );
}

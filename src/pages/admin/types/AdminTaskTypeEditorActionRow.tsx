import { Button } from 'krds-react';
import { Link } from 'react-router-dom';

interface AdminTaskTypeEditorActionRowProps {
  isEditMode: boolean;
  deletePending: boolean;
  deleteBlocked: boolean;
  deleteHelpText: string;
  transferPending: boolean;
  transferBlocked: boolean;
  transferHelpText: string;
  savePending: boolean;
  onDelete: () => void;
  onTransfer: () => void;
  onViewTasks: () => void;
}

export function AdminTaskTypeEditorActionRow({
  isEditMode,
  deletePending,
  deleteBlocked,
  deleteHelpText,
  transferPending,
  transferBlocked,
  transferHelpText,
  savePending,
  onDelete,
  onTransfer,
  onViewTasks,
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
            <Button
              type="button"
              className="projects-feature__delete-button"
              variant="secondary"
              size="medium"
              onClick={onDelete}
              disabled={deletePending || deleteBlocked || transferPending}
            >
              삭제
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="medium"
              onClick={onTransfer}
              disabled={transferPending || transferBlocked || deletePending || savePending}
            >
              전환
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="medium"
              onClick={onViewTasks}
              disabled={transferPending}
            >
              조회
            </Button>
            {deleteHelpText || transferHelpText ? (
              <p className={'projects-feature__help-text'}>{deleteHelpText || transferHelpText}</p>
            ) : null}
          </>
        ) : null}
      </div>
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
        }
      >
        <Link to="/admin/type" className="krds-btn secondary medium">
          취소
        </Link>
        <Button type="submit" variant="primary" size="medium" disabled={savePending}>
          저장
        </Button>
      </div>
    </div>
  );
}

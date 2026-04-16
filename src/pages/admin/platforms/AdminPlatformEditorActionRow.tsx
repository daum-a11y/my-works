import { Button, CriticalAlert } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';

interface AdminPlatformEditorActionRowProps {
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

export function AdminPlatformEditorActionRow({
  isEditMode,
  deletePending,
  transferPending,
  transferBlocked,
  transferHelpText,
  savePending,
  onDelete,
  onTransfer,
  onViewTasks,
}: AdminPlatformEditorActionRowProps) {
  return (
    <div className="form-actions editor-actions">
      <div className={'editor-actions is-start'}>
        {isEditMode ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="medium"
              onClick={onDelete}
              disabled={deletePending || transferPending}
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
            {transferHelpText ? (
              <CriticalAlert alerts={[{ variant: 'info', message: transferHelpText }]} />
            ) : null}
          </>
        ) : null}
      </div>
      <div className={'editor-actions is-end'}>
        <Button as={RouterLink} to="/admin/platform" role="link">
          취소
        </Button>
        <Button type="submit" variant="primary" size="medium" disabled={savePending}>
          저장
        </Button>
      </div>
    </div>
  );
}

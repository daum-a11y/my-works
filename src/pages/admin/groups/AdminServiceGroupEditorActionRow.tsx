import { Button, CriticalAlert } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';

interface AdminServiceGroupEditorActionRowProps {
  isEditMode: boolean;
  deletePending: boolean;
  deleteBlocked: boolean;
  deleteHelpText: string;
  transferPending: boolean;
  transferBlocked: boolean;
  transferHelpText: string;
  savePending: boolean;
  canSave: boolean;
  onDelete: () => void;
  onTransfer: () => void;
  onViewTasks: () => void;
}

export function AdminServiceGroupEditorActionRow({
  isEditMode,
  deletePending,
  deleteBlocked,
  deleteHelpText,
  transferPending,
  transferBlocked,
  transferHelpText,
  savePending,
  canSave,
  onDelete,
  onTransfer,
  onViewTasks,
}: AdminServiceGroupEditorActionRowProps) {
  return (
    <div className="action-area">
      <div className={'action-group is-start'}>
        {isEditMode ? (
          <>
            <Button
              type="button"
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
            {transferHelpText || deleteHelpText ? (
              <CriticalAlert
                alerts={[{ variant: 'info', message: transferHelpText || deleteHelpText }]}
              />
            ) : null}
          </>
        ) : null}
      </div>
      <div className={'action-group is-end'}>
        <Button as={RouterLink} to="/admin/group" role="link">
          취소
        </Button>
        <Button type="submit" variant="primary" size="medium" disabled={savePending || !canSave}>
          저장
        </Button>
      </div>
    </div>
  );
}

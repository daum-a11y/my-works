import { Button, CriticalAlert } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';

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
    <div className="action-area">
      <div className={'action-group is-start'}>
        {isEditMode ? (
          <Button
            type="button"
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
        {helpText ? <CriticalAlert alerts={[{ variant: 'info', message: helpText }]} /> : null}
      </div>
      <div className={'action-group is-end'}>
        <Button as={RouterLink} to="/admin/cost-group" role="link">
          취소
        </Button>
        <Button type="submit" variant="primary" size="medium" disabled={savePending}>
          저장
        </Button>
      </div>
    </div>
  );
}

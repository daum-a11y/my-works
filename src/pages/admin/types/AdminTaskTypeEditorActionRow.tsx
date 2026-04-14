import { Button, CriticalAlert } from 'krds-react';
import { KrdsRouterButtonLink } from '../../../components/shared';

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
    <div className="krds-page__form-actions krds-page__editor-form-actions">
      <div
        className={
          'krds-page__editor-form-actions krds-page__editor-form-actions--start'
        }
      >
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
            {deleteHelpText || transferHelpText ? (
              <CriticalAlert
                alerts={[{ variant: 'info', message: deleteHelpText || transferHelpText }]}
              />
            ) : null}
          </>
        ) : null}
      </div>
      <div
        className={
          'krds-page__editor-form-actions krds-page__editor-form-actions--end'
        }
      >
        <KrdsRouterButtonLink to="/admin/type">
          취소
        </KrdsRouterButtonLink>
        <Button type="submit" variant="primary" size="medium" disabled={savePending}>
          저장
        </Button>
      </div>
    </div>
  );
}

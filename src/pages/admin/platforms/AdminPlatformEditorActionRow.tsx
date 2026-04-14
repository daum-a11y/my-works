import { Button, CriticalAlert } from 'krds-react';
import { KrdsRouterButtonLink } from '../../../components/shared';

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
      <div
        className={
          'krds-page__editor-form-actions krds-page__editor-form-actions--end'
        }
      >
        <KrdsRouterButtonLink to="/admin/platform">
          취소
        </KrdsRouterButtonLink>
        <Button type="submit" variant="primary" size="medium" disabled={savePending}>
          저장
        </Button>
      </div>
    </div>
  );
}

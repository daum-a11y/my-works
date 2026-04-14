import { Button } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';

interface AdminMemberEditorActionRowProps {
  isEditMode: boolean;
  isInactiveMember: boolean;
  authActionLabel: string;
  invitePending: boolean;
  restorePending: boolean;
  deletePending: boolean;
  savePending: boolean;
  onInvite: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export function AdminMemberEditorActionRow({
  isEditMode,
  isInactiveMember,
  authActionLabel,
  invitePending,
  restorePending,
  deletePending,
  savePending,
  onInvite,
  onRestore,
  onDelete,
}: AdminMemberEditorActionRowProps) {
  return (
    <div className="krds-page__form-actions krds-page__editor-form-actions">
      <div
        className={
          'krds-page__editor-form-actions krds-page__editor-form-actions--start'
        }
      >
        {isEditMode ? (
          <>
            {!isInactiveMember ? (
              <Button
                type="button"
                variant="secondary"
                size="medium"
                onClick={onInvite}
                disabled={invitePending}
              >
                {authActionLabel}
              </Button>
            ) : null}
            {isInactiveMember ? (
              <Button
                type="button"
                variant="primary"
                size="medium"
                onClick={onRestore}
                disabled={restorePending}
              >
                복원
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="medium"
                onClick={onDelete}
                disabled={deletePending}
              >
                삭제
              </Button>
            )}
          </>
        ) : null}
      </div>
      <div
        className={
          'krds-page__editor-form-actions krds-page__editor-form-actions--end'
        }
      >
        <Button as={RouterLink} to="/admin/members" role="link">
          취소
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="medium"
          disabled={savePending || Boolean(isInactiveMember)}
        >
          저장
        </Button>
      </div>
    </div>
  );
}

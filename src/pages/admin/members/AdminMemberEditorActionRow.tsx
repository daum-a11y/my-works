import { Button } from 'krds-react';
import { Link } from 'react-router-dom';

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
    <div className="projects-feature__form-actions projects-feature__editor-form-actions">
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--start'
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
                className="projects-feature__delete-button"
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
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
        }
      >
        <Link to="/admin/members" className="krds-btn secondary medium">
          취소
        </Link>
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

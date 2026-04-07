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
              <button
                type="button"
                className={'projects-feature__button projects-feature__button--secondary'}
                onClick={onInvite}
                disabled={invitePending}
              >
                {authActionLabel}
              </button>
            ) : null}
            {isInactiveMember ? (
              <button
                type="button"
                className={'projects-feature__button projects-feature__button--primary'}
                onClick={onRestore}
                disabled={restorePending}
              >
                복원
              </button>
            ) : (
              <button
                type="button"
                className={'projects-feature__delete-button'}
                onClick={onDelete}
                disabled={deletePending}
              >
                삭제
              </button>
            )}
          </>
        ) : null}
      </div>
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
        }
      >
        <Link
          to="/admin/members"
          className={'projects-feature__button projects-feature__button--secondary'}
        >
          취소
        </Link>
        <button
          type="submit"
          className={'projects-feature__button projects-feature__button--primary'}
          disabled={savePending || Boolean(isInactiveMember)}
        >
          저장
        </button>
      </div>
    </div>
  );
}

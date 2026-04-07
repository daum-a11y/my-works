import type { MemberAdminPayload } from '../admin.types';
import { ADMIN_MEMBER_EDITOR_BASIC_SECTION_TITLE } from './AdminMemberEditorPage.constants';

interface AdminMemberEditorBasicSectionProps {
  draft: MemberAdminPayload;
  isInactiveMember: boolean;
  isEmailLocked: boolean;
  roleLabel: string;
  onDraftChange: (patch: Partial<MemberAdminPayload>) => void;
}

export function AdminMemberEditorBasicSection({
  draft,
  isInactiveMember,
  isEmailLocked,
  roleLabel,
  onDraftChange,
}: AdminMemberEditorBasicSectionProps) {
  return (
    <section className={'projects-feature__editor-section'} aria-labelledby="member-basic-section">
      <div className={'projects-feature__section-header'}>
        <h2 id="member-basic-section" className={'projects-feature__section-title'}>
          {ADMIN_MEMBER_EDITOR_BASIC_SECTION_TITLE}
        </h2>
      </div>
      <div className={'projects-feature__editor-form-grid'}>
        <label className={'projects-feature__field'}>
          <span>ID</span>
          <input
            autoFocus
            value={draft.accountId}
            readOnly={Boolean(isInactiveMember)}
            onChange={(event) => onDraftChange({ accountId: event.target.value })}
          />
        </label>

        <label className={'projects-feature__field'}>
          <span>이름</span>
          <input
            value={draft.name}
            readOnly={Boolean(isInactiveMember)}
            onChange={(event) => onDraftChange({ name: event.target.value })}
          />
        </label>

        <label className={'projects-feature__field'}>
          <span>이메일</span>
          <input
            type="email"
            value={draft.email}
            readOnly={isEmailLocked}
            onChange={(event) => onDraftChange({ email: event.target.value })}
          />
        </label>

        <label className={'projects-feature__field'}>
          <span>권한</span>
          {isInactiveMember ? (
            <input value={roleLabel} readOnly />
          ) : (
            <select
              value={draft.role}
              onChange={(event) =>
                onDraftChange({ role: event.target.value as MemberAdminPayload['role'] })
              }
            >
              <option value="user">팀원</option>
              <option value="admin">관리자</option>
            </select>
          )}
        </label>
      </div>
    </section>
  );
}

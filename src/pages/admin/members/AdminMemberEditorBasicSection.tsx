import { Select, TextInput } from 'krds-react';
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
        <div className={'projects-feature__field'}>
          <TextInput
            id="member-account-id"
            label="ID"
            autoFocus
            value={draft.accountId}
            readOnly={Boolean(isInactiveMember)}
            onChange={(value) => onDraftChange({ accountId: value })}
          />
        </div>

        <div className={'projects-feature__field'}>
          <TextInput
            id="member-name"
            label="이름"
            value={draft.name}
            readOnly={Boolean(isInactiveMember)}
            onChange={(value) => onDraftChange({ name: value })}
          />
        </div>

        <div className={'projects-feature__field'}>
          <TextInput
            id="member-email"
            label="이메일"
            type="email"
            value={draft.email}
            readOnly={isEmailLocked}
            onChange={(value) => onDraftChange({ email: value })}
          />
        </div>

        <div className={'projects-feature__field'}>
          {isInactiveMember ? (
            <TextInput id="member-role" label="권한" value={roleLabel} readOnly />
          ) : (
            <Select
              id="member-role"
              label="권한"
              value={draft.role}
              options={[
                { value: 'user', label: '팀원' },
                { value: 'admin', label: '관리자' },
              ]}
              onChange={(value) => onDraftChange({ role: value as MemberAdminPayload['role'] })}
            />
          )}
        </div>
      </div>
    </section>
  );
}

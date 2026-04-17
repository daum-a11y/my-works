import { Select, TextInput } from 'krds-react';
import { PageSection } from '../../../components/shared';
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
    <PageSection
      className={'page-section'}
      title={ADMIN_MEMBER_EDITOR_BASIC_SECTION_TITLE}
      titleId="member-basic-section"
      aria-labelledby="member-basic-section"
    >
      <div className={'form-grid'}>
        <TextInput
          size="medium"
          id="member-account-id"
          label="ID"
          autoFocus
          value={draft.accountId}
          readOnly={Boolean(isInactiveMember)}
          onChange={(value) => onDraftChange({ accountId: value })}
        />

        <TextInput
          size="medium"
          id="member-name"
          label="이름"
          value={draft.name}
          readOnly={Boolean(isInactiveMember)}
          onChange={(value) => onDraftChange({ name: value })}
        />

        <TextInput
          size="medium"
          id="member-email"
          label="이메일"
          type="email"
          value={draft.email}
          readOnly={isEmailLocked}
          onChange={(value) => onDraftChange({ email: value })}
        />

        {isInactiveMember ? (
          <TextInput size="medium" id="member-role" label="권한" value={roleLabel} readOnly />
        ) : (
          <Select
            size="medium"
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
    </PageSection>
  );
}

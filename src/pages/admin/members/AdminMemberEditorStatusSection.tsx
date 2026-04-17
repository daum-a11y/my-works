import { Select, TextInput } from 'krds-react';
import { PageSection } from '../../../components/shared';
import type { MemberAdminPayload } from '../admin.types';
import { ADMIN_MEMBER_EDITOR_STATUS_SECTION_TITLE } from './AdminMemberEditorPage.constants';

interface AdminMemberEditorStatusSectionProps {
  draft: MemberAdminPayload;
  isInactiveMember: boolean;
  activeLabel: string;
  memberStatusLabel: string;
  onDraftChange: (patch: Partial<MemberAdminPayload>) => void;
}

export function AdminMemberEditorStatusSection({
  draft,
  isInactiveMember,
  activeLabel,
  memberStatusLabel,
  onDraftChange,
}: AdminMemberEditorStatusSectionProps) {
  return (
    <PageSection
      className={'page-section'}
      title={ADMIN_MEMBER_EDITOR_STATUS_SECTION_TITLE}
      titleId="member-status-section"
      aria-labelledby="member-status-section"
    >
      <div className={'form-grid'}>
        <TextInput
          size="medium"
          id="member-auth-user-id"
          label="Auth ID"
          value={draft.authUserId ?? '-'}
          readOnly
        />
        <TextInput
          size="medium"
          id="member-active-label"
          label="활성 여부"
          value={activeLabel}
          readOnly
        />

        {isInactiveMember ? (
          <TextInput
            size="medium"
            id="member-status"
            label="승인 상태"
            value={memberStatusLabel}
            readOnly
          />
        ) : (
          <Select
            size="medium"
            id="member-status"
            label="승인 상태"
            value={draft.memberStatus}
            options={[
              { value: 'active', label: '활성' },
              { value: 'pending', label: '승인대기' },
            ]}
            onChange={(value) =>
              onDraftChange({ memberStatus: value as MemberAdminPayload['memberStatus'] })
            }
          />
        )}

        {isInactiveMember ? (
          <TextInput
            size="medium"
            id="member-report-required"
            label="업무보고 접근"
            value={draft.reportRequired ? '허용' : '차단'}
            readOnly
          />
        ) : (
          <Select
            size="medium"
            id="member-report-required"
            label="업무보고 접근"
            value={draft.reportRequired ? '1' : '0'}
            options={[
              { value: '1', label: '허용' },
              { value: '0', label: '차단' },
            ]}
            onChange={(value) => onDraftChange({ reportRequired: value === '1' })}
          />
        )}
      </div>
    </PageSection>
  );
}

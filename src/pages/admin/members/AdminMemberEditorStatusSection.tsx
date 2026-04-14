import { Select, TextInput } from 'krds-react';
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
    <section className={'projects-feature__editor-section'} aria-labelledby="member-status-section">
      <div className={'projects-feature__section-header'}>
        <h2 id="member-status-section" className={'projects-feature__section-title'}>
          {ADMIN_MEMBER_EDITOR_STATUS_SECTION_TITLE}
        </h2>
      </div>
      <div className={'projects-feature__editor-form-grid'}>
        <div className={'projects-feature__field'}>
          <TextInput
            id="member-auth-user-id"
            label="Auth ID"
            value={draft.authUserId ?? '-'}
            readOnly
          />
        </div>
        <div className={'projects-feature__field'}>
          <TextInput id="member-active-label" label="활성 여부" value={activeLabel} readOnly />
        </div>

        <div className={'projects-feature__field'}>
          {isInactiveMember ? (
            <TextInput id="member-status" label="승인 상태" value={memberStatusLabel} readOnly />
          ) : (
            <Select
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
        </div>

        <div className={'projects-feature__field'}>
          {isInactiveMember ? (
            <TextInput
              id="member-report-required"
              label="업무보고 접근"
              value={draft.reportRequired ? '허용' : '차단'}
              readOnly
            />
          ) : (
            <Select
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
      </div>
    </section>
  );
}

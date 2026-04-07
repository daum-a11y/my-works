import type { MemberAdminPayload } from '../types';
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
        <label className={'projects-feature__field'}>
          <span>Auth ID</span>
          <input value={draft.authUserId ?? '-'} readOnly />
        </label>
        <label className={'projects-feature__field'}>
          <span>활성 여부</span>
          <input value={activeLabel} readOnly />
        </label>

        <label className={'projects-feature__field'}>
          <span>승인 상태</span>
          {isInactiveMember ? (
            <input value={memberStatusLabel} readOnly />
          ) : (
            <select
              value={draft.memberStatus}
              onChange={(event) =>
                onDraftChange({
                  memberStatus: event.target.value as MemberAdminPayload['memberStatus'],
                })
              }
            >
              <option value="active">활성</option>
              <option value="pending">승인대기</option>
            </select>
          )}
        </label>

        <label className={'projects-feature__field'}>
          <span>업무보고 접근</span>
          {isInactiveMember ? (
            <input value={draft.reportRequired ? '허용' : '차단'} readOnly />
          ) : (
            <select
              value={draft.reportRequired ? '1' : '0'}
              onChange={(event) => onDraftChange({ reportRequired: event.target.value === '1' })}
            >
              <option value="1">허용</option>
              <option value="0">차단</option>
            </select>
          )}
        </label>
      </div>
    </section>
  );
}

import { Textarea } from 'krds-react';
import { PageSection } from '../../../components/shared';
import type { MemberAdminPayload } from '../admin.types';
import { ADMIN_MEMBER_EDITOR_NOTE_SECTION_TITLE } from './AdminMemberEditorPage.constants';

interface AdminMemberEditorNoteSectionProps {
  draft: MemberAdminPayload;
  isInactiveMember: boolean;
  onDraftChange: (patch: Partial<MemberAdminPayload>) => void;
}

export function AdminMemberEditorNoteSection({
  draft,
  isInactiveMember,
  onDraftChange,
}: AdminMemberEditorNoteSectionProps) {
  return (
    <PageSection
      className={'page-section'}
      title={ADMIN_MEMBER_EDITOR_NOTE_SECTION_TITLE}
      titleId="member-note-section"
      aria-labelledby="member-note-section"
    >
      <div className={'form-grid'}>
        <Textarea
          id="member-note"
          label="비고"
          value={draft.note}
          readOnly={Boolean(isInactiveMember)}
          onChange={(value) => onDraftChange({ note: value })}
        />
      </div>
    </PageSection>
  );
}

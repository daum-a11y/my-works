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
    <section className={'projects-feature__editor-section'} aria-labelledby="member-note-section">
      <div className={'projects-feature__section-header'}>
        <h2 id="member-note-section" className={'projects-feature__section-title'}>
          {ADMIN_MEMBER_EDITOR_NOTE_SECTION_TITLE}
        </h2>
      </div>
      <div className={'projects-feature__editor-form-grid'}>
        <label className={'projects-feature__field'}>
          <span>비고</span>
          <textarea
            value={draft.note}
            readOnly={Boolean(isInactiveMember)}
            onChange={(event) => onDraftChange({ note: event.target.value })}
          />
        </label>
      </div>
    </section>
  );
}

import type { RefObject } from 'react';
import type { AdminPlatformPayload } from '../admin.types';

interface AdminPlatformEditorFormProps {
  draft: AdminPlatformPayload;
  titleRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (patch: Partial<AdminPlatformPayload>) => void;
}

export function AdminPlatformEditorForm({
  draft,
  titleRef,
  onDraftChange,
}: AdminPlatformEditorFormProps) {
  return (
    <div className={'projects-feature__editor-form-grid'}>
      <label className={'projects-feature__field'}>
        <span>플랫폼명</span>
        <input
          ref={titleRef}
          value={draft.name}
          onChange={(event) => onDraftChange({ name: event.target.value })}
        />
      </label>
      <label className={'projects-feature__field'}>
        <span>노출여부</span>
        <select
          value={draft.isVisible ? '1' : '0'}
          onChange={(event) => onDraftChange({ isVisible: event.target.value === '1' })}
        >
          <option value="1">노출</option>
          <option value="0">미노출</option>
        </select>
      </label>
    </div>
  );
}

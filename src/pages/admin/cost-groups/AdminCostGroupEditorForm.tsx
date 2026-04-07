import type { RefObject } from 'react';
import type { AdminCostGroupPayload } from '../types';

interface AdminCostGroupEditorFormProps {
  draft: AdminCostGroupPayload;
  titleRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (patch: Partial<AdminCostGroupPayload>) => void;
}

export function AdminCostGroupEditorForm({
  draft,
  titleRef,
  onDraftChange,
}: AdminCostGroupEditorFormProps) {
  return (
    <div className={'projects-feature__editor-form-grid'}>
      <label className={'projects-feature__field'}>
        <span>청구그룹명</span>
        <input
          ref={titleRef}
          value={draft.name}
          onChange={(event) => onDraftChange({ name: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>노출여부</span>
        <select
          value={draft.isActive ? '1' : '0'}
          onChange={(event) => onDraftChange({ isActive: event.target.value === '1' })}
        >
          <option value="1">노출</option>
          <option value="0">숨김</option>
        </select>
      </label>
    </div>
  );
}

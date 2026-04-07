import type { RefObject } from 'react';
import type { AdminServiceGroupPayload } from '../types';

interface AdminServiceGroupEditorFormProps {
  draft: AdminServiceGroupPayload;
  costGroups: Array<{ id: string; name: string }>;
  titleRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (patch: Partial<AdminServiceGroupPayload>) => void;
}

export function AdminServiceGroupEditorForm({
  draft,
  costGroups,
  titleRef,
  onDraftChange,
}: AdminServiceGroupEditorFormProps) {
  return (
    <div className={'projects-feature__editor-form-grid'}>
      <label className={'projects-feature__field'}>
        <span>서비스그룹</span>
        <input
          ref={titleRef}
          value={draft.svcGroup}
          onChange={(event) => onDraftChange({ svcGroup: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>서비스명</span>
        <input
          value={draft.svcName}
          onChange={(event) => onDraftChange({ svcName: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>청구그룹</span>
        <select
          value={draft.costGroupId}
          onChange={(event) => onDraftChange({ costGroupId: event.target.value })}
        >
          <option value="">청구그룹 선택</option>
          {costGroups.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className={'projects-feature__field'}>
        <span>노출여부</span>
        <select
          value={draft.svcActive ? '1' : '0'}
          onChange={(event) => {
            const nextActive = event.target.value === '1';
            onDraftChange({
              svcActive: nextActive,
              isActive: nextActive,
            });
          }}
        >
          <option value="1">노출</option>
          <option value="0">숨김</option>
        </select>
      </label>
    </div>
  );
}

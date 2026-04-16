import type { RefObject } from 'react';
import { Select, TextInput } from 'krds-react';
import type { AdminCostGroupPayload } from '../admin.types';

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
    <div className={'form-grid'}>
      <TextInput
        size="medium"
        id="admin-cost-group-name"
        label="청구그룹명"
        ref={titleRef}
        value={draft.name}
        onChange={(value) => onDraftChange({ name: value })}
      />

      <Select
        size="medium"
        id="admin-cost-group-active"
        label="노출여부"
        value={draft.isActive ? '1' : '0'}
        options={[
          { value: '1', label: '노출' },
          { value: '0', label: '숨김' },
        ]}
        onChange={(value) => onDraftChange({ isActive: value === '1' })}
      />
    </div>
  );
}

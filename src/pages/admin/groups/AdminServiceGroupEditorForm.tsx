import type { RefObject } from 'react';
import { Select, TextInput } from 'krds-react';
import type { AdminServiceGroupPayload } from '../admin.types';

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
    <div className={'krds-page__editor-form-grid'}>
      <Select
        size="medium"
        id="admin-service-group-cost-group"
        label="청구그룹"
        value={draft.costGroupId}
        options={[
          { value: '', label: '청구그룹 선택' },
          ...costGroups.map((item) => ({ value: item.id, label: item.name })),
        ]}
        onChange={(value) => onDraftChange({ costGroupId: value })}
      />

      <TextInput
        size="medium"
        id="admin-service-group-name"
        label="서비스 그룹"
        ref={titleRef}
        value={draft.serviceGroupName}
        onChange={(value) => onDraftChange({ serviceGroupName: value })}
      />

      <TextInput
        size="medium"
        id="admin-service-name"
        label="서비스명"
        value={draft.serviceName}
        onChange={(value) => onDraftChange({ serviceName: value })}
      />

      <Select
        size="medium"
        id="admin-service-group-active"
        label="노출여부"
        value={draft.svcActive ? '1' : '0'}
        options={[
          { value: '1', label: '노출' },
          { value: '0', label: '숨김' },
        ]}
        onChange={(value) => {
          const nextActive = value === '1';
          onDraftChange({
            svcActive: nextActive,
            isActive: nextActive,
          });
        }}
      />
    </div>
  );
}

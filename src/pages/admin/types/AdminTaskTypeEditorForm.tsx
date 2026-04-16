import type { RefObject } from 'react';
import { Select, TextInput } from 'krds-react';
import type { AdminTaskTypePayload } from '../admin.types';

interface AdminTaskTypeEditorFormProps {
  draft: AdminTaskTypePayload;
  titleRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (patch: Partial<AdminTaskTypePayload>) => void;
}

export function AdminTaskTypeEditorForm({
  draft,
  titleRef,
  onDraftChange,
}: AdminTaskTypeEditorFormProps) {
  return (
    <div className={'form-grid'}>
      <TextInput
        size="medium"
        id="admin-task-type-type1"
        label="타입1"
        ref={titleRef}
        value={draft.type1}
        onChange={(value) => onDraftChange({ type1: value })}
      />

      <TextInput
        size="medium"
        id="admin-task-type-type2"
        label="타입2"
        value={draft.type2}
        onChange={(value) => onDraftChange({ type2: value })}
      />

      <Select
        size="medium"
        id="admin-task-type-resource-type"
        label="리소스 타입"
        value={draft.requiresServiceGroup ? '1' : '0'}
        options={[
          { value: '1', label: '프로젝트' },
          { value: '0', label: '일반' },
        ]}
        onChange={(value) => onDraftChange({ requiresServiceGroup: value === '1' })}
      />

      <Select
        size="medium"
        id="admin-task-type-active"
        label="활성여부"
        value={draft.isActive ? '1' : '0'}
        options={[
          { value: '1', label: '활성' },
          { value: '0', label: '비활성' },
        ]}
        onChange={(value) => onDraftChange({ isActive: value === '1' })}
      />

      <TextInput
        size="medium"
        id="admin-task-type-note"
        label="비고"
        value={draft.note}
        onChange={(value) => onDraftChange({ note: value })}
      />
    </div>
  );
}

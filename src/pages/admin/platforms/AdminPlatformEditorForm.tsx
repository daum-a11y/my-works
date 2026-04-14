import type { RefObject } from 'react';
import { Select, TextInput } from 'krds-react';
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
      <div className={'projects-feature__field'}>
        <TextInput
          id="admin-platform-name"
          label="플랫폼명"
          ref={titleRef}
          value={draft.name}
          onChange={(value) => onDraftChange({ name: value })}
        />
      </div>
      <div className={'projects-feature__field'}>
        <Select
          id="admin-platform-visible"
          label="노출여부"
          value={draft.isVisible ? '1' : '0'}
          options={[
            { value: '1', label: '노출' },
            { value: '0', label: '미노출' },
          ]}
          onChange={(value) => onDraftChange({ isVisible: value === '1' })}
        />
      </div>
    </div>
  );
}

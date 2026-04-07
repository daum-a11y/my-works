import type { RefObject } from 'react';
import type { AdminTaskTypePayload } from '../admin.types';

interface AdminTaskTypeEditorFormProps {
  draft: AdminTaskTypePayload;
  isEditMode: boolean;
  titleRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (patch: Partial<AdminTaskTypePayload>) => void;
}

export function AdminTaskTypeEditorForm({
  draft,
  isEditMode,
  titleRef,
  onDraftChange,
}: AdminTaskTypeEditorFormProps) {
  return (
    <div className={'projects-feature__editor-form-grid'}>
      <label className={'projects-feature__field'}>
        <span>타입1</span>
        <input
          ref={titleRef}
          value={draft.type1}
          onChange={(event) => onDraftChange({ type1: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>타입2</span>
        <input
          value={draft.type2}
          onChange={(event) => onDraftChange({ type2: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>리소스 타입</span>
        <select
          value={draft.requiresServiceGroup ? '1' : '0'}
          onChange={(event) => onDraftChange({ requiresServiceGroup: event.target.value === '1' })}
        >
          <option value="1">프로젝트</option>
          <option value="0">일반</option>
        </select>
      </label>

      <label className={'projects-feature__field'}>
        <span>활성여부</span>
        <select
          value={draft.isActive ? '1' : '0'}
          onChange={(event) => onDraftChange({ isActive: event.target.value === '1' })}
        >
          <option value="1">활성</option>
          <option value="0">비활성</option>
        </select>
      </label>

      {isEditMode ? (
        <label className={'projects-feature__field'}>
          <span>비고</span>
          <input
            value={draft.displayLabel}
            onChange={(event) => onDraftChange({ displayLabel: event.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
}

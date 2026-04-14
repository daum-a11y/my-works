import type { FormEvent, KeyboardEvent } from 'react';
import { Button, Select, TextInput, Textarea } from 'krds-react';
import type { CostGroup, ProjectSubtask } from '../../types/domain';
import type { ProjectViewModel, ReportDraft } from './reportUtils';

interface ReportsEditorFormProps {
  mode: 'create' | 'edit';
  draft: ReportDraft;
  draftSubtasks: ProjectSubtask[];
  costGroupOptions: CostGroup[];
  filteredProjectOptions: ProjectViewModel[];
  isSaving: boolean;
  isListDateValid: boolean;
  projectQuery: string;
  type1Options: string[];
  type2Options: string[];
  type2Placeholder: string;
  type1Value: string;
  projectSearchPlaceholder: string;
  projectTypeSelected: boolean;
  showTypeStep: boolean;
  showProjectLookupStep: boolean;
  showTaskStep: boolean;
  showSubtaskSelect: boolean;
  isReadonlyWorkHours: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDraftFieldChange: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  onCancelEdit: () => void;
  onProjectQueryChange: (value: string) => void;
  onProjectSearch: () => void;
  onProjectSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onType2Change: (value: string) => void;
}

export function ReportsEditorForm({
  mode,
  draft,
  draftSubtasks,
  costGroupOptions,
  filteredProjectOptions,
  isSaving,
  isListDateValid,
  projectQuery,
  type1Options,
  type2Options,
  type2Placeholder,
  type1Value,
  projectSearchPlaceholder,
  projectTypeSelected,
  showTypeStep,
  showProjectLookupStep,
  showTaskStep,
  showSubtaskSelect,
  isReadonlyWorkHours,
  onSubmit,
  onDraftFieldChange,
  onCancelEdit,
  onProjectQueryChange,
  onProjectSearch,
  onProjectSearchKeyDown,
  onType2Change,
}: ReportsEditorFormProps) {
  return (
    <section className="reports-page__panel">
      <div className="reports-page__panel-head">
        <h2 className="reports-page__panel-title">{mode === 'edit' ? '업무 수정' : '업무 등록'}</h2>
        {mode === 'edit' ? (
          <Button type="button" variant="secondary" onClick={onCancelEdit}>
            편집 취소
          </Button>
        ) : null}
      </div>

      <form className="reports-page__form" onSubmit={onSubmit}>
        <div className="reports-page__step">
          <div className="reports-page__form-grid reports-page__form-grid--compact">
            <label className="reports-page__field">
              <span>청구그룹</span>
              <Select
                value={draft.costGroupId}
                onChange={(value) => onDraftFieldChange('costGroupId', value)}
                options={[
                  {
                    value: '',
                    label: costGroupOptions.length ? '선택' : '청구그룹이 없습니다.',
                  },
                  ...costGroupOptions.map((group) => ({ value: group.id, label: group.name })),
                ]}
                style={{ width: '100%' }}
              />
            </label>
            {showTypeStep ? (
              <>
                {projectTypeSelected ? (
                  <label className="reports-page__field reports-page__field--row-start">
                    <span>타입1</span>
                    <TextInput value={type1Value} readOnly style={{ width: '100%' }} />
                  </label>
                ) : (
                  <label className="reports-page__field reports-page__field--row-start">
                    <span>타입1</span>
                    <Select
                      value={draft.type1}
                      onChange={(value) => onDraftFieldChange('type1', value)}
                      options={[
                        { value: '', label: '선택' },
                        ...type1Options.map((option) => ({ value: option, label: option })),
                      ]}
                      style={{ width: '100%' }}
                    />
                  </label>
                )}

                <label className="reports-page__field">
                  <span>타입2</span>
                  <Select
                    value={draft.type2}
                    onChange={onType2Change}
                    options={[
                      { value: '', label: type2Placeholder || '선택' },
                      ...type2Options.map((option) => ({ value: option, label: option })),
                    ]}
                    style={{ width: '100%' }}
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>

        {showProjectLookupStep ? (
          <div className="reports-page__step">
            <div className="reports-page__project-lookup">
              <label className="reports-page__field">
                <span>프로젝트 검색</span>
                <TextInput
                  value={projectQuery}
                  onChange={onProjectQueryChange}
                  onKeyDown={onProjectSearchKeyDown}
                  placeholder="검색어 입력"
                  style={{ width: '100%' }}
                />
              </label>

              <div className="reports-page__search-button-field">
                <span className="sr-only">프로젝트 검색</span>
                <Button type="button" variant="secondary" onClick={onProjectSearch}>
                  검색
                </Button>
              </div>

              <label className="reports-page__field reports-page__field--project">
                <span>프로젝트</span>
                <Select
                  value={draft.projectId}
                  onChange={(value) => onDraftFieldChange('projectId', value)}
                  disabled={!draft.costGroupId}
                  options={[
                    { value: '', label: projectSearchPlaceholder },
                    ...filteredProjectOptions.map((project) => ({
                      value: project.id,
                      label: [project.project.platform, project.project.name]
                        .filter(Boolean)
                        .join(' - '),
                    })),
                  ]}
                  style={{ width: '100%' }}
                />
              </label>

              {showSubtaskSelect ? (
                <label className="reports-page__field reports-page__field--project">
                  <span>태스크명</span>
                  <Select
                    value={draft.subtaskId}
                    onChange={(value) => onDraftFieldChange('subtaskId', value)}
                    options={[
                      {
                        value: '',
                        label: draftSubtasks.length ? '선택' : '태스크이 존재하지 않습니다.',
                      },
                      ...draftSubtasks.map((page) => ({ value: page.id, label: page.title })),
                    ]}
                    style={{ width: '100%' }}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ) : null}

        {showTaskStep ? (
          <div className="reports-page__step">
            <div className="reports-page__form-grid">
              <label className="reports-page__field">
                <span>업무명</span>
                <TextInput
                  value={draft.content}
                  onChange={(value) => onDraftFieldChange('content', value)}
                  style={{ width: '100%' }}
                />
              </label>

              <label className="reports-page__field">
                <span>업무 시간(분)</span>
                <TextInput
                  type="number"
                  min="0"
                  max="480"
                  step="1"
                  value={draft.taskUsedtime}
                  onChange={(value) => onDraftFieldChange('taskUsedtime', value)}
                  readOnly={isReadonlyWorkHours}
                  style={{ width: '100%' }}
                />
              </label>

              <label className="reports-page__field">
                <span>URL</span>
                <TextInput
                  value={draft.url}
                  onChange={(value) => onDraftFieldChange('url', value)}
                  style={{ width: '100%' }}
                />
              </label>

              <label className="reports-page__field reports-page__field--note">
                <span>비고</span>
                <Textarea
                  value={draft.note}
                  onChange={(value) => onDraftFieldChange('note', value)}
                  rows={2}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          </div>
        ) : null}

        <div className="reports-page__action-row">
          <Button type="submit" variant="primary" disabled={isSaving || !isListDateValid}>
            {mode === 'edit' ? '수정 저장' : '업무 저장'}
          </Button>
          {mode === 'edit' ? (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              편집 취소
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

import type { FormEvent, KeyboardEvent } from 'react';
import { Button, Select, TextInput, Textarea } from 'krds-react';
import { PageSection } from '../../components/shared';
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
    <PageSection
      className="content-panel"
      title={mode === 'edit' ? '업무 수정' : '업무 등록'}
      actions={
        mode === 'edit' ? (
          <Button size="medium" type="button" variant="secondary" onClick={onCancelEdit}>
            편집 취소
          </Button>
        ) : null
      }
    >
      <form className="krds-form" onSubmit={onSubmit}>
        <div className="form-step">
          <div className="form-grid is-compact">
            <Select
              size="medium"
              id="report-editor-cost-group"
              label="청구그룹"
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
            {showTypeStep ? (
              <>
                {projectTypeSelected ? (
                  <TextInput
                    size="medium"
                    id="report-editor-type1-readonly"
                    label="타입1"
                    value={type1Value}
                    readOnly
                    style={{ width: '100%' }}
                  />
                ) : (
                  <Select
                    size="medium"
                    id="report-editor-type1"
                    label="타입1"
                    value={draft.type1}
                    onChange={(value) => onDraftFieldChange('type1', value)}
                    options={[
                      { value: '', label: '선택' },
                      ...type1Options.map((option) => ({ value: option, label: option })),
                    ]}
                    style={{ width: '100%' }}
                  />
                )}

                <Select
                  size="medium"
                  id="report-editor-type2"
                  label="타입2"
                  value={draft.type2}
                  onChange={onType2Change}
                  options={[
                    { value: '', label: type2Placeholder || '선택' },
                    ...type2Options.map((option) => ({ value: option, label: option })),
                  ]}
                  style={{ width: '100%' }}
                />
              </>
            ) : null}
          </div>
        </div>

        {showProjectLookupStep ? (
          <div className="form-step">
            <div className="project-lookup">
              <TextInput
                size="medium"
                id="report-editor-project-search"
                label="프로젝트 검색"
                value={projectQuery}
                onChange={onProjectQueryChange}
                onKeyDown={onProjectSearchKeyDown}
                placeholder="검색어 입력"
                style={{ width: '100%' }}
              />

              <div className="search-button-field">
                <span className="sr-only">프로젝트 검색</span>
                <Button size="medium" type="button" variant="secondary" onClick={onProjectSearch}>
                  검색
                </Button>
              </div>

              <Select
                size="medium"
                id="report-editor-project"
                label="프로젝트"
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

              {showSubtaskSelect ? (
                <Select
                  size="medium"
                  id="report-editor-subtask"
                  label="태스크명"
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
              ) : null}
            </div>
          </div>
        ) : null}

        {showTaskStep ? (
          <div className="form-step">
            <div className="form-grid">
              <TextInput
                size="medium"
                id="report-editor-content"
                label="업무명"
                value={draft.content}
                onChange={(value) => onDraftFieldChange('content', value)}
                style={{ width: '100%' }}
              />

              <TextInput
                size="medium"
                id="report-editor-used-time"
                label="업무 시간(분)"
                type="number"
                min="0"
                max="480"
                step="1"
                value={draft.taskUsedtime}
                onChange={(value) => onDraftFieldChange('taskUsedtime', value)}
                readOnly={isReadonlyWorkHours}
                style={{ width: '100%' }}
              />

              <TextInput
                size="medium"
                id="report-editor-url"
                label="URL"
                value={draft.url}
                onChange={(value) => onDraftFieldChange('url', value)}
                style={{ width: '100%' }}
              />

              <Textarea
                id="report-editor-note"
                label="비고"
                value={draft.note}
                onChange={(value) => onDraftFieldChange('note', value)}
                rows={2}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ) : null}

        <div className="action-area">
          <Button
            size="medium"
            type="submit"
            variant="primary"
            disabled={isSaving || !isListDateValid}
          >
            {mode === 'edit' ? '수정 저장' : '업무 저장'}
          </Button>
          {mode === 'edit' ? (
            <Button size="medium" type="button" variant="secondary" onClick={onCancelEdit}>
              편집 취소
            </Button>
          ) : null}
        </div>
      </form>
    </PageSection>
  );
}

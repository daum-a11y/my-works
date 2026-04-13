import type { FormEvent, KeyboardEvent } from 'react';
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
          <button
            type="button"
            className="reports-page__button reports-page__button--secondary"
            onClick={onCancelEdit}
          >
            편집 취소
          </button>
        ) : null}
      </div>

      <form className="reports-page__form" onSubmit={onSubmit}>
        <div className="reports-page__step">
          <div className="reports-page__form-grid reports-page__form-grid--compact">
            <label className="reports-page__field">
              <span>청구그룹</span>
              <select
                value={draft.costGroupId}
                onChange={(event) => onDraftFieldChange('costGroupId', event.target.value)}
              >
                <option value="">
                  {costGroupOptions.length ? '선택' : '청구그룹이 없습니다.'}
                </option>
                {costGroupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            {showTypeStep ? (
              <>
                {projectTypeSelected ? (
                  <label className="reports-page__field reports-page__field--row-start">
                    <span>타입1</span>
                    <input value={type1Value} readOnly />
                  </label>
                ) : (
                  <label className="reports-page__field reports-page__field--row-start">
                    <span>타입1</span>
                    <select
                      value={draft.type1}
                      onChange={(event) => onDraftFieldChange('type1', event.target.value)}
                    >
                      <option value="">선택</option>
                      {type1Options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="reports-page__field">
                  <span>타입2</span>
                  <select
                    value={draft.type2}
                    onChange={(event) => onType2Change(event.target.value)}
                  >
                    {type2Placeholder ? <option value="">{type2Placeholder}</option> : null}
                    {type2Options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
                <input
                  value={projectQuery}
                  onChange={(event) => onProjectQueryChange(event.target.value)}
                  onKeyDown={onProjectSearchKeyDown}
                  placeholder="검색어 입력"
                />
              </label>

              <div className="reports-page__search-button-field">
                <span className="sr-only">프로젝트 검색</span>
                <button
                  type="button"
                  className="reports-page__button reports-page__button--secondary"
                  onClick={onProjectSearch}
                >
                  검색
                </button>
              </div>

              <label className="reports-page__field reports-page__field--project">
                <span>프로젝트</span>
                <select
                  value={draft.projectId}
                  onChange={(event) => onDraftFieldChange('projectId', event.target.value)}
                  disabled={!draft.costGroupId}
                >
                  <option value="">{projectSearchPlaceholder}</option>
                  {filteredProjectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {[project.project.platform, project.project.name].filter(Boolean).join(' - ')}
                    </option>
                  ))}
                </select>
              </label>

              {showSubtaskSelect ? (
                <label className="reports-page__field reports-page__field--project">
                  <span>태스크명</span>
                  <select
                    value={draft.subtaskId}
                    onChange={(event) => onDraftFieldChange('subtaskId', event.target.value)}
                  >
                    <option value="">
                      {draftSubtasks.length ? '선택' : '태스크이 존재하지 않습니다.'}
                    </option>
                    {draftSubtasks.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
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
                <input
                  value={draft.content}
                  onChange={(event) => onDraftFieldChange('content', event.target.value)}
                />
              </label>

              <label className="reports-page__field">
                <span>업무 시간(분)</span>
                <input
                  type="number"
                  min="0"
                  max="480"
                  step="1"
                  value={draft.taskUsedtime}
                  onChange={(event) => onDraftFieldChange('taskUsedtime', event.target.value)}
                  readOnly={isReadonlyWorkHours}
                />
              </label>

              <label className="reports-page__field">
                <span>URL</span>
                <input
                  value={draft.url}
                  onChange={(event) => onDraftFieldChange('url', event.target.value)}
                />
              </label>

              <label className="reports-page__field reports-page__field--note">
                <span>비고</span>
                <textarea
                  value={draft.note}
                  onChange={(event) => onDraftFieldChange('note', event.target.value)}
                  rows={2}
                />
              </label>
            </div>
          </div>
        ) : null}

        <div className="reports-page__action-row">
          <button
            type="submit"
            className="reports-page__button reports-page__button--primary"
            disabled={isSaving || !isListDateValid}
          >
            {mode === 'edit' ? '수정 저장' : '업무 저장'}
          </button>
          {mode === 'edit' ? (
            <button
              type="button"
              className="reports-page__button reports-page__button--secondary"
              onClick={onCancelEdit}
            >
              편집 취소
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

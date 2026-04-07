import type { FormEvent, KeyboardEvent } from 'react';
import type { CostGroup, Platform, ProjectPage } from '../../types/domain';
import type { ProjectViewModel, ReportDraft } from './reportUtils';

interface ReportsEditorFormProps {
  activeTab: 'report' | 'period';
  draft: ReportDraft;
  draftPages: ProjectPage[];
  costGroupOptions: CostGroup[];
  filteredProjectOptions: ProjectViewModel[];
  isSaving: boolean;
  isListDateValid: boolean;
  platformOptions: Platform[];
  projectQuery: string;
  reportTabType1Options: string[];
  type1Options: string[];
  type2Options: string[];
  type2Placeholder: string;
  type1Value: string;
  typeFilteredProjects: ProjectViewModel[];
  projectSearchPlaceholder: string;
  projectTypeSelected: boolean;
  isProjectLinkedTab: boolean;
  showPlatformSelect: boolean;
  showReadonlyService: boolean;
  showProjectSelect: boolean;
  showPageSelect: boolean;
  showPageUrl: boolean;
  showManualPageName: boolean;
  usesProjectLookup: boolean;
  isVacationType: boolean;
  isReadonlyWorkHours: boolean;
  manualPageLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onActiveTabChange: (tab: 'report' | 'period') => void;
  onDraftFieldChange: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  onProjectQueryChange: (value: string) => void;
  onProjectSearch: () => void;
  onProjectSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onType2Change: (value: string) => void;
  onVacationTypeChange: (value: string) => void;
}

export function ReportsEditorForm({
  activeTab,
  draft,
  draftPages,
  costGroupOptions,
  filteredProjectOptions,
  isSaving,
  isListDateValid,
  platformOptions,
  projectQuery,
  reportTabType1Options,
  type1Options,
  type2Options,
  type2Placeholder,
  type1Value,
  typeFilteredProjects,
  projectSearchPlaceholder,
  projectTypeSelected,
  isProjectLinkedTab,
  showPlatformSelect,
  showReadonlyService,
  showProjectSelect,
  showPageSelect,
  showPageUrl,
  showManualPageName,
  usesProjectLookup,
  isVacationType,
  isReadonlyWorkHours,
  manualPageLabel,
  onSubmit,
  onActiveTabChange,
  onDraftFieldChange,
  onProjectQueryChange,
  onProjectSearch,
  onProjectSearchKeyDown,
  onType2Change,
  onVacationTypeChange,
}: ReportsEditorFormProps) {
  return (
    <section className="reports-page__panel">
      <div className="reports-page__tab-row">
        <button
          type="button"
          className={[
            'reports-page__tab-button',
            activeTab === 'report' ? 'reports-page__tab-button--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onActiveTabChange('report')}
        >
          기본 입력
        </button>
        <button
          type="button"
          className={[
            'reports-page__tab-button',
            activeTab === 'period' ? 'reports-page__tab-button--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onActiveTabChange('period')}
        >
          TYPE 입력
        </button>
      </div>

      <form className="reports-page__form" onSubmit={onSubmit}>
        {activeTab === 'report' ? (
          <div className="reports-page__form-grid">
            <label className="reports-page__field">
              <span>청구그룹</span>
              <select
                value={draft.costGroupId}
                onChange={(event) => onDraftFieldChange('costGroupId', event.target.value)}
              >
                <option value="">
                  {costGroupOptions.length ? '선택하세요' : '청구그룹이 없습니다.'}
                </option>
                {costGroupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="reports-page__field">
              <span>프로젝트검색</span>
              <input
                value={projectQuery}
                onChange={(event) => onProjectQueryChange(event.target.value)}
                onKeyDown={onProjectSearchKeyDown}
                placeholder="검색어입력"
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

            <label className="reports-page__field">
              <span>프로젝트</span>
              <select
                value={draft.projectId}
                onChange={(event) => onDraftFieldChange('projectId', event.target.value)}
                disabled={!draft.costGroupId}
              >
                <option value="">{projectSearchPlaceholder}</option>
                {filteredProjectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {`${project.project.projectType1} - ${project.project.platform} - ${project.project.name}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <div className="reports-page__form-grid">
          {projectTypeSelected ? (
            <label className="reports-page__field">
              <span>타입1</span>
              <input value={type1Value} readOnly />
            </label>
          ) : (
            <label className="reports-page__field">
              <span>타입1</span>
              <select
                value={draft.type1}
                onChange={(event) => onDraftFieldChange('type1', event.target.value)}
              >
                <option value="">{isProjectLinkedTab ? '선택해주세요' : 'type1'}</option>
                {(isProjectLinkedTab ? reportTabType1Options : type1Options).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="reports-page__field">
            <span>타입2</span>
            <select value={draft.type2} onChange={(event) => onType2Change(event.target.value)}>
              {type2Placeholder ? <option value="">{type2Placeholder}</option> : null}
              {type2Options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {showPlatformSelect ? (
            <label className="reports-page__field">
              <span>플랫폼</span>
              <select
                value={draft.platform}
                onChange={(event) => onDraftFieldChange('platform', event.target.value)}
              >
                <option value="">선택하세요</option>
                {platformOptions
                  .filter((platform) => platform.isVisible || platform.name === draft.platform)
                  .map((platform) => (
                    <option key={platform.id} value={platform.name}>
                      {platform.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}

          {showReadonlyService ? (
            <>
              <label className="reports-page__field">
                <span>청구그룹</span>
                <input value={draft.costGroupName} readOnly />
              </label>
              <label className="reports-page__field">
                <span>서비스 그룹</span>
                <input value={draft.serviceGroupName} readOnly />
              </label>
              <label className="reports-page__field">
                <span>서비스 명</span>
                <input value={draft.serviceName} readOnly />
              </label>
            </>
          ) : null}

          {showProjectSelect && !isProjectLinkedTab ? (
            <label className="reports-page__field">
              <span>프로젝트</span>
              <select
                value={draft.projectId}
                onChange={(event) => onDraftFieldChange('projectId', event.target.value)}
                disabled={!draft.costGroupId}
              >
                <option value="">
                  {typeFilteredProjects.length ? '선택하세요' : '프로젝트가 존재하지 않습니다.'}
                </option>
                {typeFilteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showPageSelect ? (
            <label className="reports-page__field">
              <span>{isProjectLinkedTab ? '페이지명' : '프로젝트 페이지'}</span>
              <select
                value={draft.pageId}
                onChange={(event) => onDraftFieldChange('pageId', event.target.value)}
              >
                <option value="">
                  {draftPages.length ? '선택하세요' : '페이지가 존재하지 않습니다.'}
                </option>
                {draftPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showManualPageName ? (
            <label className="reports-page__field">
              <span>{manualPageLabel}</span>
              {isVacationType ? (
                <select
                  value={draft.manualPageName}
                  onChange={(event) => onVacationTypeChange(event.target.value)}
                >
                  <option value="">선택하세요</option>
                  <option value="오전 반차">오전 반차</option>
                  <option value="오후 반차">오후 반차</option>
                  <option value="전일 휴가">전일 휴가</option>
                </select>
              ) : (
                <input
                  value={draft.manualPageName}
                  onChange={(event) => onDraftFieldChange('manualPageName', event.target.value)}
                  placeholder={manualPageLabel}
                />
              )}
            </label>
          ) : null}

          {showPageUrl ? (
            <label className="reports-page__field">
              <span>{showPageSelect ? '페이지 URL' : 'URL'}</span>
              <input
                value={draft.pageUrl}
                onChange={(event) => onDraftFieldChange('pageUrl', event.target.value)}
                readOnly={isProjectLinkedTab || usesProjectLookup}
              />
            </label>
          ) : null}

          <label className="reports-page__field">
            <span>총시간</span>
            <input
              type="number"
              min="0"
              step="1"
              value={draft.taskUsedtime}
              onChange={(event) => onDraftFieldChange('taskUsedtime', event.target.value)}
              readOnly={isReadonlyWorkHours}
            />
          </label>
        </div>

        <label className="reports-page__field">
          <span>비고</span>
          <textarea
            value={draft.note}
            onChange={(event) => onDraftFieldChange('note', event.target.value)}
            rows={2}
          />
        </label>

        <div className="reports-page__action-row">
          <button
            type="submit"
            className="reports-page__button reports-page__button--primary"
            disabled={isSaving || !isListDateValid}
          >
            업무저장
          </button>
        </div>
      </form>
    </section>
  );
}

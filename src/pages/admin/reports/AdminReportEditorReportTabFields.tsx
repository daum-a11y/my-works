import type { KeyboardEvent } from 'react';
import type { ReportDraft, ProjectViewModel } from '../../reports/reportUtils';

interface AdminReportEditorReportTabFieldsProps {
  draft: ReportDraft;
  costGroups: Array<{ id: string; name: string }>;
  projectQuery: string;
  projectSearchPlaceholder: string;
  filteredProjectOptions: ProjectViewModel[];
  onCostGroupChange: (value: string) => void;
  onProjectQueryChange: (value: string) => void;
  onProjectSearch: () => void;
  onProjectSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onProjectChange: (value: string) => void;
}

export function AdminReportEditorReportTabFields({
  draft,
  costGroups,
  projectQuery,
  projectSearchPlaceholder,
  filteredProjectOptions,
  onCostGroupChange,
  onProjectQueryChange,
  onProjectSearch,
  onProjectSearchKeyDown,
  onProjectChange,
}: AdminReportEditorReportTabFieldsProps) {
  return (
    <div className={'reports-page__form-grid'}>
      <label className={'reports-page__field'}>
        <span>청구그룹</span>
        <select
          value={draft.costGroupId}
          onChange={(event) => onCostGroupChange(event.target.value)}
        >
          <option value="">{costGroups.length ? '선택하세요' : '청구그룹이 없습니다.'}</option>
          {costGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <label className={'reports-page__field'}>
        <span>프로젝트검색</span>
        <input
          value={projectQuery}
          onChange={(event) => onProjectQueryChange(event.target.value)}
          onKeyDown={onProjectSearchKeyDown}
          placeholder="검색어입력"
        />
      </label>

      <div className={'reports-page__search-button-field'}>
        <span className={'sr-only'}>프로젝트 검색</span>
        <button
          type="button"
          className={'reports-page__button reports-page__button--secondary'}
          onClick={onProjectSearch}
        >
          검색
        </button>
      </div>

      <label className={'reports-page__field'}>
        <span>프로젝트</span>
        <select
          value={draft.projectId}
          onChange={(event) => onProjectChange(event.target.value)}
          disabled={!draft.costGroupId}
        >
          <option value="">{projectSearchPlaceholder}</option>
          {filteredProjectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {`${project.project.taskType1} - ${project.project.platform} - ${project.project.name}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

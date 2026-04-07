import type { ReportDraft, ProjectViewModel } from '../../reports/reportUtils';

interface AdminReportEditorTargetFieldsProps {
  draft: ReportDraft;
  isProjectLinkedTab: boolean;
  showProjectSelect: boolean;
  typeFilteredProjects: ProjectViewModel[];
  showPageSelect: boolean;
  draftPages: Array<{ id: string; title: string }>;
  showManualPageName: boolean;
  manualPageLabel: string;
  isVacationType: boolean;
  showPageUrl: boolean;
  usesProjectLookup: boolean;
  isReadonlyWorkHours: boolean;
  onProjectChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onManualPageNameChange: (value: string) => void;
  onVacationTypeChange: (value: string) => void;
  onPageUrlChange: (value: string) => void;
  onTaskUsedtimeChange: (value: string) => void;
}

export function AdminReportEditorTargetFields({
  draft,
  isProjectLinkedTab,
  showProjectSelect,
  typeFilteredProjects,
  showPageSelect,
  draftPages,
  showManualPageName,
  manualPageLabel,
  isVacationType,
  showPageUrl,
  usesProjectLookup,
  isReadonlyWorkHours,
  onProjectChange,
  onPageChange,
  onManualPageNameChange,
  onVacationTypeChange,
  onPageUrlChange,
  onTaskUsedtimeChange,
}: AdminReportEditorTargetFieldsProps) {
  return (
    <>
      {showProjectSelect && !isProjectLinkedTab ? (
        <label className={'reports-page__field'}>
          <span>프로젝트</span>
          <select
            value={draft.projectId}
            onChange={(event) => onProjectChange(event.target.value)}
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
        <label className={'reports-page__field'}>
          <span>{isProjectLinkedTab ? '페이지명' : '프로젝트 페이지'}</span>
          <select value={draft.pageId} onChange={(event) => onPageChange(event.target.value)}>
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
        <label className={'reports-page__field'}>
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
              onChange={(event) => onManualPageNameChange(event.target.value)}
              placeholder={manualPageLabel}
            />
          )}
        </label>
      ) : null}

      {showPageUrl ? (
        <label className={'reports-page__field'}>
          <span>{showPageSelect ? '페이지 URL' : 'URL'}</span>
          <input
            value={draft.pageUrl}
            onChange={(event) => onPageUrlChange(event.target.value)}
            readOnly={isProjectLinkedTab || usesProjectLookup}
          />
        </label>
      ) : null}

      <label className={'reports-page__field'}>
        <span>총시간</span>
        <input
          type="number"
          min="0"
          step="1"
          value={draft.taskUsedtime}
          onChange={(event) => onTaskUsedtimeChange(event.target.value)}
          readOnly={isReadonlyWorkHours}
        />
      </label>
    </>
  );
}

import type { ReportDraft, ProjectViewModel } from '../../reports/reportUtils';

interface AdminReportEditorTargetFieldsProps {
  draft: ReportDraft;
  isProjectLinkedTab: boolean;
  showProjectSelect: boolean;
  typeFilteredProjects: ProjectViewModel[];
  showSubtaskSelect: boolean;
  draftSubtasks: Array<{ id: string; title: string }>;
  showManualSubtaskName: boolean;
  manualSubtaskLabel: string;
  isVacationType: boolean;
  isReadonlyWorkHours: boolean;
  onProjectChange: (value: string) => void;
  onSubtaskChange: (value: string) => void;
  onManualSubtaskNameChange: (value: string) => void;
  onVacationTypeChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onTaskUsedtimeChange: (value: string) => void;
}

export function AdminReportEditorTargetFields({
  draft,
  isProjectLinkedTab,
  showProjectSelect,
  typeFilteredProjects,
  showSubtaskSelect,
  draftSubtasks,
  showManualSubtaskName,
  manualSubtaskLabel,
  isVacationType,
  isReadonlyWorkHours,
  onProjectChange,
  onSubtaskChange,
  onManualSubtaskNameChange,
  onVacationTypeChange,
  onUrlChange,
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
              {typeFilteredProjects.length ? '선택' : '프로젝트가 존재하지 않습니다.'}
            </option>
            {typeFilteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showSubtaskSelect ? (
        <label className={'reports-page__field'}>
          <span>{isProjectLinkedTab ? '태스크명' : '프로젝트 태스크'}</span>
          <select value={draft.subtaskId} onChange={(event) => onSubtaskChange(event.target.value)}>
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

      {showManualSubtaskName ? (
        <label className={'reports-page__field'}>
          <span>{manualSubtaskLabel}</span>
          {isVacationType ? (
            <select
              value={draft.manualSubtaskName}
              onChange={(event) => onVacationTypeChange(event.target.value)}
            >
              <option value="">선택</option>
              <option value="오전 반차">오전 반차</option>
              <option value="오후 반차">오후 반차</option>
              <option value="전일 휴가">전일 휴가</option>
            </select>
          ) : (
            <input
              value={draft.manualSubtaskName}
              onChange={(event) => onManualSubtaskNameChange(event.target.value)}
              placeholder={manualSubtaskLabel}
            />
          )}
        </label>
      ) : null}

      <label className={'reports-page__field'}>
        <span>URL</span>
        <input value={draft.url} onChange={(event) => onUrlChange(event.target.value)} />
      </label>

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

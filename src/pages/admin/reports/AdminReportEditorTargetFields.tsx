import type { CSSProperties } from 'react';
import type { ReportDraft, ProjectViewModel } from '../../reports/reportUtils';
import { Select, TextInput } from 'krds-react';

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

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
    <div style={gridStyle}>
      {showProjectSelect && !isProjectLinkedTab ? (
        <Select
          id="admin-report-editor-target-project"
          label="프로젝트"
          value={draft.projectId}
          onChange={onProjectChange}
          disabled={!draft.costGroupId}
          options={[
            {
              value: '',
              label: typeFilteredProjects.length ? '선택' : '프로젝트가 존재하지 않습니다.',
            },
            ...typeFilteredProjects.map((project) => ({
              value: project.id,
              label: project.project.name,
            })),
          ]}
          style={{ width: '100%' }}
        />
      ) : null}

      {showSubtaskSelect ? (
        <Select
          id="admin-report-editor-target-subtask"
          label={isProjectLinkedTab ? '태스크명' : '프로젝트 태스크'}
          value={draft.subtaskId}
          onChange={onSubtaskChange}
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

      {showManualSubtaskName ? (
        isVacationType ? (
          <Select
            id="admin-report-editor-vacation-type"
            label={manualSubtaskLabel}
            value={draft.manualSubtaskName}
            onChange={onVacationTypeChange}
            options={[
              { value: '', label: '선택' },
              { value: '오전 반차', label: '오전 반차' },
              { value: '오후 반차', label: '오후 반차' },
              { value: '전일 휴가', label: '전일 휴가' },
            ]}
            style={{ width: '100%' }}
          />
        ) : (
          <TextInput
            label={manualSubtaskLabel}
            value={draft.manualSubtaskName}
            onChange={onManualSubtaskNameChange}
            placeholder={manualSubtaskLabel}
            style={{ width: '100%' }}
          />
        )
      ) : null}

      <TextInput label="URL" value={draft.url} onChange={onUrlChange} style={{ width: '100%' }} />

      <TextInput
        label="총시간"
        type="number"
        min="0"
        step="1"
        value={draft.taskUsedtime}
        onChange={onTaskUsedtimeChange}
        readOnly={isReadonlyWorkHours}
        style={{ width: '100%' }}
      />
    </div>
  );
}

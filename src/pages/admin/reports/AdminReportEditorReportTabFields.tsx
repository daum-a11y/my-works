import type { CSSProperties, KeyboardEvent } from 'react';
import { Button, Select, TextInput } from 'krds-react';
import type { ReportDraft, ProjectViewModel } from '../../reports/reportUtils';

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const searchRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'flex-end',
};

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
    <div className={'reports-page__form-grid'} style={gridStyle}>
      <Select
        label="청구그룹"
        value={draft.costGroupId}
        onChange={onCostGroupChange}
        options={[
          {
            value: '',
            label: costGroups.length ? '선택' : '청구그룹이 없습니다.',
          },
          ...costGroups.map((group) => ({ value: group.id, label: group.name })),
        ]}
        style={{ width: '100%' }}
      />

      <div style={searchRowStyle}>
        <TextInput
          label="프로젝트검색"
          value={projectQuery}
          onChange={onProjectQueryChange}
          onKeyDown={onProjectSearchKeyDown}
          placeholder="검색어입력"
          style={{ width: '100%', flex: '1 1 0' }}
        />
        <Button type="button" variant="secondary" onClick={onProjectSearch}>
          검색
        </Button>
      </div>

      <Select
        label="프로젝트"
        value={draft.projectId}
        onChange={onProjectChange}
        disabled={!draft.costGroupId}
        options={[
          { value: '', label: projectSearchPlaceholder },
          ...filteredProjectOptions.map((project) => ({
            value: project.id,
            label: `${project.project.taskType1} - ${project.project.platform} - ${project.project.name}`,
          })),
        ]}
        style={{ width: '100%' }}
      />
    </div>
  );
}

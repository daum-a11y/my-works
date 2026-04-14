import type { CSSProperties } from 'react';
import type { ReportDraft } from '../../reports/reportUtils';
import { Select, TextInput } from 'krds-react';

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

interface AdminReportEditorTypeFieldsProps {
  draft: ReportDraft;
  isProjectLinkedTab: boolean;
  projectTypeSelected: boolean;
  type1Value: string;
  reportTabType1Options: string[];
  type1Options: string[];
  type2Options: string[];
  type2Placeholder: string;
  onType1Change: (value: string) => void;
  onType2Change: (value: string) => void;
}

export function AdminReportEditorTypeFields({
  draft,
  isProjectLinkedTab,
  projectTypeSelected,
  type1Value,
  reportTabType1Options,
  type1Options,
  type2Options,
  type2Placeholder,
  onType1Change,
  onType2Change,
}: AdminReportEditorTypeFieldsProps) {
  return (
    <div style={gridStyle}>
      {projectTypeSelected ? (
        <TextInput
          size="medium"
          id="admin-report-editor-type1-readonly"
          label="타입1"
          value={type1Value}
          readOnly
          style={{ width: '100%' }}
        />
      ) : (
        <Select
          size="medium"
          id="admin-report-editor-type1"
          label="타입1"
          value={draft.type1}
          onChange={onType1Change}
          options={[
            {
              value: '',
              label: isProjectLinkedTab ? '선택해주세요' : 'type1',
            },
            ...(isProjectLinkedTab ? reportTabType1Options : type1Options).map((option) => ({
              value: option,
              label: option,
            })),
          ]}
          style={{ width: '100%' }}
        />
      )}

      <Select
        size="medium"
        id="admin-report-editor-type2"
        label="타입2"
        value={draft.type2}
        onChange={onType2Change}
        options={[
          ...(type2Placeholder ? [{ value: '', label: type2Placeholder }] : []),
          ...type2Options.map((option) => ({ value: option, label: option })),
        ]}
        style={{ width: '100%' }}
      />
    </div>
  );
}

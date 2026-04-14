import type { CSSProperties } from 'react';
import type { ReportDraft } from '../../reports/reportUtils';
import { Select, TextInput } from 'krds-react';

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

interface AdminReportEditorServiceFieldsProps {
  draft: ReportDraft;
  showPlatformSelect: boolean;
  platforms: Array<{ id: string; name: string; isVisible: boolean }>;
  showReadonlyService: boolean;
  onPlatformChange: (value: string) => void;
}

export function AdminReportEditorServiceFields({
  draft,
  showPlatformSelect,
  platforms,
  showReadonlyService,
  onPlatformChange,
}: AdminReportEditorServiceFieldsProps) {
  return (
    <div style={gridStyle}>
      {showPlatformSelect ? (
        <Select
          id="admin-report-editor-platform"
          label="플랫폼"
          value={draft.platform}
          onChange={onPlatformChange}
          options={[
            { value: '', label: '선택' },
            ...platforms
              .filter((platform) => platform.isVisible || platform.name === draft.platform)
              .map((platform) => ({ value: platform.name, label: platform.name })),
          ]}
          style={{ width: '100%' }}
        />
      ) : null}

      {showReadonlyService ? (
        <>
          <TextInput label="청구그룹" value={draft.costGroupName} readOnly style={{ width: '100%' }} />
          <TextInput
            label="서비스 그룹"
            value={draft.serviceGroupName}
            readOnly
            style={{ width: '100%' }}
          />
          <TextInput label="서비스 명" value={draft.serviceName} readOnly style={{ width: '100%' }} />
        </>
      ) : null}
    </div>
  );
}

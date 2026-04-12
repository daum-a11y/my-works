import type { ReportDraft } from '../../reports/reportUtils';

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
    <>
      {showPlatformSelect ? (
        <label className={'reports-page__field'}>
          <span>플랫폼</span>
          <select value={draft.platform} onChange={(event) => onPlatformChange(event.target.value)}>
            <option value="">선택</option>
            {platforms
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
          <label className={'reports-page__field'}>
            <span>청구그룹</span>
            <input value={draft.costGroupName} readOnly />
          </label>
          <label className={'reports-page__field'}>
            <span>서비스 그룹</span>
            <input value={draft.serviceGroupName} readOnly />
          </label>
          <label className={'reports-page__field'}>
            <span>서비스 명</span>
            <input value={draft.serviceName} readOnly />
          </label>
        </>
      ) : null}
    </>
  );
}

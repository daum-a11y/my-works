import type { ReportDraft, ProjectViewModel } from '../../reports/reportUtils';
import { AdminReportEditorServiceFields } from './AdminReportEditorServiceFields';
import { AdminReportEditorTargetFields } from './AdminReportEditorTargetFields';
import { AdminReportEditorTypeFields } from './AdminReportEditorTypeFields';

interface AdminReportEditorDetailFieldsProps {
  draft: ReportDraft;
  isProjectLinkedTab: boolean;
  projectTypeSelected: boolean;
  type1Value: string;
  reportTabType1Options: string[];
  type1Options: string[];
  type2Options: string[];
  type2Placeholder: string;
  showPlatformSelect: boolean;
  platforms: Array<{ id: string; name: string; isVisible: boolean }>;
  showReadonlyService: boolean;
  showProjectSelect: boolean;
  typeFilteredProjects: ProjectViewModel[];
  showPageSelect: boolean;
  draftPages: Array<{ id: string; title: string }>;
  showManualPageName: boolean;
  manualPageLabel: string;
  isVacationType: boolean;
  isReadonlyWorkHours: boolean;
  onType1Change: (value: string) => void;
  onType2Change: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onManualPageNameChange: (value: string) => void;
  onVacationTypeChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onTaskUsedtimeChange: (value: string) => void;
}

export function AdminReportEditorDetailFields({
  draft,
  isProjectLinkedTab,
  projectTypeSelected,
  type1Value,
  reportTabType1Options,
  type1Options,
  type2Options,
  type2Placeholder,
  showPlatformSelect,
  platforms,
  showReadonlyService,
  showProjectSelect,
  typeFilteredProjects,
  showPageSelect,
  draftPages,
  showManualPageName,
  manualPageLabel,
  isVacationType,
  isReadonlyWorkHours,
  onType1Change,
  onType2Change,
  onPlatformChange,
  onProjectChange,
  onPageChange,
  onManualPageNameChange,
  onVacationTypeChange,
  onUrlChange,
  onTaskUsedtimeChange,
}: AdminReportEditorDetailFieldsProps) {
  return (
    <div className={'reports-page__form-grid'}>
      <AdminReportEditorTypeFields
        draft={draft}
        isProjectLinkedTab={isProjectLinkedTab}
        projectTypeSelected={projectTypeSelected}
        type1Value={type1Value}
        reportTabType1Options={reportTabType1Options}
        type1Options={type1Options}
        type2Options={type2Options}
        type2Placeholder={type2Placeholder}
        onType1Change={onType1Change}
        onType2Change={onType2Change}
      />

      <AdminReportEditorServiceFields
        draft={draft}
        showPlatformSelect={showPlatformSelect}
        platforms={platforms}
        showReadonlyService={showReadonlyService}
        onPlatformChange={onPlatformChange}
      />

      <AdminReportEditorTargetFields
        draft={draft}
        isProjectLinkedTab={isProjectLinkedTab}
        showProjectSelect={showProjectSelect}
        typeFilteredProjects={typeFilteredProjects}
        showPageSelect={showPageSelect}
        draftPages={draftPages}
        showManualPageName={showManualPageName}
        manualPageLabel={manualPageLabel}
        isVacationType={isVacationType}
        isReadonlyWorkHours={isReadonlyWorkHours}
        onProjectChange={onProjectChange}
        onPageChange={onPageChange}
        onManualPageNameChange={onManualPageNameChange}
        onVacationTypeChange={onVacationTypeChange}
        onUrlChange={onUrlChange}
        onTaskUsedtimeChange={onTaskUsedtimeChange}
      />
    </div>
  );
}

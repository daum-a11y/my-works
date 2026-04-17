import type { FormEvent, KeyboardEvent } from 'react';
import { CriticalAlert, Spinner, Tab, TabList, TabTrigger, Textarea } from 'krds-react';
import type { Platform, ProjectSubtask } from '../../../types/domain';
import type { ProjectViewModel, ReportDraft } from '../../reports/reportUtils';
import { getTodayInputValue } from '../../reports/reportUtils';
import { AdminReportEditorActionRow } from './AdminReportEditorActionRow';
import { AdminReportEditorBasicFields } from './AdminReportEditorBasicFields';
import { AdminReportEditorDetailFields } from './AdminReportEditorDetailFields';
import { AdminReportEditorReportTabFields } from './AdminReportEditorReportTabFields';
import { AdminReportEditorStatus } from './AdminReportEditorStatus';
import type { AdminReportEditorTab } from './AdminReportEditorPage.types';
import type { MemberAdminItem } from '../admin.types';
import { PageSection } from '../../../components/shared';

interface AdminReportEditorFormProps {
  isEdit: boolean;
  activeTab: AdminReportEditorTab;
  draft: ReportDraft;
  members: MemberAdminItem[];
  selectedMemberId: string;
  loading: boolean;
  queryError: string;
  statusMessage: string;
  missingEditTarget: boolean;
  currentMember: MemberAdminItem | null;
  costGroups: Array<{ id: string; name: string }>;
  filteredProjectOptions: ProjectViewModel[];
  platforms: Platform[];
  draftSubtasks: ProjectSubtask[];
  projectQuery: string;
  projectSearchPlaceholder: string;
  isProjectLinkedTab: boolean;
  projectTypeSelected: boolean;
  type1Value: string;
  reportTabType1Options: string[];
  type1Options: string[];
  type2Options: string[];
  type2Placeholder: string;
  showPlatformSelect: boolean;
  showReadonlyService: boolean;
  showProjectSelect: boolean;
  typeFilteredProjects: ProjectViewModel[];
  showSubtaskSelect: boolean;
  showManualSubtaskName: boolean;
  manualSubtaskLabel: string;
  isVacationType: boolean;
  isReadonlyWorkHours: boolean;
  savePending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTabChange: (tab: AdminReportEditorTab) => void;
  onMemberChange: (value: string) => void;
  onReportDateChange: (value: string) => void;
  onCostGroupChange: (value: string) => void;
  onProjectQueryChange: (value: string) => void;
  onProjectSearch: () => void;
  onProjectSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onProjectChange: (value: string) => void;
  onType1Change: (value: string) => void;
  onType2Change: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onSubtaskChange: (value: string) => void;
  onManualSubtaskNameChange: (value: string) => void;
  onVacationTypeChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onTaskUsedtimeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCancel: () => void;
  onDateShift: (nextDate: string) => void;
  formatCompactDate: (value: string, mode: 'short' | 'long') => string;
  parseCompactDate: (value: string, mode: 'short' | 'long') => string;
}

export function AdminReportEditorForm({
  isEdit,
  activeTab,
  draft,
  members,
  selectedMemberId,
  loading,
  queryError,
  statusMessage,
  missingEditTarget,
  currentMember,
  costGroups,
  filteredProjectOptions,
  platforms,
  draftSubtasks,
  projectQuery,
  projectSearchPlaceholder,
  isProjectLinkedTab,
  projectTypeSelected,
  type1Value,
  reportTabType1Options,
  type1Options,
  type2Options,
  type2Placeholder,
  showPlatformSelect,
  showReadonlyService,
  showProjectSelect,
  typeFilteredProjects,
  showSubtaskSelect,
  showManualSubtaskName,
  manualSubtaskLabel,
  isVacationType,
  isReadonlyWorkHours,
  savePending,
  onSubmit,
  onTabChange,
  onMemberChange,
  onReportDateChange,
  onCostGroupChange,
  onProjectQueryChange,
  onProjectSearch,
  onProjectSearchKeyDown,
  onProjectChange,
  onType1Change,
  onType2Change,
  onPlatformChange,
  onSubtaskChange,
  onManualSubtaskNameChange,
  onVacationTypeChange,
  onUrlChange,
  onTaskUsedtimeChange,
  onNoteChange,
  onCancel,
  onDateShift,
  formatCompactDate,
  parseCompactDate,
}: AdminReportEditorFormProps) {
  return (
    <PageSection
      className={'content-panel form-panel'}
      title="업무 입력"
      description={<p className={'date-text'}>{draft.reportDate || getTodayInputValue()}</p>}
      actions={
        <Tab
          value={activeTab}
          onValueChange={(value) => onTabChange(value as AdminReportEditorTab)}
        >
          <TabList aria-label="업무보고 입력 탭">
            <TabTrigger value="report">기본 입력</TabTrigger>
            <TabTrigger value="period">TYPE 입력</TabTrigger>
          </TabList>
        </Tab>
      }
    >
      <AdminReportEditorStatus
        queryError={queryError}
        statusMessage={statusMessage}
        isMissingEditTarget={missingEditTarget}
      />

      {loading && !missingEditTarget ? (
        <div className="global-loading-spinner" aria-label="로딩 중" role="status">
          <Spinner />
        </div>
      ) : null}

      {!loading && !missingEditTarget ? (
        <form className={'krds-form form-layout'} onSubmit={onSubmit}>
          <AdminReportEditorBasicFields
            isEdit={isEdit}
            members={members}
            selectedMemberId={selectedMemberId}
            draft={draft}
            onMemberChange={onMemberChange}
            onReportDateChange={onReportDateChange}
            formatCompactDate={formatCompactDate}
            parseCompactDate={parseCompactDate}
          />

          {activeTab === 'report' ? (
            <AdminReportEditorReportTabFields
              draft={draft}
              costGroups={costGroups}
              projectQuery={projectQuery}
              projectSearchPlaceholder={projectSearchPlaceholder}
              filteredProjectOptions={filteredProjectOptions}
              onCostGroupChange={onCostGroupChange}
              onProjectQueryChange={onProjectQueryChange}
              onProjectSearch={onProjectSearch}
              onProjectSearchKeyDown={onProjectSearchKeyDown}
              onProjectChange={onProjectChange}
            />
          ) : null}

          <AdminReportEditorDetailFields
            draft={draft}
            isProjectLinkedTab={isProjectLinkedTab}
            projectTypeSelected={projectTypeSelected}
            type1Value={type1Value}
            reportTabType1Options={reportTabType1Options}
            type1Options={type1Options}
            type2Options={type2Options}
            type2Placeholder={type2Placeholder}
            showPlatformSelect={showPlatformSelect}
            platforms={platforms}
            showReadonlyService={showReadonlyService}
            showProjectSelect={showProjectSelect}
            typeFilteredProjects={typeFilteredProjects}
            showSubtaskSelect={showSubtaskSelect}
            draftSubtasks={draftSubtasks}
            showManualSubtaskName={showManualSubtaskName}
            manualSubtaskLabel={manualSubtaskLabel}
            isVacationType={isVacationType}
            isReadonlyWorkHours={isReadonlyWorkHours}
            onType1Change={onType1Change}
            onType2Change={onType2Change}
            onPlatformChange={onPlatformChange}
            onProjectChange={onProjectChange}
            onSubtaskChange={onSubtaskChange}
            onManualSubtaskNameChange={onManualSubtaskNameChange}
            onVacationTypeChange={onVacationTypeChange}
            onUrlChange={onUrlChange}
            onTaskUsedtimeChange={onTaskUsedtimeChange}
          />

          <Textarea
            id="admin-report-editor-note"
            label="비고"
            value={draft.note}
            onChange={onNoteChange}
            rows={2}
            style={{ width: '100%' }}
          />

          {isEdit && currentMember ? (
            <CriticalAlert
              alerts={[
                {
                  variant: 'info',
                  message: `사용자: ${currentMember.accountId} (${currentMember.name})`,
                },
              ]}
            />
          ) : null}

          <AdminReportEditorActionRow
            draft={draft}
            disabled={savePending}
            onCancel={onCancel}
            onDateChange={onDateShift}
          />
        </form>
      ) : null}
    </PageSection>
  );
}

import { useEffect, useMemo, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../router/navigation';
import { getTaskTypeUiRule } from '../../utils/taskType';
import { ReportsDateNavigator } from './ReportsDateNavigator';
import { ReportsEditorForm } from './ReportsEditorForm';
import {
  buildSelectableTaskType1Options,
  buildTaskType2OptionsForValue,
  getTodayInputValue,
  shiftDateInput,
} from './reportUtils';
import { ReportsResultsTable } from './ReportsResultsTable';
import { normalizeDateForInput } from './ReportsPage.utils';
import { useReportsSlice } from './useReportsSlice';
import '../../styles/pages/ReportsPage.scss';

export function ReportsPage() {
  useEffect(() => {
    setDocumentTitle('업무보고');
  }, []);

  const location = useLocation();
  const appliedDashboardDateRef = useRef('');
  const {
    activeTab,
    draft,
    draftPages,
    costGroupOptions,
    filteredProjectOptions,
    projectOptions,
    applyProjectQuery,
    dailyReports,
    isSaving,
    saveDraft,
    saveOverheadReport,
    deleteDraft,
    selectReport,
    selectedDate,
    selectedReport,
    selectedReportId,
    setDraftField,
    setActiveTab,
    setSelectedDate,
    setProjectQuery,
    projectQuery,
    statusMessage,
    taskTypes,
    platformOptions,
    type1Options,
    type2Options,
    canEditReports,
  } = useReportsSlice();
  const todayInputValue = getTodayInputValue();
  const reportDateFromDashboard =
    typeof location.state === 'object' && location.state && 'reportDate' in location.state
      ? String((location.state as { reportDate?: unknown }).reportDate ?? '')
      : '';

  useEffect(() => {
    if (!reportDateFromDashboard || appliedDashboardDateRef.current === reportDateFromDashboard) {
      return;
    }

    const normalizedDate = normalizeDateForInput(reportDateFromDashboard);
    if (!normalizedDate) {
      return;
    }

    appliedDashboardDateRef.current = reportDateFromDashboard;
    setActiveTab('report');
    setDraftField('reportDate', normalizedDate);
  }, [reportDateFromDashboard, setActiveTab, setDraftField]);
  const currentProject = useMemo(
    () =>
      filteredProjectOptions.find((project) => project.id === draft.projectId) ??
      (projectOptions ?? []).find((project) => project.id === draft.projectId) ??
      null,
    [draft.projectId, filteredProjectOptions, projectOptions],
  );
  const selectedTaskType = useMemo(
    () =>
      taskTypes.find(
        (taskType) => taskType.type1 === draft.type1 && taskType.type2 === draft.type2,
      ) ?? null,
    [draft.type1, draft.type2, taskTypes],
  );
  const reportTabType1Options = useMemo(() => {
    const preferredOrder = ['민원', '데이터버퍼', '일반버퍼', '교육', '기타버퍼', '휴무'];
    const available = preferredOrder.filter((type1) =>
      buildSelectableTaskType1Options(taskTypes, draft.type1).includes(type1),
    );
    return available.length ? available : type1Options;
  }, [draft.type1, taskTypes, type1Options]);
  const isProjectLinkedTab = activeTab === 'report';
  const projectTypeSelected = isProjectLinkedTab && Boolean(draft.projectId);
  const type1Value = projectTypeSelected
    ? currentProject?.project.projectType1 || draft.type1
    : draft.type1;
  const requiresServiceGroup = selectedTaskType?.requiresServiceGroup ?? false;
  const typeRule = useMemo(() => getTaskTypeUiRule(type1Value, taskTypes), [taskTypes, type1Value]);
  const usesProjectLookup = typeRule.projectLinked;
  const usesManualPageWithUrl = typeRule.manualPageWithUrl;
  const usesManualPageOnly = typeRule.manualPageOnly;
  const showPlatformSelect = !projectTypeSelected && usesProjectLookup;
  const showReadonlyService = projectTypeSelected || usesProjectLookup;
  const showProjectSelect = isProjectLinkedTab || usesProjectLookup;
  const isVacationType = typeRule.vacation;
  const isFixedDayType = false;
  const showProjectLinkedPageSelect = projectTypeSelected && typeRule.projectPageSelectable;
  const showProjectLinkedPageUrl = projectTypeSelected && requiresServiceGroup;
  const showPageSelect = isProjectLinkedTab
    ? showProjectLinkedPageSelect
    : Boolean(draft.projectId) && typeRule.projectPageSelectable;
  const showPageUrl = isProjectLinkedTab
    ? showProjectLinkedPageUrl
    : usesProjectLookup || usesManualPageWithUrl || (requiresServiceGroup && !showPageSelect);
  const showManualPageName = isProjectLinkedTab
    ? (projectTypeSelected && typeRule.projectLinked && !typeRule.projectPageSelectable) ||
      isVacationType
    : usesManualPageWithUrl || usesManualPageOnly || isVacationType;
  const isReadonlyWorkHours = isVacationType || isFixedDayType;
  const manualPageLabel = useMemo(() => {
    if (isVacationType) {
      return '휴가 종류';
    }
    if ((typeRule.projectLinked && !typeRule.projectPageSelectable) || usesManualPageOnly) {
      return '페이지명';
    }
    return '페이지명 & 내용';
  }, [isVacationType, typeRule.projectLinked, typeRule.projectPageSelectable, usesManualPageOnly]);
  const typeFilteredProjects = useMemo(() => {
    if (!draft.platform || !draft.type1 || !draft.costGroupId) {
      return [] as typeof filteredProjectOptions;
    }

    return filteredProjectOptions.filter(
      (project) =>
        project.costGroupId === draft.costGroupId &&
        project.project.platform === draft.platform &&
        project.project.projectType1 === draft.type1,
    );
  }, [draft.costGroupId, draft.platform, draft.type1, filteredProjectOptions]);
  const projectSearchPlaceholder = useMemo(() => {
    if (!draft.costGroupId) {
      return '청구그룹을 먼저 선택하세요';
    }
    if (!projectQuery.trim()) {
      return '선택하세요';
    }
    if (!filteredProjectOptions.length) {
      return '검색 결과가 없습니다.';
    }
    return `${projectQuery} 로 검색되었습니다. 목록을 선택하세요`;
  }, [draft.costGroupId, filteredProjectOptions.length, projectQuery]);
  const type2Placeholder = useMemo(() => {
    if (isProjectLinkedTab) {
      return '선택하세요';
    }
    if (draft.type1 === '휴무') {
      return '선택하세요';
    }
    if (!type2Options.length) {
      return '타입2가 존재하지 않습니다.';
    }
    return '';
  }, [draft.type1, isProjectLinkedTab, type2Options.length]);
  const currentListDateText = useMemo(() => {
    const value = selectedDate || todayInputValue;
    return value ? value.slice(0, 10) : '';
  }, [selectedDate, todayInputValue]);
  const currentListDateValue = useMemo(
    () => selectedDate || todayInputValue,
    [selectedDate, todayInputValue],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveDraft(currentListDateValue);
  };

  const handleType2Change = (nextType2: string) => {
    const previousWasVacation = draft.type1 === '휴무';
    setDraftField('type2', nextType2);

    if (nextType2 === draft.type2) {
      return;
    }

    const nextIsVacation = type1Value === '휴무';
    if (nextIsVacation) {
      setDraftField('manualPageName', '');
      setDraftField('taskUsedtime', '');
      return;
    }

    if (previousWasVacation) {
      setDraftField('manualPageName', '');
      setDraftField('taskUsedtime', '');
    }
  };

  const handleProjectSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyProjectQuery();
    }
  };

  const handleVacationTypeChange = (value: string) => {
    setDraftField('manualPageName', value);
    if (value === '오전 반차' || value === '오후 반차') {
      setDraftField('taskUsedtime', '240');
      return;
    }
    if (value === '전일 휴가') {
      setDraftField('taskUsedtime', '480');
      return;
    }
    setDraftField('taskUsedtime', '');
  };

  const applySelectedDate = (date: string) => {
    setSelectedDate(date);
  };

  const shiftSelectedDate = (offsetDays: number) => {
    const base = selectedDate || todayInputValue;

    if (offsetDays === 0) {
      applySelectedDate(todayInputValue);
      return;
    }

    let nextDate = shiftDateInput(base, offsetDays);
    const weekday = new Date(nextDate).getDay();

    if (offsetDays < 0 && weekday === 0) {
      nextDate = shiftDateInput(nextDate, -2);
    }

    if (offsetDays > 0 && weekday === 6) {
      nextDate = shiftDateInput(nextDate, 2);
    }

    applySelectedDate(nextDate);
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('정말 삭제 하시겠습니까?');
    if (!confirmed) {
      return;
    }

    void deleteDraft(id);
  };

  const selectedReportType2Options = useMemo(
    () => buildTaskType2OptionsForValue(taskTypes, draft.type1, draft.type2),
    [draft.type1, draft.type2, taskTypes],
  );
  const isListDateValid = /^\d{4}-\d{2}-\d{2}$/.test(currentListDateValue);

  return (
    <section className="reports-page reports-page--page">
      <header className="reports-page__hero">
        <div className="reports-page__hero-main">
          <h1 className="reports-page__title">업무보고</h1>
        </div>
      </header>
      {statusMessage ? <p className="reports-page__status-message">{statusMessage}</p> : null}

      <ReportsDateNavigator
        currentListDateText={currentListDateText}
        onShiftDate={shiftSelectedDate}
      />

      <div className="reports-page__grid-layout">
        {canEditReports ? (
          <ReportsEditorForm
            activeTab={activeTab}
            draft={draft}
            draftPages={draftPages}
            costGroupOptions={costGroupOptions}
            filteredProjectOptions={filteredProjectOptions}
            isSaving={isSaving}
            isListDateValid={isListDateValid}
            platformOptions={platformOptions}
            projectQuery={projectQuery}
            reportTabType1Options={reportTabType1Options}
            type1Options={type1Options}
            type2Options={type2Options}
            type2Placeholder={type2Placeholder}
            type1Value={type1Value}
            typeFilteredProjects={typeFilteredProjects}
            projectSearchPlaceholder={projectSearchPlaceholder}
            projectTypeSelected={projectTypeSelected}
            isProjectLinkedTab={isProjectLinkedTab}
            showPlatformSelect={showPlatformSelect}
            showReadonlyService={showReadonlyService}
            showProjectSelect={showProjectSelect}
            showPageSelect={showPageSelect}
            showPageUrl={showPageUrl}
            showManualPageName={showManualPageName}
            usesProjectLookup={usesProjectLookup}
            isVacationType={isVacationType}
            isReadonlyWorkHours={isReadonlyWorkHours}
            manualPageLabel={manualPageLabel}
            onSubmit={onSubmit}
            onActiveTabChange={setActiveTab}
            onDraftFieldChange={setDraftField}
            onProjectQueryChange={setProjectQuery}
            onProjectSearch={applyProjectQuery}
            onProjectSearchKeyDown={handleProjectSearchKeyDown}
            onType2Change={handleType2Change}
            onVacationTypeChange={handleVacationTypeChange}
          />
        ) : null}
      </div>

      <section className={canEditReports ? 'reports-page__panel' : undefined}>
        <ReportsResultsTable
          rows={dailyReports}
          canEdit={canEditReports}
          selectedReportId={selectedReportId}
          selectedReport={selectedReport}
          editDateValue={draft.reportDate}
          editType2Value={draft.type2}
          editWorkHoursValue={draft.taskUsedtime}
          editNoteValue={draft.note}
          editType2Options={selectedReportType2Options}
          onEditDateChange={(value) => setDraftField('reportDate', value)}
          onEditType2Change={(value) => setDraftField('type2', value)}
          onEditWorkHoursChange={(value) => setDraftField('taskUsedtime', value)}
          onEditNoteChange={(value) => setDraftField('note', value)}
          onSaveEdit={() => {
            void saveDraft();
          }}
          summaryDate={currentListDateValue}
          onSelect={selectReport}
          onDelete={handleDelete}
          onOverhead={(reportDate, remainingMinutes) => {
            void saveOverheadReport(remainingMinutes, reportDate);
          }}
          emptyMessage="결과가 미존재."
        />
      </section>
    </section>
  );
}

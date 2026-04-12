import { useEffect, useMemo, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../router/navigation';
import { getTaskTypeUiRule } from '../../utils/taskType';
import { ReportsDateNavigator } from './ReportsDateNavigator';
import { ReportsEditorForm } from './ReportsEditorForm';
import { getTodayInputValue, shiftDateInput } from './reportUtils';
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
    draft,
    draftSubtasks,
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
    selectedReportId,
    isEditMode,
    setDraftField,
    setActiveTab,
    setSelectedDate,
    setProjectQuery,
    projectQuery,
    appliedProjectQuery,
    statusMessage,
    statusKind,
    taskTypes,
    type1Options,
    type2Options,
    canEditReports,
    cancelEdit,
    overheadCostGroupId,
    setOverheadCostGroupId,
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
  const projectTypeSelected = Boolean(draft.projectId);
  const type1Value = projectTypeSelected
    ? currentProject?.project.taskType1 || draft.type1
    : draft.type1;
  const typeRule = useMemo(() => getTaskTypeUiRule(type1Value, taskTypes), [taskTypes, type1Value]);
  const usesProjectLookup = typeRule.projectLinked;
  const showTypeStep = Boolean(draft.costGroupId || draft.type1 || draft.type2);
  const projectLookupReady = Boolean(draft.costGroupId && draft.type1 && draft.type2);
  const showProjectLookupStep = usesProjectLookup && projectLookupReady;
  const isVacationType = typeRule.vacation;
  const isFixedDayType = false;
  const showSubtaskSelect = projectTypeSelected && typeRule.projectSubtaskSelectable;
  const showTaskStep =
    Boolean(draft.costGroupId && draft.type1 && draft.type2) &&
    (!usesProjectLookup || Boolean(draft.projectId) || !showProjectLookupStep);
  const isReadonlyWorkHours = isVacationType || isFixedDayType;
  const projectSearchPlaceholder = useMemo(() => {
    if (!draft.costGroupId) {
      return '청구그룹을 먼저 선택하세요';
    }
    if (appliedProjectQuery === null) {
      return '검색어 입력 후 검색하세요';
    }
    if (!appliedProjectQuery.trim()) {
      return '선택';
    }
    if (!filteredProjectOptions.length) {
      return '검색 결과가 없습니다.';
    }
    return `${appliedProjectQuery} 로 검색되었습니다. 목록을 선택하세요`;
  }, [appliedProjectQuery, draft.costGroupId, filteredProjectOptions.length]);
  const type2Placeholder = useMemo(() => {
    if (!draft.type1 || draft.type1 === '휴무') {
      return '선택';
    }
    if (!type2Options.length) {
      return '타입2가 존재하지 않습니다.';
    }
    return '선택';
  }, [draft.type1, type2Options.length]);
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
      setDraftField('manualSubtaskName', '');
      setDraftField('taskUsedtime', '');
      return;
    }

    if (previousWasVacation) {
      setDraftField('manualSubtaskName', '');
      setDraftField('taskUsedtime', '');
    }
  };

  const handleProjectSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyProjectQuery();
    }
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
    const target = dailyReports.find((report) => report.id === id);
    const summary = target
      ? `${formatDateSummary(target.reportDate)} / ${target.projectDisplayName !== '-' ? target.projectDisplayName : `${target.type1} ${target.type2}`}`
      : '선택한 업무';
    const confirmed = window.confirm(`${summary} 항목을 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    void deleteDraft(id);
  };

  const isListDateValid = /^\d{4}-\d{2}-\d{2}$/.test(currentListDateValue);
  return (
    <section className="reports-page reports-page--page">
      <header className="reports-page__hero">
        <div className="reports-page__hero-main">
          <h1 className="reports-page__title">업무보고</h1>
        </div>
      </header>

      <ReportsDateNavigator
        currentListDateText={currentListDateText}
        onShiftDate={shiftSelectedDate}
      />

      <div className="reports-page__grid-layout">
        {canEditReports ? (
          <ReportsEditorForm
            mode={isEditMode ? 'edit' : 'create'}
            draft={draft}
            draftSubtasks={draftSubtasks}
            costGroupOptions={costGroupOptions}
            filteredProjectOptions={filteredProjectOptions}
            isSaving={isSaving}
            isListDateValid={isListDateValid}
            projectQuery={projectQuery}
            type1Options={type1Options}
            type2Options={type2Options}
            type2Placeholder={type2Placeholder}
            type1Value={type1Value}
            projectSearchPlaceholder={projectSearchPlaceholder}
            projectTypeSelected={projectTypeSelected}
            showTypeStep={showTypeStep}
            showProjectLookupStep={showProjectLookupStep}
            showTaskStep={showTaskStep}
            showSubtaskSelect={showSubtaskSelect}
            isReadonlyWorkHours={isReadonlyWorkHours}
            onSubmit={onSubmit}
            onDraftFieldChange={setDraftField}
            onCancelEdit={cancelEdit}
            onProjectQueryChange={setProjectQuery}
            onProjectSearch={applyProjectQuery}
            onProjectSearchKeyDown={handleProjectSearchKeyDown}
            onType2Change={handleType2Change}
          />
        ) : null}

        <section
          className={
            canEditReports ? 'reports-page__panel reports-page__panel--results' : undefined
          }
        >
          {statusMessage ? (
            <p
              className={`reports-page__status-message reports-page__status-message--${statusKind}`}
            >
              {statusMessage}
            </p>
          ) : null}
          <ReportsResultsTable
            rows={dailyReports}
            canEdit={canEditReports}
            selectedReportId={selectedReportId}
            summaryDate={currentListDateValue}
            overheadCostGroupId={overheadCostGroupId}
            costGroupOptions={costGroupOptions}
            onOverheadCostGroupChange={setOverheadCostGroupId}
            onSelect={selectReport}
            onDelete={handleDelete}
            onOverhead={(reportDate, remainingMinutes) => {
              void saveOverheadReport(remainingMinutes, reportDate);
            }}
            emptyMessage="결과가 없습니다."
          />
        </section>
      </div>
    </section>
  );
}

function formatDateSummary(value: string) {
  return value.slice(0, 10);
}

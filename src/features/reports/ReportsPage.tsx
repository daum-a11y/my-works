import { useEffect, useMemo, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../app/navigation';
import { getTaskTypeUiRule } from '../../lib/taskTypeRules';

import {
  buildSelectableTaskType1Options,
  buildTaskType2OptionsForValue,
  formatReportDate,
  formatReportTaskUsedtime,
  getTodayInputValue,
  shiftDateInput,
  type ReportViewModel,
} from './reportDomain';
import { useReportsSlice } from './useReportsSlice';
import '../../styles/domain/pages/reports-page.scss';

function normalizeDateForInput(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const compact = trimmed.replace(/\D/g, '');
  if (/^\d{8}$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  }

  if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}$/.test(trimmed.slice(0, 10))) {
    return trimmed.slice(0, 10);
  }

  return '';
}

function renderReportTable(
  rows: ReportViewModel[],
  options: {
    canEdit: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onOverhead: (date: string, remainingMinutes: number) => void;
    selectedReportId: string | null;
    selectedReport: ReportViewModel | null;
    editDateValue: string;
    editType2Value: string;
    editWorkHoursValue: string;
    editNoteValue: string;
    editType2Options: string[];
    onEditDateChange: (value: string) => void;
    onEditType2Change: (value: string) => void;
    onEditWorkHoursChange: (value: string) => void;
    onEditNoteChange: (value: string) => void;
    onSaveEdit: () => void;
    summaryDate: string;
    emptyMessage: string;
  },
) {
  const {
    canEdit,
    onSelect,
    onDelete,
    onOverhead,
    selectedReportId,
    selectedReport,
    editDateValue,
    editType2Value,
    editWorkHoursValue,
    editNoteValue,
    editType2Options,
    onEditDateChange,
    onEditType2Change,
    onEditWorkHoursChange,
    onEditNoteChange,
    onSaveEdit,
    summaryDate,
    emptyMessage,
  } = options;
  const totalMinutes = rows.reduce((sum, report) => sum + report.taskUsedtime, 0);
  const missingMinutes = Math.max(480 - totalMinutes, 0);
  const canAddOverhead = Boolean(summaryDate) && missingMinutes > 0;

  return (
    <>
      <div className="tableWrap">
        <table className="table">
          <caption className="srOnly">업무 보고 목록</caption>
          <thead>
            <tr>
              <th scope="col">일자</th>
              <th scope="col">청구그룹</th>
              <th scope="col">타입1</th>
              <th scope="col">타입2</th>
              <th scope="col">플랫폼</th>
              <th scope="col">서비스그룹</th>
              <th scope="col">서비스명</th>
              <th scope="col">프로젝트명</th>
              <th scope="col">페이지&amp;내용</th>
              <th scope="col">URL</th>
              <th scope="col">총시간</th>
              <th scope="col">비고</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((report) => {
              const isSelected = selectedReportId === report.id;

              return (
                <tr key={report.id} data-active={isSelected || undefined}>
                  <td>
                    {isSelected && selectedReport ? (
                      <input
                        type="date"
                        value={editDateValue}
                        readOnly={!canEdit}
                        onChange={(event) => onEditDateChange(event.target.value)}
                      />
                    ) : (
                      formatReportDate(report.reportDate)
                    )}
                  </td>
                  <td>
                    <strong>{report.costGroupName || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.type1}</strong>
                  </td>
                  <td>
                    {isSelected && selectedReport ? (
                      <select
                        value={editType2Value}
                        onChange={(event) => onEditType2Change(event.target.value)}
                      >
                        {(editType2Options.length ? editType2Options : [editType2Value]).map(
                          (type2) => (
                            <option key={type2} value={type2}>
                              {type2}
                            </option>
                          ),
                        )}
                      </select>
                    ) : (
                      <strong>{report.type2}</strong>
                    )}
                  </td>
                  <td>
                    <strong>{report.platform || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.serviceGroupName || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.serviceName || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.projectDisplayName}</strong>
                  </td>
                  <td>
                    <strong>{report.pageDisplayName}</strong>
                  </td>
                  <td>
                    {report.pageUrl ? (
                      <a href={report.pageUrl} target="_blank" rel="noreferrer">
                        {report.pageUrl}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {isSelected && selectedReport && canEdit ? (
                      <input
                        type="text"
                        value={editWorkHoursValue}
                        onChange={(event) => onEditWorkHoursChange(event.target.value)}
                      />
                    ) : (
                      formatReportTaskUsedtime(report.taskUsedtime)
                    )}
                  </td>
                  <td>
                    {isSelected && selectedReport && canEdit ? (
                      <input
                        type="text"
                        value={editNoteValue}
                        onChange={(event) => onEditNoteChange(event.target.value)}
                      />
                    ) : (
                      report.note || '-'
                    )}
                  </td>
                  <td>
                    {isSelected && selectedReport && canEdit ? (
                      <button type="button" className="rowButton" onClick={onSaveEdit}>
                        저장
                      </button>
                    ) : (
                      <>
                        {canEdit ? (
                          <button
                            type="button"
                            className="rowButton"
                            onClick={() => onSelect(report.id)}
                          >
                            수정
                          </button>
                        ) : null}
                        {canEdit ? (
                          <button
                            type="button"
                            className="rowButton"
                            onClick={() => onDelete(report.id)}
                          >
                            삭제
                          </button>
                        ) : null}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={13} className="emptyState">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {missingMinutes > 0 ? (
        <div className="tableFooter">
          <p className="tableFooterText">
            부족한 시간 <strong>{missingMinutes}분</strong>
          </p>
          {canEdit && canAddOverhead ? (
            <button
              type="button"
              className="secondaryButton"
              onClick={() => onOverhead(summaryDate, missingMinutes)}
            >
              오버헤드 등록
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

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
    <section className="reportsPageScope page">
      <header className="hero">
        <div className="heroMain">
          <h1 className="title">업무보고</h1>
        </div>
      </header>
      {statusMessage ? <p className="statusMessage">{statusMessage}</p> : null}

      <section className="dateNavigator">
        <p className="dateText">{currentListDateText}</p>
        <div className="dateActions">
          <button
            type="button"
            className="secondaryButton"
            onClick={() => shiftSelectedDate(-1)}
            aria-label="이전일 조회"
          >
            이전일
          </button>
          <button
            type="button"
            className="secondaryButton"
            onClick={() => shiftSelectedDate(0)}
            aria-label="오늘 조회"
          >
            오늘
          </button>
          <button
            type="button"
            className="secondaryButton"
            onClick={() => shiftSelectedDate(1)}
            aria-label="다음일 조회"
          >
            다음일
          </button>
        </div>
      </section>

      <div className="gridLayout">
        {canEditReports ? (
          <section className="panel">
            <div className="tabRow">
              <button
                type="button"
                className={`tabButton ${activeTab === 'report' ? 'tabButtonActive' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                기본 입력
              </button>
              <button
                type="button"
                className={`tabButton ${activeTab === 'period' ? 'tabButtonActive' : ''}`}
                onClick={() => setActiveTab('period')}
              >
                TYPE 입력
              </button>
            </div>

            <form className="form" onSubmit={onSubmit}>
              {activeTab === 'report' ? (
                <div className="formGrid">
                  <label className="field">
                    <span>청구그룹</span>
                    <select
                      value={draft.costGroupId}
                      onChange={(event) => setDraftField('costGroupId', event.target.value)}
                    >
                      <option value="">
                        {costGroupOptions.length ? '선택하세요' : '청구그룹이 없습니다.'}
                      </option>
                      {costGroupOptions.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>프로젝트검색</span>
                    <input
                      value={projectQuery}
                      onChange={(event) => setProjectQuery(event.target.value)}
                      onKeyDown={handleProjectSearchKeyDown}
                      placeholder="검색어입력"
                    />
                  </label>

                  <div className="searchButtonField">
                    <span className="srOnly">프로젝트 검색</span>
                    <button type="button" className="secondaryButton" onClick={applyProjectQuery}>
                      검색
                    </button>
                  </div>

                  <label className="field">
                    <span>프로젝트</span>
                    <select
                      value={draft.projectId}
                      onChange={(event) => setDraftField('projectId', event.target.value)}
                      disabled={!draft.costGroupId}
                    >
                      <option value="">{projectSearchPlaceholder}</option>
                      {filteredProjectOptions.map((project) => (
                        <option key={project.id} value={project.id}>
                          {`${project.project.projectType1} - ${project.project.platform} - ${project.project.name}`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              <div className="formGrid">
                {projectTypeSelected ? (
                  <label className="field">
                    <span>타입1</span>
                    <input value={type1Value} readOnly />
                  </label>
                ) : (
                  <label className="field">
                    <span>타입1</span>
                    <select
                      value={draft.type1}
                      onChange={(event) => setDraftField('type1', event.target.value)}
                    >
                      <option value="">{isProjectLinkedTab ? '선택해주세요' : 'type1'}</option>
                      {(isProjectLinkedTab ? reportTabType1Options : type1Options).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="field">
                  <span>타입2</span>
                  <select
                    value={draft.type2}
                    onChange={(event) => handleType2Change(event.target.value)}
                  >
                    {type2Placeholder ? <option value="">{type2Placeholder}</option> : null}
                    {type2Options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>

                {showPlatformSelect ? (
                  <label className="field">
                    <span>플랫폼</span>
                    <select
                      value={draft.platform}
                      onChange={(event) => setDraftField('platform', event.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {platformOptions
                        .filter(
                          (platform) => platform.isVisible || platform.name === draft.platform,
                        )
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
                    <label className="field">
                      <span>청구그룹</span>
                      <input value={draft.costGroupName} readOnly />
                    </label>
                    <label className="field">
                      <span>서비스 그룹</span>
                      <input value={draft.serviceGroupName} readOnly />
                    </label>
                    <label className="field">
                      <span>서비스 명</span>
                      <input value={draft.serviceName} readOnly />
                    </label>
                  </>
                ) : null}

                {showProjectSelect && !isProjectLinkedTab ? (
                  <label className="field">
                    <span>프로젝트</span>
                    <select
                      value={draft.projectId}
                      onChange={(event) => setDraftField('projectId', event.target.value)}
                      disabled={!draft.costGroupId}
                    >
                      <option value="">
                        {typeFilteredProjects.length
                          ? '선택하세요'
                          : '프로젝트가 존재하지 않습니다.'}
                      </option>
                      {typeFilteredProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {showPageSelect ? (
                  <label className="field">
                    <span>{isProjectLinkedTab ? '페이지명' : '프로젝트 페이지'}</span>
                    <select
                      value={draft.pageId}
                      onChange={(event) => setDraftField('pageId', event.target.value)}
                    >
                      <option value="">
                        {draftPages.length ? '선택하세요' : '페이지가 존재하지 않습니다.'}
                      </option>
                      {draftPages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {showManualPageName ? (
                  <label className="field">
                    <span>{manualPageLabel}</span>
                    {isVacationType ? (
                      <select
                        value={draft.manualPageName}
                        onChange={(event) => handleVacationTypeChange(event.target.value)}
                      >
                        <option value="">선택하세요</option>
                        <option value="오전 반차">오전 반차</option>
                        <option value="오후 반차">오후 반차</option>
                        <option value="전일 휴가">전일 휴가</option>
                      </select>
                    ) : (
                      <input
                        value={draft.manualPageName}
                        onChange={(event) => setDraftField('manualPageName', event.target.value)}
                        placeholder={manualPageLabel}
                      />
                    )}
                  </label>
                ) : null}

                {showPageUrl ? (
                  <label className="field">
                    <span>{showPageSelect ? '페이지 URL' : 'URL'}</span>
                    <input
                      value={draft.pageUrl}
                      onChange={(event) => setDraftField('pageUrl', event.target.value)}
                      readOnly={isProjectLinkedTab || usesProjectLookup}
                    />
                  </label>
                ) : null}

                <label className="field">
                  <span>총시간</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.taskUsedtime}
                    onChange={(event) => setDraftField('taskUsedtime', event.target.value)}
                    readOnly={isReadonlyWorkHours}
                  />
                </label>
              </div>

              <label className="field">
                <span>비고</span>
                <textarea
                  value={draft.note}
                  onChange={(event) => setDraftField('note', event.target.value)}
                  rows={2}
                />
              </label>

              <div className="actionRow">
                <button
                  type="submit"
                  className="primaryButton"
                  disabled={isSaving || !isListDateValid}
                >
                  업무저장
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>

      <section className={canEditReports ? 'panel' : undefined}>
        {renderReportTable(dailyReports, {
          canEdit: canEditReports,
          selectedReportId,
          selectedReport,
          editDateValue: draft.reportDate,
          editType2Value: draft.type2,
          editWorkHoursValue: draft.taskUsedtime,
          editNoteValue: draft.note,
          editType2Options: selectedReportType2Options,
          onEditDateChange: (value) => setDraftField('reportDate', value),
          onEditType2Change: (value) => setDraftField('type2', value),
          onEditWorkHoursChange: (value) => setDraftField('taskUsedtime', value),
          onEditNoteChange: (value) => setDraftField('note', value),
          onSaveEdit: () => {
            void saveDraft();
          },
          summaryDate: currentListDateValue,
          onSelect: selectReport,
          onDelete: handleDelete,
          onOverhead: (reportDate, remainingMinutes) => {
            void saveOverheadReport(remainingMinutes, reportDate);
          },
          emptyMessage: '결과가 미존재.',
        })}
      </section>
    </section>
  );
}

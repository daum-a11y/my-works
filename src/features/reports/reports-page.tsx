import { useEffect, useMemo, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { setDocumentTitle } from '../../app/navigation';

import {
  formatReportDate,
  formatReportHours,
  getTodayInputValue,
  shiftDateInput,
  type ReportViewModel,
} from './report-domain';
import { useReportsSlice } from './use-reports-slice';
import styles from './reports-page.module.css';

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
  const totalMinutes = rows.reduce((sum, report) => sum + report.workHours, 0);
  const missingMinutes = Math.max(480 - totalMinutes, 0);
  const canAddOverhead = Boolean(summaryDate) && missingMinutes > 0;

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>업무 보고 목록</caption>
          <thead>
            <tr>
              <th scope="col">일자</th>
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
                      formatReportHours(report.workHours)
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
                      <button type="button" className={styles.rowButton} onClick={onSaveEdit}>
                        저장
                      </button>
                    ) : (
                      <>
                        {canEdit ? (
                          <button
                            type="button"
                            className={styles.rowButton}
                            onClick={() => onSelect(report.id)}
                          >
                            수정
                          </button>
                        ) : null}
                        {canEdit ? (
                          <button
                            type="button"
                            className={styles.rowButton}
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
                <td colSpan={12} className={styles.emptyState}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {missingMinutes > 0 ? (
        <div className={styles.tableFooter}>
          <p className={styles.tableFooterText}>
            부족한 시간 <strong>{missingMinutes}분</strong>
          </p>
          {canEdit && canAddOverhead ? (
            <button
              type="button"
              className={styles.secondaryButton}
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

function includesValue(values: readonly string[], value: string) {
  return values.includes(value);
}

const PROJECT_LINKED_PAGE_SELECT_TYPE2_IDS = [
  '2',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '65',
  '88',
  '96',
  '97',
  '98',
  '99',
  '100',
] as const;
const PROJECT_LINKED_PAGE_URL_TYPE2_IDS = [
  '2',
  '4',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '50',
  '51',
  '65',
  '88',
  '96',
  '97',
  '98',
  '99',
  '100',
] as const;
const PROJECT_LINKED_MANUAL_PAGE_TYPE2_IDS = ['35', '38', '67', '69'] as const;
const TYPE_INPUT_PAGE_SELECT_TYPE2_IDS = ['2', '7', '9', '10', '12', '13'] as const;
const TYPE_INPUT_PAGE_URL_TYPE2_IDS = ['2', '7', '9', '10', '12', '13', '50'] as const;

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
    filteredProjectOptions,
    projectOptions,
    applyProjectQuery,
    isSaving,
    periodReports,
    periodFilters,
    saveDraft,
    saveOverheadReport,
    deleteDraft,
    selectReport,
    selectedReport,
    selectedReportId,
    setDraftField,
    setActiveTab,
    setPeriodField,
    applyPeriodFilters,
    setProjectQuery,
    projectQuery,
    statusMessage,
    taskTypes,
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
  const selectedType2LegacyId = useMemo(() => {
    return (
      taskTypes.find((taskType) => taskType.type1 === draft.type1 && taskType.type2 === draft.type2)
        ?.legacyTypeId ?? ''
    );
  }, [draft.type1, draft.type2, taskTypes]);
  const reportTabType1Options = useMemo(() => {
    const legacyOrder = ['민원', '데이터버퍼', '일반버퍼', '교육', '기타버퍼', '휴무'];
    const available = legacyOrder.filter((type1) => type1Options.includes(type1));
    return available.length ? available : type1Options;
  }, [type1Options]);
  const isProjectLinkedTab = activeTab === 'report';
  const projectTypeSelected = isProjectLinkedTab && Boolean(draft.projectId);
  const type1Value = projectTypeSelected
    ? currentProject?.project.projectType1 || draft.type1
    : draft.type1;
  const usesProjectLookup = includesValue(['QA', '접근성테스트', '모니터링', '민원'], type1Value);
  const usesManualPageWithUrl = includesValue(['데이터버퍼', 'RnD'], type1Value);
  const usesManualPageOnly = includesValue(['일반버퍼', '교육', '매니징', '기타버퍼'], type1Value);
  const showPlatformSelect = !projectTypeSelected && usesProjectLookup;
  const showReadonlyService = projectTypeSelected || usesProjectLookup;
  const showProjectSelect = isProjectLinkedTab || usesProjectLookup;
  const isVacationType = selectedType2LegacyId === '36';
  const isFixedDayType = selectedType2LegacyId === '38';
  const showProjectLinkedPageSelect =
    projectTypeSelected &&
    includesValue(PROJECT_LINKED_PAGE_SELECT_TYPE2_IDS, selectedType2LegacyId);
  const showProjectLinkedPageUrl =
    projectTypeSelected && includesValue(PROJECT_LINKED_PAGE_URL_TYPE2_IDS, selectedType2LegacyId);
  const showPageSelect = isProjectLinkedTab
    ? showProjectLinkedPageSelect
    : draft.projectId &&
      (includesValue(['모니터링', '민원'], type1Value) ||
        includesValue(TYPE_INPUT_PAGE_SELECT_TYPE2_IDS, selectedType2LegacyId));
  const showPageUrl = isProjectLinkedTab
    ? showProjectLinkedPageUrl
    : usesProjectLookup ||
      usesManualPageWithUrl ||
      includesValue(TYPE_INPUT_PAGE_URL_TYPE2_IDS, selectedType2LegacyId);
  const showManualPageName = isProjectLinkedTab
    ? includesValue(PROJECT_LINKED_MANUAL_PAGE_TYPE2_IDS, selectedType2LegacyId) || isVacationType
    : usesManualPageWithUrl ||
      usesManualPageOnly ||
      includesValue(['36', '38', '67', '69'], selectedType2LegacyId);
  const isReadonlyWorkHours = isVacationType || isFixedDayType;
  const manualPageLabel = useMemo(() => {
    if (isVacationType) {
      return '휴가 종류';
    }
    if (includesValue(['35', '38', '67', '69'], selectedType2LegacyId)) {
      return '페이지명';
    }
    return '페이지명 & 내용';
  }, [isVacationType, selectedType2LegacyId]);
  const typeFilteredProjects = useMemo(() => {
    if (!draft.platform || !draft.type1) {
      return [] as typeof filteredProjectOptions;
    }

    return filteredProjectOptions.filter(
      (project) =>
        project.project.platform === draft.platform && project.project.projectType1 === draft.type1,
    );
  }, [draft.platform, draft.type1, filteredProjectOptions]);
  const projectSearchPlaceholder = useMemo(() => {
    if (!projectQuery.trim()) {
      return '선택하세요';
    }
    if (!filteredProjectOptions.length) {
      return '검색 결과가 없습니다.';
    }
    return `${projectQuery} 로 검색되었습니다. 목록을 선택하세요`;
  }, [filteredProjectOptions.length, projectQuery]);
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
    const value = periodFilters.startDate || periodFilters.endDate || todayInputValue;
    return value ? value.slice(0, 10) : '';
  }, [periodFilters.endDate, periodFilters.startDate, todayInputValue]);
  const currentListDateValue = useMemo(
    () => periodFilters.startDate || periodFilters.endDate || todayInputValue,
    [periodFilters.endDate, periodFilters.startDate, todayInputValue],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveDraft(currentListDateValue);
  };

  const handleType2Change = (nextType2: string) => {
    const previousLegacyId = selectedType2LegacyId;
    setDraftField('type2', nextType2);

    if (nextType2 === draft.type2) {
      return;
    }

    const nextLegacyId =
      taskTypes.find((taskType) => taskType.type1 === type1Value && taskType.type2 === nextType2)
        ?.legacyTypeId ?? '';
    if (nextLegacyId === '38') {
      setDraftField('manualPageName', '');
      setDraftField('workHours', '480');
      return;
    }

    if (nextLegacyId === '36') {
      setDraftField('manualPageName', '');
      setDraftField('workHours', '');
      return;
    }

    if (nextLegacyId === '67' || nextLegacyId === '69') {
      setDraftField('manualPageName', '');
      setDraftField('workHours', '');
      return;
    }

    if (
      previousLegacyId === '36' ||
      previousLegacyId === '38' ||
      previousLegacyId === '67' ||
      previousLegacyId === '69'
    ) {
      setDraftField('manualPageName', '');
      setDraftField('workHours', '');
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
      setDraftField('workHours', '240');
      return;
    }
    if (value === '전일 휴가') {
      setDraftField('workHours', '480');
      return;
    }
    setDraftField('workHours', '');
  };

  const applyPeriodDate = (date: string) => {
    const nextFilters = {
      ...periodFilters,
      startDate: date,
      endDate: date,
    };
    setPeriodField('startDate', date);
    setPeriodField('endDate', date);
    applyPeriodFilters(nextFilters);
  };

  const shiftPeriodDate = (offsetDays: number) => {
    const base = periodFilters.startDate || periodFilters.endDate || todayInputValue;

    if (offsetDays === 0) {
      applyPeriodDate(todayInputValue);
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

    applyPeriodDate(nextDate);
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('정말 삭제 하시겠습니까?');
    if (!confirmed) {
      return;
    }

    void deleteDraft(id);
  };

  const selectedReportType2Options = useMemo(() => {
    if (!draft.type1) {
      return [];
    }
    return taskTypes
      .filter((taskType) => taskType.type1 === draft.type1)
      .map((taskType) => taskType.type2);
  }, [draft.type1, taskTypes]);
  const isListDateValid = /^\d{4}-\d{2}-\d{2}$/.test(currentListDateValue);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <h1 className={styles.title}>업무보고</h1>
        </div>
      </header>
      {statusMessage ? <p className={styles.statusMessage}>{statusMessage}</p> : null}

      <section className={styles.dateNavigator}>
        <p className={styles.dateText}>{currentListDateText}</p>
        <div className={styles.dateActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => shiftPeriodDate(-1)}
            aria-label="이전일 조회"
          >
            이전일
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => shiftPeriodDate(0)}
            aria-label="오늘 조회"
          >
            오늘
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => shiftPeriodDate(1)}
            aria-label="다음일 조회"
          >
            다음일
          </button>
        </div>
      </section>

      <div className={styles.gridLayout}>
        {canEditReports ? (
          <section className={styles.panel}>
            <div className={styles.tabRow}>
              <button
                type="button"
                className={`${styles.tabButton} ${
                  activeTab === 'report' ? styles.tabButtonActive : ''
                }`}
                onClick={() => setActiveTab('report')}
              >
                기본 입력
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${
                  activeTab === 'period' ? styles.tabButtonActive : ''
                }`}
                onClick={() => setActiveTab('period')}
              >
                TYPE 입력
              </button>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              {activeTab === 'report' ? (
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>프로젝트검색</span>
                    <input
                      value={projectQuery}
                      onChange={(event) => setProjectQuery(event.target.value)}
                      onKeyDown={handleProjectSearchKeyDown}
                      placeholder="검색어입력"
                    />
                  </label>

                  <div className={styles.searchButtonField}>
                    <span className={styles.srOnly}>프로젝트 검색</span>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={applyProjectQuery}
                    >
                      검색
                    </button>
                  </div>

                  <label className={styles.field}>
                    <span>프로젝트</span>
                    <select
                      value={draft.projectId}
                      onChange={(event) => setDraftField('projectId', event.target.value)}
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

              <div className={styles.formGrid}>
                {projectTypeSelected ? (
                  <label className={styles.field}>
                    <span>타입1</span>
                    <input value={type1Value} readOnly />
                  </label>
                ) : (
                  <label className={styles.field}>
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

                <label className={styles.field}>
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
                  <label className={styles.field}>
                    <span>플랫폼</span>
                    <select
                      value={draft.platform}
                      onChange={(event) => setDraftField('platform', event.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {['PC-Web', 'M-Web', 'iOS-App', 'And-App', 'Win-App'].map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {showReadonlyService ? (
                  <>
                    <label className={styles.field}>
                      <span>서비스 그룹</span>
                      <input value={draft.serviceGroupName} readOnly />
                    </label>
                    <label className={styles.field}>
                      <span>서비스 명</span>
                      <input value={draft.serviceName} readOnly />
                    </label>
                  </>
                ) : null}

                {showProjectSelect && !isProjectLinkedTab ? (
                  <label className={styles.field}>
                    <span>프로젝트</span>
                    <select
                      value={draft.projectId}
                      onChange={(event) => setDraftField('projectId', event.target.value)}
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
                  <label className={styles.field}>
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
                  <label className={styles.field}>
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
                  <label className={styles.field}>
                    <span>{showPageSelect ? '페이지 URL' : 'URL'}</span>
                    <input
                      value={draft.pageUrl}
                      onChange={(event) => setDraftField('pageUrl', event.target.value)}
                      readOnly={isProjectLinkedTab || usesProjectLookup}
                    />
                  </label>
                ) : null}

                <label className={styles.field}>
                  <span>총시간</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.workHours}
                    onChange={(event) => setDraftField('workHours', event.target.value)}
                    readOnly={isReadonlyWorkHours}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>비고</span>
                <textarea
                  value={draft.note}
                  onChange={(event) => setDraftField('note', event.target.value)}
                  rows={2}
                />
              </label>

              <div className={styles.actionRow}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isSaving || !isListDateValid}
                >
                  업무저장
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>

      <section className={canEditReports ? styles.panel : undefined}>
        {renderReportTable(periodReports, {
          canEdit: canEditReports,
          selectedReportId,
          selectedReport,
          editDateValue: draft.reportDate,
          editType2Value: draft.type2,
          editWorkHoursValue: draft.workHours,
          editNoteValue: draft.note,
          editType2Options: selectedReportType2Options,
          onEditDateChange: (value) => setDraftField('reportDate', value),
          onEditType2Change: (value) => setDraftField('type2', value),
          onEditWorkHoursChange: (value) => setDraftField('workHours', value),
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

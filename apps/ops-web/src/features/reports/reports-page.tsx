import type { FormEvent } from "react";

import {
  REPORT_TYPE1_OPTIONS,
  REPORT_TYPE2_OPTIONS,
  formatReportDate,
  formatReportHours,
} from "./report-domain";
import { useReportsSlice } from "./use-reports-slice";
import styles from "./reports-page.module.css";

export function ReportsPage() {
  const {
    filteredReports,
    selectedReport,
    draft,
    filters,
    statusMessage,
    pendingDeleteId,
    projects,
    draftPages,
    filterPages,
    setDraftField,
    setFilterField,
    selectReport,
    startNewReport,
    saveDraft,
    promptDelete,
    cancelDelete,
    confirmDelete,
    resetDraft,
  } = useReportsSlice();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveDraft();
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>업무보고</p>
          <h1 className={styles.title}>실사용 보고서를 빠르게 기록하고 관리합니다.</h1>
          <p className={styles.description}>
            날짜, 프로젝트, 페이지, 업무 유형, 시간, 내용, 메모를 한 화면에서 바로 입력하고 수정합니다.
          </p>
        </div>

        <div className={styles.heroAside} aria-label="보고 현황 요약">
          <div>
            <span className={styles.metricLabel}>표시 중</span>
            <strong className={styles.metricValue}>{filteredReports.length}</strong>
          </div>
          <div>
            <span className={styles.metricLabel}>선택 상태</span>
            <strong className={styles.metricValue}>
              {selectedReport ? "편집 중" : "새 보고"}
            </strong>
          </div>
          <div>
            <span className={styles.metricLabel}>상태</span>
            <strong className={styles.metricValue}>
              {selectedReport?.updatedAt ? "수정 가능" : "작성 가능"}
            </strong>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>목록</p>
                <h2 className={styles.panelTitle}>보고 내역</h2>
              </div>
              <button type="button" className={styles.secondaryButton} onClick={startNewReport}>
                새 보고
              </button>
            </div>

            <form className={styles.filterGrid} aria-label="보고 필터">
              <label className={styles.field}>
                <span>검색</span>
                <input
                  value={filters.query}
                  onChange={(event) => setFilterField("query", event.target.value)}
                  placeholder="프로젝트, 페이지, 내용"
                />
              </label>
              <label className={styles.field}>
                <span>프로젝트</span>
                <select
                  value={filters.projectId}
                  onChange={(event) => setFilterField("projectId", event.target.value)}
                >
                  <option value="">전체</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>페이지</span>
                <select
                  value={filters.pageId}
                  onChange={(event) => setFilterField("pageId", event.target.value)}
                  disabled={!filters.projectId}
                >
                  <option value="">전체</option>
                  {filterPages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>유형 1</span>
                <select
                  value={filters.taskType1}
                  onChange={(event) => setFilterField("taskType1", event.target.value)}
                >
                  <option value="">전체</option>
                  {REPORT_TYPE1_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>유형 2</span>
                <select
                  value={filters.taskType2}
                  onChange={(event) => setFilterField("taskType2", event.target.value)}
                >
                  <option value="">전체</option>
                  {REPORT_TYPE2_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>최소 시간</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.minHours}
                  onChange={(event) => setFilterField("minHours", event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>최대 시간</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.maxHours}
                  onChange={(event) => setFilterField("maxHours", event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>시작일</span>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => setFilterField("startDate", event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>종료일</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => setFilterField("endDate", event.target.value)}
                />
              </label>
            </form>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>보고 목록</caption>
                <thead>
                  <tr>
                    <th scope="col">일자</th>
                    <th scope="col">프로젝트 / 페이지</th>
                    <th scope="col">유형</th>
                    <th scope="col">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const isActive = selectedReport?.id === report.id;
                    return (
                      <tr key={report.id} data-active={isActive || undefined}>
                        <td>
                          <button
                            type="button"
                            className={styles.rowButton}
                            onClick={() => selectReport(report.id)}
                          >
                            {formatReportDate(report.reportDate)}
                          </button>
                        </td>
                        <td>
                          <strong>{report.projectName}</strong>
                          <span>{report.pageName}</span>
                        </td>
                        <td>
                          <strong>{report.type1}</strong>
                          <span>{report.type2}</span>
                        </td>
                        <td>{formatReportHours(report.workHours)}</td>
                      </tr>
                    );
                  })}
                  {!filteredReports.length && (
                    <tr>
                      <td colSpan={4} className={styles.emptyState}>
                        조건에 맞는 보고서가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </aside>

        <main className={styles.editorColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>편집</p>
                <h2 className={styles.panelTitle}>
                  {selectedReport ? "보고서 수정" : "새 보고서"}
                </h2>
              </div>
              <p className={styles.status} aria-live="polite">
                {statusMessage}
              </p>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>업무 일자</span>
                  <input
                    type="date"
                    value={draft.reportDate}
                    onChange={(event) => setDraftField("reportDate", event.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>업무 시간</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={draft.workHours}
                    onChange={(event) => setDraftField("workHours", event.target.value)}
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>프로젝트</span>
                  <select
                    value={draft.projectId}
                    onChange={(event) => setDraftField("projectId", event.target.value)}
                    required
                  >
                    <option value="">프로젝트 선택</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>페이지</span>
                  <select
                    value={draft.pageId}
                    onChange={(event) => setDraftField("pageId", event.target.value)}
                    required
                    disabled={!draft.projectId}
                  >
                    <option value="">페이지 선택</option>
                    {draftPages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>유형 1</span>
                  <select
                    value={draft.type1}
                    onChange={(event) =>
                      setDraftField("type1", event.target.value as typeof draft.type1)
                    }
                  >
                    {REPORT_TYPE1_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>유형 2</span>
                  <select
                    value={draft.type2}
                    onChange={(event) =>
                      setDraftField("type2", event.target.value as typeof draft.type2)
                    }
                  >
                    {REPORT_TYPE2_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={styles.field}>
                <span>업무 내용</span>
                <textarea
                  rows={6}
                  value={draft.content}
                  onChange={(event) => setDraftField("content", event.target.value)}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>메모</span>
                <textarea
                  rows={4}
                  value={draft.note}
                  onChange={(event) => setDraftField("note", event.target.value)}
                />
              </label>

              <div className={styles.actionRow}>
                <button type="submit" className={styles.primaryButton}>
                  저장
                </button>
                <button type="button" className={styles.secondaryButton} onClick={resetDraft}>
                  초기화
                </button>
                {selectedReport && (
                  <button
                    type="button"
                    className={styles.ghostDangerButton}
                    onClick={() => promptDelete(selectedReport.id)}
                  >
                    삭제
                  </button>
                )}
              </div>
            </form>
          </section>

          {pendingDeleteId && selectedReport?.id === pendingDeleteId && (
            <section className={styles.dangerPanel} role="alert">
              <div>
                <p className={styles.panelEyebrow}>삭제 확인</p>
                <h2 className={styles.panelTitle}>이 보고서를 삭제합니다.</h2>
                <p className={styles.description}>
                  삭제 후에는 다시 불러올 수 없습니다. 선택한 보고서만 제거됩니다.
                </p>
              </div>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.ghostDangerButton}
                  onClick={confirmDelete}
                >
                  삭제 확정
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={cancelDelete}
                >
                  취소
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}

export default ReportsPage;

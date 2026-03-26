import type { FormEvent } from "react";

import {
  formatReportDate,
  formatReportHours,
  getTodayInputValue,
  type ReportViewModel,
} from "./report-domain";
import { useReportsSlice } from "./use-reports-slice";
import styles from "./reports-page.module.css";

function renderReportTable(
  rows: ReportViewModel[],
  options: {
    onSelect: (id: string) => void;
    selectedReportId: string | null;
    emptyMessage: string;
  },
) {
  const { onSelect, selectedReportId, emptyMessage } = options;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>업무 보고 목록</caption>
        <thead>
          <tr>
            <th scope="col">일자</th>
            <th scope="col">프로젝트 / 페이지</th>
            <th scope="col">TYPE</th>
            <th scope="col">시간</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((report) => {
            const isSelected = selectedReportId === report.id;

            return (
              <tr key={report.id} data-active={isSelected || undefined}>
                <td>
                  <button type="button" className={styles.rowButton} onClick={() => onSelect(report.id)}>
                    {formatReportDate(report.reportDate)}
                  </button>
                </td>
                <td>
                  <strong>{report.projectDisplayName}</strong>
                  <span>{report.pageDisplayName}</span>
                </td>
                <td>
                  <strong>{report.type1}</strong>
                  <span>{report.type2}</span>
                </td>
                <td>{formatReportHours(report.workHours)}</td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan={4} className={styles.emptyState}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsPage() {
  const {
    draft,
    isSaving,
    draftPages,
    filteredProjectOptions,
    periodFilters,
    periodReports,
    projectOptions,
    saveDraft,
    selectReport,
    selectedReport,
    selectedReportId,
    setDraftField,
    setPeriodField,
    setProjectQuery,
    projectQuery,
    startNewReport,
    statusMessage,
    type1Options,
    type2Options,
  } = useReportsSlice();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveDraft();
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>업무 보고</h1>
      </header>

      <div className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{selectedReport ? "내용 수정" : "새 업무내용 작성"}</h2>
            <button type="button" className={styles.secondaryButton} onClick={startNewReport}>
              신규 작성
            </button>
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>일자</span>
                <input
                  type="date"
                  value={draft.reportDate}
                  onChange={(event) => setDraftField("reportDate", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>프로젝트 검색</span>
                <input
                  value={projectQuery}
                  onChange={(event) => setProjectQuery(event.target.value)}
                  placeholder="검색..."
                />
              </label>

              <label className={styles.field}>
                <span>프로젝트</span>
                <select
                  value={draft.projectId}
                  onChange={(event) => setDraftField("projectId", event.target.value)}
                >
                  <option value="">선택</option>
                  {filteredProjectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>페이지</span>
                <select
                  value={draft.pageId}
                  onChange={(event) => setDraftField("pageId", event.target.value)}
                  disabled={!draft.projectId}
                >
                  <option value="">선택</option>
                  {draftPages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>분류</span>
                <div className={styles.splitRow}>
                  <select
                    value={draft.type1}
                    onChange={(event) => setDraftField("type1", event.target.value as any)}
                  >
                    {type1Options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <select
                    value={draft.type2}
                    onChange={(event) => setDraftField("type2", event.target.value as any)}
                  >
                    {type2Options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </label>

              <label className={styles.field}>
                <span>시간 (H)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={draft.workHours}
                  onChange={(event) => setDraftField("workHours", event.target.value)}
                />
              </label>
            </div>

            <label className={styles.field} style={{ marginTop: "1rem" }}>
              <span>업무 요약</span>
              <textarea
                value={draft.content}
                onChange={(event) => setDraftField("content", event.target.value)}
                rows={3}
              />
            </label>

            <div className={styles.actionRow}>
              <span className={styles.statusMsg}>{statusMessage}</span>
              <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                보고서 저장
              </button>
            </div>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>보고 이력 및 조회</h2>
            <div className={styles.filterRow}>
              <input
                type="date"
                value={periodFilters.startDate}
                onChange={(e) => setPeriodField("startDate", e.target.value)}
              />
              <span>~</span>
              <input
                type="date"
                value={periodFilters.endDate}
                onChange={(e) => setPeriodField("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>일자</th>
                  <th style={{ width: "35%" }}>프로젝트 / 페이지</th>
                  <th style={{ width: "35%" }}>분류</th>
                  <th style={{ width: "15%" }}>시간</th>
                </tr>
              </thead>
              <tbody>
                {periodReports.map((report) => (
                  <tr 
                    key={report.id} 
                    onClick={() => selectReport(report.id)}
                    data-active={selectedReportId === report.id || undefined}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="tabularNums">{formatReportDate(report.reportDate)}</td>
                    <td>
                      <strong>{report.projectDisplayName}</strong>
                      <span className={styles.subText}>{report.pageDisplayName}</span>
                    </td>
                    <td>
                      <strong>{report.type1}</strong>
                      <span className={styles.subText}>{report.type2}</span>
                    </td>
                    <td className="tabularNums">{formatReportHours(report.workHours)}</td>
                  </tr>
                ))}
                {!periodReports.length && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>조회된 보고 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

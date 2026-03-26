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
    activeTab,
    clearPeriodFilters,
    draft,
    isSaving,
    draftPages,
    filteredProjectOptions,
    jumpDraftDate,
    periodFilters,
    periodReports,
    projectOptions,
    projectQuery,
    recentReports,
    resetDraft,
    saveDraft,
    selectReport,
    selectedReport,
    selectedReportId,
    setActiveTab,
    setDraftField,
    setPeriodField,
    setProjectQuery,
    startNewReport,
    statusMessage,
    type1Options,
    type2Options,
  } = useReportsSlice();

  const selectedProject = projectOptions.find((project) => project.id === draft.projectId) ?? null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveDraft();
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <h1 className={styles.title}>업무 보고</h1>
        </div>
      </header>

      <div className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{selectedReport ? "내용 수정" : "새 업무내용 작성"}</h2>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.secondaryButton} onClick={startNewReport}>
                신규 작성
              </button>
            </div>
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <fieldset className={styles.section}>
              <legend className={styles.sectionTitle}>기본 정보</legend>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>일자</span>
                  <div className={styles.dateRow}>
                    <input
                      type="date"
                      value={draft.reportDate}
                      onChange={(event) => setDraftField("reportDate", event.target.value)}
                    />
                    <div className={styles.dateActions}>
                      <button type="button" className={styles.chipButton} onClick={() => setDraftField("reportDate", getTodayInputValue())}>
                        오늘
                      </button>
                    </div>
                  </div>
                </label>

                <label className={styles.field}>
                  <span>프로젝트 / 서비스 검색</span>
                  <input
                    value={projectQuery}
                    onChange={(event) => setProjectQuery(event.target.value)}
                    placeholder="검색어 입력..."
                  />
                </label>

                <label className={styles.field}>
                  <span>대상 프로젝트 선택</span>
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
                  <span>대상 페이지 선택</span>
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
              </div>
            </fieldset>

            <fieldset className={styles.section}>
              <legend className={styles.sectionTitle}>업무 내용 상세</legend>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>업무 구분 (TYPE 1 / 2)</span>
                  <div className={styles.splitRow}>
                    <select
                      value={draft.type1}
                      onChange={(event) => setDraftField("type1", event.target.value as typeof draft.type1)}
                    >
                      {type1Options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <select
                      value={draft.type2}
                      onChange={(event) => setDraftField("type2", event.target.value as typeof draft.type2)}
                    >
                      {type2Options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className={styles.field}>
                  <span>소요 시간 (H)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={draft.workHours}
                    onChange={(event) => setDraftField("workHours", event.target.value)}
                  />
                </label>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>수행 업무 요약</span>
                  <textarea
                    value={draft.content}
                    onChange={(event) => setDraftField("content", event.target.value)}
                    placeholder="수행한 업무 내용을 입력하세요."
                  />
                </label>
              </div>
            </fieldset>

            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                보고서 저장
              </button>
            </div>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>최근 작성 이력</h2>
            <p className={styles.panelMeta}>{recentReports.length}건</p>
          </div>

          {renderReportTable(recentReports, {
            onSelect: selectReport,
            selectedReportId,
            emptyMessage: "아직 작성한 보고가 없습니다.",
          })}
        </section>
      </div>
    </section>
  );
}

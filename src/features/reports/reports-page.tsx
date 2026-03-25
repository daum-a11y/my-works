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
          <p className={styles.kicker}>업무보고</p>
          <h1 className={styles.title}>개인 업무보고와 기간검색을 한 화면 안에서 처리합니다.</h1>
          <p className={styles.description}>
            기본 입력과 TYPE 입력을 분리해 기록하고, 같은 화면에서 과거 보고를 불러오거나 기간별로 다시 확인할 수 있습니다.
          </p>
          <p className={styles.status}>{statusMessage}</p>
        </div>

        <div className={styles.tabList} role="tablist" aria-label="보고 탭">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "report"}
            className={styles.tabButton}
            data-active={activeTab === "report" || undefined}
            onClick={() => setActiveTab("report")}
          >
            업무보고
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "period"}
            className={styles.tabButton}
            data-active={activeTab === "period" || undefined}
            onClick={() => setActiveTab("period")}
          >
            기간검색
          </button>
        </div>
      </header>

      {activeTab === "report" ? (
        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>업무보고</p>
                <h2 className={styles.panelTitle}>{selectedReport ? "보고 수정" : "새 보고 작성"}</h2>
              </div>

              <div className={styles.buttonRow}>
                <button type="button" className={styles.secondaryButton} onClick={startNewReport}>
                  새 입력
                </button>
                <button type="button" className={styles.secondaryButton} onClick={resetDraft}>
                  초기화
                </button>
              </div>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <fieldset className={styles.section}>
                <legend className={styles.sectionTitle}>기본 입력</legend>
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
                        <button type="button" className={styles.chipButton} onClick={() => jumpDraftDate(-1)}>
                          -1
                        </button>
                        <button type="button" className={styles.chipButton} onClick={() => jumpDraftDate(1)}>
                          +1
                        </button>
                        <button type="button" className={styles.chipButton} onClick={() => jumpDraftDate(-7)}>
                          -7
                        </button>
                        <button type="button" className={styles.chipButton} onClick={() => jumpDraftDate(7)}>
                          +7
                        </button>
                        <button
                          type="button"
                          className={styles.chipButton}
                          onClick={() => setDraftField("reportDate", getTodayInputValue())}
                        >
                          오늘
                        </button>
                      </div>
                    </div>
                  </label>

                  <label className={styles.field}>
                    <span>프로젝트 검색</span>
                    <input
                      value={projectQuery}
                      onChange={(event) => setProjectQuery(event.target.value)}
                      placeholder="서비스그룹 / 서비스명"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>프로젝트 선택</span>
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
                    <span>페이지 선택</span>
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

                <p className={styles.fieldHint}>
                  {selectedProject ? selectedProject.label : "프로젝트를 먼저 선택하면 페이지 목록이 좁혀집니다."}
                </p>
              </fieldset>

              <fieldset className={styles.section}>
                <legend className={styles.sectionTitle}>TYPE 입력</legend>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>TYPE 1</span>
                    <select
                      value={draft.type1}
                      onChange={(event) => setDraftField("type1", event.target.value as typeof draft.type1)}
                    >
                      {type1Options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>TYPE 2</span>
                    <select
                      value={draft.type2}
                      onChange={(event) => setDraftField("type2", event.target.value as typeof draft.type2)}
                    >
                      {type2Options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>시간</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={draft.workHours}
                      onChange={(event) => setDraftField("workHours", event.target.value)}
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className={styles.section}>
                <legend className={styles.sectionTitle}>업무 내용</legend>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>업무</span>
                    <textarea
                      value={draft.content}
                      onChange={(event) => setDraftField("content", event.target.value)}
                      placeholder="무엇을 했는지 간단히 기록합니다."
                    />
                  </label>

                  <label className={styles.field}>
                    <span>메모</span>
                    <textarea
                      value={draft.note}
                      onChange={(event) => setDraftField("note", event.target.value)}
                      placeholder="추가 메모가 있으면 남깁니다."
                    />
                  </label>
                </div>
              </fieldset>

              <div className={styles.actionRow}>
                <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                  저장
                </button>
                <button type="button" className={styles.secondaryButton} onClick={startNewReport}>
                  새 보고
                </button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>최근 보고</p>
                <h2 className={styles.panelTitle}>불러올 보고서</h2>
              </div>
              <p className={styles.panelMeta}>{recentReports.length}건</p>
            </div>

            {renderReportTable(recentReports, {
              onSelect: selectReport,
              selectedReportId,
              emptyMessage: "아직 작성한 보고가 없습니다.",
            })}
          </section>
        </div>
      ) : (
        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>기간검색</p>
                <h2 className={styles.panelTitle}>날짜 범위로 보고를 찾습니다.</h2>
              </div>
              <button type="button" className={styles.secondaryButton} onClick={clearPeriodFilters}>
                조건 초기화
              </button>
            </div>

            <div className={styles.filterGrid}>
                    <label className={styles.field}>
                      <span>시작일</span>
                      <input
                        type="date"
                        value={periodFilters.startDate}
                  onChange={(event) => setPeriodField("startDate", event.target.value)}
                />
              </label>

                    <label className={styles.field}>
                      <span>종료일</span>
                      <input
                        type="date"
                        value={periodFilters.endDate}
                        onChange={(event) => setPeriodField("endDate", event.target.value)}
                      />
                    </label>
                  </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.panelEyebrow}>검색 결과</p>
                <h2 className={styles.panelTitle}>기간 내 보고</h2>
              </div>
              <p className={styles.panelMeta}>{periodReports.length}건</p>
            </div>

            {renderReportTable(periodReports, {
              onSelect: selectReport,
              selectedReportId,
              emptyMessage: "선택한 기간에 해당하는 보고가 없습니다.",
            })}
          </section>
        </div>
      )}
    </section>
  );
}

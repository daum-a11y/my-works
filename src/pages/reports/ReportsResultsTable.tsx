import { formatReportDate, formatReportTaskUsedtime, type ReportViewModel } from './reportUtils';

interface ReportsResultsTableProps {
  rows: ReportViewModel[];
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
}

export function ReportsResultsTable({
  rows,
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
}: ReportsResultsTableProps) {
  const totalMinutes = rows.reduce((sum, report) => sum + report.taskUsedtime, 0);
  const missingMinutes = Math.max(480 - totalMinutes, 0);
  const canAddOverhead = Boolean(summaryDate) && missingMinutes > 0;

  return (
    <>
      <div className="reports-page__table-wrap">
        <table className="reports-page__table">
          <caption className="sr-only">업무 보고 목록</caption>
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
                      <button
                        type="button"
                        className="reports-page__row-button"
                        onClick={onSaveEdit}
                      >
                        저장
                      </button>
                    ) : (
                      <>
                        {canEdit ? (
                          <button
                            type="button"
                            className="reports-page__row-button"
                            onClick={() => onSelect(report.id)}
                          >
                            수정
                          </button>
                        ) : null}
                        {canEdit ? (
                          <button
                            type="button"
                            className="reports-page__row-button"
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
                <td colSpan={13} className="reports-page__empty-state">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {missingMinutes > 0 ? (
        <div className="reports-page__table-footer">
          <p className="reports-page__table-footer-text">
            부족한 시간 <strong>{missingMinutes}분</strong>
          </p>
          {canEdit && canAddOverhead ? (
            <button
              type="button"
              className="reports-page__button reports-page__button--secondary"
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

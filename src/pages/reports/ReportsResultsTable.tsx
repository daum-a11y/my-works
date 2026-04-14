import { Button, Select } from 'krds-react';
import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import { formatReportDate, formatReportTaskUsedtime, type ReportViewModel } from './reportUtils';

interface ReportsResultsTableProps {
  rows: ReportViewModel[];
  canEdit: boolean;
  selectedReportId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOverhead: (date: string, remainingMinutes: number) => void;
  summaryDate: string;
  overheadCostGroupId: string;
  costGroupOptions: Array<{ id: string; name: string }>;
  onOverheadCostGroupChange: (value: string) => void;
  emptyMessage: string;
}

export function ReportsResultsTable({
  rows,
  canEdit,
  selectedReportId,
  onSelect,
  onDelete,
  onOverhead,
  summaryDate,
  overheadCostGroupId,
  costGroupOptions,
  onOverheadCostGroupChange,
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
              <th scope="col">서비스 그룹</th>
              <th scope="col">서비스명</th>
              <th scope="col">프로젝트명</th>
              <th scope="col">태스크명</th>
              <th scope="col">업무명</th>
              <th scope="col">URL</th>
              <th scope="col">시간</th>
              <th scope="col">비고</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((report) => {
              return (
                <tr key={report.id} data-active={selectedReportId === report.id || undefined}>
                  <td>{formatReportDate(report.reportDate)}</td>
                  <td>
                    <strong>{report.costGroupName || '-'}</strong>
                  </td>
                  <td>
                    <strong>{report.type1}</strong>
                  </td>
                  <td>
                    <strong>{report.type2}</strong>
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
                    <strong>{report.subtaskDisplayName}</strong>
                  </td>
                  <td>
                    <strong>{report.content || '-'}</strong>
                  </td>
                  <td>
                    {report.url ? (
                      <a href={report.url} target="_blank" rel="noreferrer">
                        {report.url}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{formatReportTaskUsedtime(report.taskUsedtime)}</td>
                  <td>{report.note || '-'}</td>
                  <td>
                    <>
                      {canEdit ? (
                        <Button
                          type="button"
                          className="reports-page__row-button"
                          variant="secondary"
                          onClick={() => onSelect(report.id)}
                        >
                          수정
                        </Button>
                      ) : null}
                      {canEdit ? (
                        <Button
                          type="button"
                          className="reports-page__row-button"
                          variant="secondary"
                          onClick={() => onDelete(report.id)}
                        >
                          삭제
                        </Button>
                      ) : null}
                    </>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <TableEmptyRow colSpan={14} message={emptyMessage} />}
          </tbody>
        </table>
      </div>
      {missingMinutes > 0 ? (
        <div className="reports-page__table-footer">
          <p className="reports-page__table-footer-text">
            오늘 총 입력 <strong>{totalMinutes}분</strong> / 부족{' '}
            <strong>{missingMinutes}분</strong>
          </p>
          {canEdit ? (
            <label className="reports-page__table-footer-field">
              <span>청구그룹</span>
              <Select
                value={overheadCostGroupId}
                onChange={onOverheadCostGroupChange}
                options={[
                  { value: '', label: '선택' },
                  ...costGroupOptions.map((group) => ({ value: group.id, label: group.name })),
                ]}
                style={{ width: '100%' }}
              />
            </label>
          ) : null}
          {canEdit && canAddOverhead ? (
            <Button type="button" variant="secondary" onClick={() => onOverhead(summaryDate, missingMinutes)}>
              오버헤드 등록
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

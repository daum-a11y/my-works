import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import type { SearchTaskRow } from '../../types/domain';
import { formatReportDate, formatReportTaskUsedtime } from '../reports/reportUtils';

interface SearchResultsTableProps {
  reports: SearchTaskRow[];
}

export function SearchResultsTable({ reports }: SearchResultsTableProps) {
  return (
    <section className="search-page__panel">
      <div className="search-page__table-wrap">
        <table className="search-page__table">
          <caption className="sr-only">업무 리스트 테이블</caption>
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
              <th scope="col">페이지명</th>
              <th scope="col">내용</th>
              <th scope="col">URL</th>
              <th scope="col">작업시간</th>
              <th scope="col">비고</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="search-page__table-number">{formatReportDate(report.taskDate)}</td>
                <td>
                  <strong>{report.costGroupName || '-'}</strong>
                </td>
                <td>
                  <strong>{report.taskType1}</strong>
                </td>
                <td>
                  <strong>{report.taskType2}</strong>
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
                  <strong>{report.pageDisplayName || '-'}</strong>
                </td>
                <td>{report.content || '-'}</td>
                <td>
                  {report.pageUrl ? (
                    <a href={report.pageUrl} target="_blank" rel="noreferrer">
                      링크
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="search-page__table-number">
                  {formatReportTaskUsedtime(report.taskUsedtime)}
                </td>
                <td>{report.note || '-'}</td>
              </tr>
            ))}
            {!reports.length ? (
              <TableEmptyRow
                colSpan={13}
                className="search-page__empty-state"
                message="검색 결과가 없습니다."
              />
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

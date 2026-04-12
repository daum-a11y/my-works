import { SortableTableHeaderButton, TableEmptyRow } from '../../components/shared';
import type { SearchTaskRow } from '../../types/domain';
import { formatReportDate, formatReportTaskUsedtime } from '../reports/reportUtils';
import type { SearchSortState } from './SearchPage.types';

interface SearchResultsTableProps {
  reports: SearchTaskRow[];
  sortState: SearchSortState;
  onSortChange: (next: SearchSortState) => void;
}

export function SearchResultsTable({ reports, sortState, onSortChange }: SearchResultsTableProps) {
  const getAriaSort = (key: SearchSortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="search-page__table-wrap">
      <table className="search-page__table">
        <caption className="sr-only">업무 리스트 테이블</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={getAriaSort('taskDate')}>
              <SortableTableHeaderButton
                label="일자"
                sortKey="taskDate"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('costGroup')}>
              <SortableTableHeaderButton
                label="청구그룹"
                sortKey="costGroup"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('taskType1')}>
              <SortableTableHeaderButton
                label="타입1"
                sortKey="taskType1"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('taskType2')}>
              <SortableTableHeaderButton
                label="타입2"
                sortKey="taskType2"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('platform')}>
              <SortableTableHeaderButton
                label="플랫폼"
                sortKey="platform"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('serviceGroup')}>
              <SortableTableHeaderButton
                label="서비스 그룹"
                sortKey="serviceGroup"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('serviceName')}>
              <SortableTableHeaderButton
                label="서비스명"
                sortKey="serviceName"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('projectName')}>
              <SortableTableHeaderButton
                label="프로젝트명"
                sortKey="projectName"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('subtaskTitle')}>
              <SortableTableHeaderButton
                label="과업명"
                sortKey="subtaskTitle"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col">내용</th>
            <th scope="col">URL</th>
            <th scope="col" aria-sort={getAriaSort('taskUsedtime')}>
              <SortableTableHeaderButton
                label="작업시간"
                sortKey="taskUsedtime"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
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
                <strong>{report.projectName || '-'}</strong>
              </td>
              <td>
                <strong>{report.subtaskTitle || '-'}</strong>
              </td>
              <td>{report.content || '-'}</td>
              <td>
                {report.url ? (
                  <a href={report.url} target="_blank" rel="noreferrer">
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
            <TableEmptyRow colSpan={13} message="검색 조건에 맞는 업무보고가 없습니다." />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

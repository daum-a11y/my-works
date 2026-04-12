import { TableEmptyRow } from '../../components/shared';
import type { QaStatsProjectRow } from '../../types/domain';
import { formatMonthLabel, monthKeyFromDate } from './QaStatsPage.utils';

interface QaStatsProjectsTableProps {
  projects: readonly QaStatsProjectRow[];
}

export function QaStatsProjectsTable({ projects }: QaStatsProjectsTableProps) {
  return (
    <div className={'stats-page__table-wrap'}>
      <table className={'stats-page__table'}>
        <caption className={'sr-only'}>필터링된 QA 프로젝트 목록</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col">청구그룹</th>
            <th scope="col">서비스 그룹</th>
            <th scope="col">프로젝트명</th>
            <th scope="col">리포터</th>
            <th scope="col">보고서URL</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{formatMonthLabel(monthKeyFromDate(project.endDate))}</td>
              <td>{project.costGroupName || '-'}</td>
              <td>{project.serviceGroupName || '-'}</td>
              <td>{project.name || '-'}</td>
              <td>{project.reporterDisplay || '-'}</td>
              <td>
                {project.reportUrl ? (
                  <a
                    href={project.reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={'stats-page__link'}
                  >
                    링크
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
          {!projects.length ? (
            <TableEmptyRow
              colSpan={6}
              className={'stats-page__empty'}
              message="조건에 맞는 QA 내역이 없습니다."
            />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

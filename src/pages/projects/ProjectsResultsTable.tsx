import { Link } from 'react-router-dom';
import { TableEmptyRow } from '../../components/shared/TableEmptyRow';
import type { ProjectListRow } from '../../types/domain';
import { formatDateLabel } from '../../utils';

interface ProjectsResultsTableProps {
  projects: ProjectListRow[];
}

export function ProjectsResultsTable({ projects }: ProjectsResultsTableProps) {
  return (
    <div className="projects-feature__table-wrap">
      <table className="projects-feature__table">
        <caption className="sr-only">프로젝트 리스트</caption>
        <thead>
          <tr>
            <th scope="col">타입1</th>
            <th scope="col">플랫폼</th>
            <th scope="col">서비스 그룹</th>
            <th scope="col">프로젝트명</th>
            <th scope="col">페이지 수</th>
            <th scope="col">보고서URL</th>
            <th scope="col">QA시작일</th>
            <th scope="col">QA종료일</th>
            <th scope="col">리포터</th>
            <th scope="col">리뷰어</th>
            <th scope="col">수정</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.taskType1 || '-'}</td>
              <td>{project.platform || '-'}</td>
              <td>{project.serviceGroupName || '-'}</td>
              <td>{project.name}</td>
              <td>{project.pageCount}</td>
              <td>
                {project.reportUrl ? (
                  <a
                    href={project.reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="projects-feature__table-link"
                  >
                    링크
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="projects-feature__date-cell">{formatDateLabel(project.startDate)}</td>
              <td className="projects-feature__date-cell">{formatDateLabel(project.endDate)}</td>
              <td>{project.reporterDisplay || '-'}</td>
              <td>{project.reviewerDisplay || '-'}</td>
              <td>
                <Link
                  to={`/projects/${project.id}/edit`}
                  className="projects-feature__action-button"
                >
                  수정
                </Link>
              </td>
            </tr>
          ))}
          {!projects.length ? (
            <TableEmptyRow
              colSpan={11}
              className="projects-feature__empty-state"
              message="검색 결과가 없습니다. 새 프로젝트를 등록하거나 기간을 조정하십시오."
            />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

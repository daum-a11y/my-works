import { TableEmptyRow } from '../../components/shared/TableEmptyRow';

interface DashboardProjectRow {
  projectId: string;
  type1: string | null;
  platform: string | null;
  costGroupName: string | null;
  serviceGroupName: string | null;
  projectName: string | null;
  startDate: string;
  endDate: string;
}

interface DashboardProjectsTableProps {
  projects: readonly DashboardProjectRow[];
}

export function DashboardProjectsTable({ projects }: DashboardProjectsTableProps) {
  return (
    <section className="dashboard-page__section">
      <div className="dashboard-page__section-head">
        <h2 className="dashboard-page__section-title">진행중인 프로젝트 목록</h2>
      </div>
      <div className="dashboard-page__table-wrap">
        <table className="dashboard-page__table">
          <caption className="sr-only">진행중인 프로젝트 목록</caption>
          <thead>
            <tr>
              <th scope="col">청구그룹</th>
              <th scope="col">타입1</th>
              <th scope="col">서비스 그룹</th>
              <th scope="col">프로젝트명</th>
              <th scope="col">플랫폼</th>
              <th scope="col">시작일</th>
              <th scope="col">종료일</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((item) => (
              <tr key={item.projectId}>
                <td>{item.costGroupName || '-'}</td>
                <td>{item.type1 || '-'}</td>
                <td>{item.serviceGroupName || '-'}</td>
                <td>{item.projectName || '-'}</td>
                <td>{item.platform || '-'}</td>
                <td>{item.startDate}</td>
                <td>{item.endDate}</td>
              </tr>
            ))}
            {!projects.length ? (
              <TableEmptyRow colSpan={7} message="진행중인 프로젝트가 없습니다." />
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

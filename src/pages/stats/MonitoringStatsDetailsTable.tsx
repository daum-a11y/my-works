import { Link } from 'react-router-dom';
import { type MonitoringStatsRow } from '../../types/domain';
import { TableEmptyRow } from '../../components/shared';
import {
  formatMonthLabel,
  formatTrackStatus,
  monthKeyFromMonitoringMonth,
} from './MonitoringStatsPage.utils';

interface MonitoringStatsDetailsTableProps {
  rows: MonitoringStatsRow[];
  hoveredNoteSubtaskId: string | null;
  pinnedNoteSubtaskId: string | null;
  onHoveredNoteSubtaskIdChange: (value: string | null) => void;
  onPinnedNoteSubtaskIdChange: (value: string | null) => void;
}

export function MonitoringStatsDetailsTable({
  rows,
  hoveredNoteSubtaskId,
  pinnedNoteSubtaskId,
  onHoveredNoteSubtaskIdChange,
  onPinnedNoteSubtaskIdChange,
}: MonitoringStatsDetailsTableProps) {
  const isNoteOpen = (subtaskId: string) =>
    hoveredNoteSubtaskId === subtaskId || pinnedNoteSubtaskId === subtaskId;

  return (
    <div className={'stats-page__table-wrap'}>
      <table className={'stats-page__table'}>
        <caption className={'sr-only'}>필터링된 모니터링 과업 목록</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col">청구그룹</th>
            <th scope="col">서비스 그룹</th>
            <th scope="col">프로젝트명</th>
            <th scope="col">플랫폼</th>
            <th scope="col">과업명</th>
            <th scope="col">담당자</th>
            <th scope="col">상태</th>
            <th scope="col">비고</th>
            <th scope="col">보고서URL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.subtaskId}>
              <td>{formatMonthLabel(monthKeyFromMonitoringMonth(row.monitoringMonth))}</td>
              <td>{row.costGroupName || '-'}</td>
              <td>{row.serviceGroupName || '-'}</td>
              <td>
                {row.projectId && row.projectName ? (
                  <Link to={`/projects/${row.projectId}/edit`} className={'stats-page__link'}>
                    {row.projectName}
                  </Link>
                ) : (
                  row.projectName || '-'
                )}
              </td>
              <td>{row.platform || '-'}</td>
              <td>{row.title}</td>
              <td>{row.assigneeDisplay || '-'}</td>
              <td>
                <span className="stats-page__status-badge" data-status={row.trackStatus}>
                  {formatTrackStatus(row.trackStatus)}
                </span>
              </td>
              <td>
                {row.note ? (
                  <div
                    className={'stats-page__note-cell'}
                    onMouseEnter={() => onHoveredNoteSubtaskIdChange(row.subtaskId)}
                    onMouseLeave={() =>
                      onHoveredNoteSubtaskIdChange(
                        hoveredNoteSubtaskId === row.subtaskId &&
                          pinnedNoteSubtaskId !== row.subtaskId
                          ? null
                          : hoveredNoteSubtaskId,
                      )
                    }
                    onFocusCapture={() => onHoveredNoteSubtaskIdChange(row.subtaskId)}
                    onBlurCapture={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        onHoveredNoteSubtaskIdChange(
                          hoveredNoteSubtaskId === row.subtaskId &&
                            pinnedNoteSubtaskId !== row.subtaskId
                            ? null
                            : hoveredNoteSubtaskId,
                        );
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={[
                        'stats-page__note-toggle',
                        isNoteOpen(row.subtaskId) ? 'stats-page__note-toggle--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-expanded={isNoteOpen(row.subtaskId)}
                      aria-label={`${row.title} 내용 보기`}
                      onClick={() => {
                        onPinnedNoteSubtaskIdChange(
                          pinnedNoteSubtaskId === row.subtaskId ? null : row.subtaskId,
                        );
                        onHoveredNoteSubtaskIdChange(row.subtaskId);
                      }}
                    >
                      내용 보기
                    </button>
                    {isNoteOpen(row.subtaskId) ? (
                      <div className={'stats-page__note-popover'} role="tooltip">
                        {row.note}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td>
                {row.reportUrl ? (
                  <a
                    href={row.reportUrl}
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
          {!rows.length ? (
            <TableEmptyRow colSpan={10} message="조건에 맞는 모니터링 내역이 없습니다." />
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

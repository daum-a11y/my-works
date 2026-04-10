import { pageStatusOptions, type MonitoringStatsRow, type PageStatus } from '../../types/domain';
import {
  formatMonthLabel,
  formatTrackStatus,
  monthKeyFromMonitoringMonth,
} from './MonitoringStatsPage.utils';

interface MonitoringStatsDetailsTableProps {
  rows: MonitoringStatsRow[];
  editingPageId: string | null;
  draftStatus: PageStatus;
  draftNote: string;
  hoveredNotePageId: string | null;
  pinnedNotePageId: string | null;
  savePending: boolean;
  onDraftStatusChange: (value: PageStatus) => void;
  onDraftNoteChange: (value: string) => void;
  onHoveredNotePageIdChange: (value: string | null) => void;
  onPinnedNotePageIdChange: (value: string | null) => void;
  onStartEdit: (row: MonitoringStatsRow) => void;
  onSave: (row: MonitoringStatsRow) => void;
  onCancel: () => void;
}

export function MonitoringStatsDetailsTable({
  rows,
  editingPageId,
  draftStatus,
  draftNote,
  hoveredNotePageId,
  pinnedNotePageId,
  savePending,
  onDraftStatusChange,
  onDraftNoteChange,
  onHoveredNotePageIdChange,
  onPinnedNotePageIdChange,
  onStartEdit,
  onSave,
  onCancel,
}: MonitoringStatsDetailsTableProps) {
  const isNoteOpen = (pageId: string) =>
    hoveredNotePageId === pageId || pinnedNotePageId === pageId;

  return (
    <div className={'stats-page__table-wrap'}>
      <table className={'stats-page__table'}>
        <caption className={'sr-only'}>필터링된 모니터링 페이지 목록</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col">플랫폼</th>
            <th scope="col">서비스그룹</th>
            <th scope="col">프로젝트명</th>
            <th scope="col">페이지명</th>
            <th scope="col">담당자</th>
            <th scope="col">상태</th>
            <th scope="col">비고</th>
            <th scope="col">보고서URL</th>
            <th scope="col">수정</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.pageId}>
              <td>{formatMonthLabel(monthKeyFromMonitoringMonth(row.monitoringMonth))}</td>
              <td>{row.platform || '-'}</td>
              <td>{row.serviceGroupName || '-'}</td>
              <td>{row.projectName || '-'}</td>
              <td>{row.title}</td>
              <td>{row.assigneeDisplay || '-'}</td>
              <td>
                {editingPageId === row.pageId ? (
                  <select
                    aria-label={`${row.title} 상태`}
                    className={'stats-page__inline-select'}
                    value={draftStatus}
                    onChange={(event) => onDraftStatusChange(event.target.value as PageStatus)}
                  >
                    {pageStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatTrackStatus(status)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="stats-page__status-badge" data-status={row.trackStatus}>
                    {formatTrackStatus(row.trackStatus)}
                  </span>
                )}
              </td>
              <td>
                {editingPageId === row.pageId ? (
                  <textarea
                    aria-label={`${row.title} 비고`}
                    className={'stats-page__inline-textarea'}
                    value={draftNote}
                    onChange={(event) => onDraftNoteChange(event.target.value)}
                    rows={3}
                  />
                ) : row.note ? (
                  <div
                    className={'stats-page__note-cell'}
                    onMouseEnter={() => onHoveredNotePageIdChange(row.pageId)}
                    onMouseLeave={() =>
                      onHoveredNotePageIdChange(
                        hoveredNotePageId === row.pageId && pinnedNotePageId !== row.pageId
                          ? null
                          : hoveredNotePageId,
                      )
                    }
                    onFocusCapture={() => onHoveredNotePageIdChange(row.pageId)}
                    onBlurCapture={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        onHoveredNotePageIdChange(
                          hoveredNotePageId === row.pageId && pinnedNotePageId !== row.pageId
                            ? null
                            : hoveredNotePageId,
                        );
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={[
                        'stats-page__note-toggle',
                        isNoteOpen(row.pageId) ? 'stats-page__note-toggle--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-expanded={isNoteOpen(row.pageId)}
                      aria-label={`${row.title} 내용 보기`}
                      onClick={() => {
                        onPinnedNotePageIdChange(
                          pinnedNotePageId === row.pageId ? null : row.pageId,
                        );
                        onHoveredNotePageIdChange(row.pageId);
                      }}
                    >
                      내용 보기
                    </button>
                    {isNoteOpen(row.pageId) ? (
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
              <td>
                {editingPageId === row.pageId ? (
                  <div className={'stats-page__inline-actions'}>
                    <button
                      type="button"
                      className={'stats-page__inline-action stats-page__inline-action--primary'}
                      onClick={() => onSave(row)}
                      disabled={savePending}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className={'stats-page__inline-action stats-page__inline-action--secondary'}
                      onClick={onCancel}
                      disabled={savePending}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={'stats-page__inline-action stats-page__inline-action--primary'}
                    onClick={() => onStartEdit(row)}
                  >
                    수정
                  </button>
                )}
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={10} className={'stats-page__empty'}>
                조건에 맞는 모니터링 내역이 없습니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

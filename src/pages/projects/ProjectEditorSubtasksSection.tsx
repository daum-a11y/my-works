import { Fragment, useState, type FormEvent } from 'react';
import { EmptyState } from '../../components/shared/EmptyState';
import { subtaskStatusOptions, type ProjectSubtask, type SubtaskStatus } from '../../types/domain';
import type { SubtaskFormState } from './ProjectEditorPage.types';

interface ProjectEditorSubtasksSectionProps {
  subtaskAddOpen: boolean;
  newSubtaskDraft: SubtaskFormState | null;
  selectedProjectSubtasks: ProjectSubtask[];
  subtaskDrafts: Record<string, SubtaskFormState>;
  members: Array<{ id: string; accountId: string; name: string }>;
  canEditSubtask: (subtask: ProjectSubtask) => boolean;
  canDeleteSubtask: (subtask: ProjectSubtask) => boolean;
  onToggleAdd: () => void;
  onNewSubtaskDraftChange: (patch: Partial<SubtaskFormState>) => void;
  onAddSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubtaskDraftChange: (subtaskId: string, patch: Partial<SubtaskFormState>) => void;
  onSubtaskSave: (subtaskId: string) => void;
  onSubtaskDelete: (subtask: ProjectSubtask) => void;
  savePending: boolean;
  toSubtaskDraft: (subtask: ProjectSubtask) => SubtaskFormState;
}

export function ProjectEditorSubtasksSection({
  subtaskAddOpen,
  newSubtaskDraft,
  selectedProjectSubtasks,
  subtaskDrafts,
  members,
  canEditSubtask,
  canDeleteSubtask,
  onToggleAdd,
  onNewSubtaskDraftChange,
  onAddSubmit,
  onSubtaskDraftChange,
  onSubtaskSave,
  onSubtaskDelete,
  savePending,
  toSubtaskDraft,
}: ProjectEditorSubtasksSectionProps) {
  const addFormId = 'project-subtask-add-form';
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const showSubtaskTable = subtaskAddOpen || selectedProjectSubtasks.length > 0;

  return (
    <section className={'projects-feature__subtask-section'}>
      <div className={'projects-feature__section-header'}>
        <h2 className={'projects-feature__section-title'}>과업 목록</h2>
        <button
          type="button"
          className={'projects-feature__button projects-feature__button--secondary'}
          onClick={onToggleAdd}
          aria-expanded={subtaskAddOpen}
        >
          {subtaskAddOpen ? '추가 취소' : '과업 추가'}
        </button>
      </div>

      {subtaskAddOpen && newSubtaskDraft ? (
        <form
          id={addFormId}
          className={'projects-feature__subtask-add-form'}
          onSubmit={onAddSubmit}
        />
      ) : null}

      {showSubtaskTable ? (
        <div className={'projects-feature__subtask-table-wrap'}>
          <table className={'projects-feature__subtask-table'}>
            <caption className={'sr-only'}>과업 리스트</caption>
            <colgroup>
              <col className="projects-feature__subtask-col-title" />
              <col className="projects-feature__subtask-col-url" />
              <col className="projects-feature__subtask-col-month" />
              <col className="projects-feature__subtask-col-owner" />
              <col className="projects-feature__subtask-col-status" />
              <col className="projects-feature__subtask-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">과업명</th>
                <th scope="col">보고서<br/>URL</th>
                <th scope="col">과업월</th>
                <th scope="col">담당자</th>
                <th scope="col">상태</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {subtaskAddOpen && newSubtaskDraft ? (
                <tr className={'projects-feature__subtask-add-row'}>
                  <td>
                    <div className={'projects-feature__subtask-title-stack'}>
                      <label className={'sr-only'} htmlFor="new-subtask-title">
                        과업명
                      </label>
                      <input
                        id="new-subtask-title"
                        form={addFormId}
                        value={newSubtaskDraft.title}
                        placeholder="과업명"
                        onChange={(event) => onNewSubtaskDraftChange({ title: event.target.value })}
                      />
                      <label className={'sr-only'} htmlFor="new-subtask-note">
                        과업 비고
                      </label>
                      <input
                        id="new-subtask-note"
                        form={addFormId}
                        value={newSubtaskDraft.note}
                        placeholder="비고"
                        onChange={(event) => onNewSubtaskDraftChange({ note: event.target.value })}
                      />
                    </div>
                  </td>
                  <td>
                    <label className={'sr-only'} htmlFor="new-subtask-url">
                      보고서 URL
                    </label>
                    <input
                      id="new-subtask-url"
                      form={addFormId}
                      value={newSubtaskDraft.url}
                      placeholder="보고서 URL"
                      onChange={(event) => onNewSubtaskDraftChange({ url: event.target.value })}
                    />
                  </td>
                  <td>
                    <label className={'sr-only'} htmlFor="new-subtask-month">
                      과업월
                    </label>
                    <input
                      id="new-subtask-month"
                      form={addFormId}
                      type="month"
                      value={newSubtaskDraft.taskMonth}
                      onChange={(event) =>
                        onNewSubtaskDraftChange({ taskMonth: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <label className={'sr-only'} htmlFor="new-subtask-owner">
                      담당자
                    </label>
                    <select
                      id="new-subtask-owner"
                      form={addFormId}
                      value={newSubtaskDraft.ownerMemberId}
                      onChange={(event) =>
                        onNewSubtaskDraftChange({ ownerMemberId: event.target.value })
                      }
                    >
                      <option value="">담당자 선택</option>
                      {members.map((item) => (
                        <option key={item.id} value={item.id}>
                          {[item.accountId, item.name].filter(Boolean).join(' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className={'sr-only'} htmlFor="new-subtask-status">
                      상태
                    </label>
                    <select
                      id="new-subtask-status"
                      form={addFormId}
                      value={newSubtaskDraft.taskStatus}
                      onChange={(event) =>
                        onNewSubtaskDraftChange({
                          taskStatus: event.target.value as SubtaskStatus,
                        })
                      }
                    >
                      {subtaskStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className={'projects-feature__subtask-table-actions'}>
                      <button
                        type="submit"
                        form={addFormId}
                        className={'projects-feature__button projects-feature__button--secondary'}
                        disabled={savePending}
                      >
                        추가
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}
              {selectedProjectSubtasks.map((subtask) => {
                const draft = subtaskDrafts[subtask.id] ?? toSubtaskDraft(subtask);
                const owner = members.find((item) => item.id === subtask.ownerMemberId);
                const ownerText = owner
                  ? [owner.accountId, owner.name].filter(Boolean).join(' ')
                  : '-';
                const isEditing = editingSubtaskId === subtask.id;
                const canEdit = canEditSubtask(subtask);

                return (
                  <Fragment key={subtask.id}>
                    <tr>
                      <td>
                        <div className={'projects-feature__subtask-read-title'}>
                          <strong>{subtask.title}</strong>
                          {subtask.note ? (
                            <span className={'projects-feature__subtask-read-note'}>
                              {subtask.note}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {subtask.url ? (
                          <a
                            href={subtask.url}
                            target="_blank"
                            rel="noreferrer"
                            className={'projects-feature__table-link'}
                          >
                            링크
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{subtask.taskMonth || '-'}</td>
                      <td>{ownerText}</td>
                      <td>
                        <span className="status-badge" data-status={subtask.taskStatus}>
                          {subtask.taskStatus}
                        </span>
                      </td>
                      <td>
                        <div className={'projects-feature__subtask-table-actions'}>
                          {canEdit ? (
                            <button
                              type="button"
                              className={
                                'projects-feature__button projects-feature__button--secondary'
                              }
                              aria-expanded={isEditing}
                              onClick={() => {
                                onSubtaskDraftChange(subtask.id, toSubtaskDraft(subtask));
                                setEditingSubtaskId(isEditing ? null : subtask.id);
                              }}
                            >
                              수정
                            </button>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                    </tr>
                    {isEditing ? (
                      <tr className={'projects-feature__subtask-edit-row'}>
                        <td colSpan={6}>
                          <div className={'projects-feature__subtask-edit-panel'}>
                            <div className={'projects-feature__subtask-edit-grid'}>
                              <label>
                                <span>과업명</span>
                                <input
                                  id={`subtask-title-${subtask.id}`}
                                  value={draft.title}
                                  onChange={(event) =>
                                    onSubtaskDraftChange(subtask.id, { title: event.target.value })
                                  }
                                />
                              </label>
                              <label>
                                <span>보고서 URL</span>
                                <input
                                  id={`subtask-url-${subtask.id}`}
                                  value={draft.url}
                                  onChange={(event) =>
                                    onSubtaskDraftChange(subtask.id, { url: event.target.value })
                                  }
                                />
                              </label>
                              <label>
                                <span>과업월</span>
                                <input
                                  id={`subtask-month-${subtask.id}`}
                                  type="month"
                                  value={draft.taskMonth}
                                  onChange={(event) =>
                                    onSubtaskDraftChange(subtask.id, {
                                      taskMonth: event.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                <span>담당자</span>
                                <select
                                  id={`subtask-owner-${subtask.id}`}
                                  value={draft.ownerMemberId}
                                  onChange={(event) =>
                                    onSubtaskDraftChange(subtask.id, {
                                      ownerMemberId: event.target.value,
                                    })
                                  }
                                >
                                  <option value="">담당자 선택</option>
                                  {members.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {[item.accountId, item.name].filter(Boolean).join(' ')}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span>상태</span>
                                <select
                                  id={`subtask-status-${subtask.id}`}
                                  value={draft.taskStatus}
                                  onChange={(event) =>
                                    onSubtaskDraftChange(subtask.id, {
                                      taskStatus: event.target.value as SubtaskStatus,
                                    })
                                  }
                                >
                                  {subtaskStatusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className={'projects-feature__subtask-edit-note'}>
                                <span>과업 비고</span>
                                <textarea
                                  id={`subtask-note-${subtask.id}`}
                                  value={draft.note}
                                  rows={3}
                                  onChange={(event) =>
                                    onSubtaskDraftChange(subtask.id, { note: event.target.value })
                                  }
                                />
                              </label>
                            </div>
                            <div className={'projects-feature__subtask-edit-actions'}>
                              <button
                                type="button"
                                className={
                                  'projects-feature__button projects-feature__button--secondary'
                                }
                                aria-label="과업 저장"
                                disabled={savePending}
                                onClick={() => onSubtaskSave(subtask.id)}
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                className={
                                  'projects-feature__button projects-feature__button--secondary'
                                }
                                onClick={() => {
                                  onSubtaskDraftChange(subtask.id, toSubtaskDraft(subtask));
                                  setEditingSubtaskId(null);
                                }}
                              >
                                취소
                              </button>
                              {canDeleteSubtask(subtask) ? (
                                <button
                                  type="button"
                                  className={'projects-feature__delete-button'}
                                  aria-label="과업 삭제"
                                  onClick={() => onSubtaskDelete(subtask)}
                                >
                                  삭제
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          message={subtaskAddOpen ? '추가할 과업 정보를 입력하십시오.' : '등록된 과업이 없습니다.'}
          description={
            subtaskAddOpen
              ? '과업명과 URL 입력 후 추가할 수 있습니다.'
              : '과업 추가로 새 과업을 등록하십시오.'
          }
        />
      )}
    </section>
  );
}

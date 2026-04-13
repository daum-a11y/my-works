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
        <h2 className={'projects-feature__section-title'}>태스크 목록</h2>
        <button
          type="button"
          className={'projects-feature__button projects-feature__button--secondary'}
          onClick={onToggleAdd}
          aria-expanded={subtaskAddOpen}
        >
          {subtaskAddOpen ? '추가 취소' : '태스크 추가'}
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
            <caption className={'sr-only'}>태스크 리스트</caption>
            <thead>
              <tr>
                <th scope="col">작업일</th>
                <th scope="col">태스크명</th>
                <th scope="col">
                  보고서
                  <br />
                  URL
                </th>
                <th scope="col">담당자</th>
                <th scope="col">상태</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {subtaskAddOpen && newSubtaskDraft ? (
                <tr className={'projects-feature__subtask-add-row'}>
                  <td>
                    <label className={'sr-only'} htmlFor="new-subtask-month">
                      작업일
                    </label>
                    <input
                      id="new-subtask-date"
                      form={addFormId}
                      type="date"
                      value={newSubtaskDraft.taskDate}
                      onChange={(event) =>
                        onNewSubtaskDraftChange({ taskDate: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <div className={'projects-feature__subtask-title-stack'}>
                      <label className={'sr-only'} htmlFor="new-subtask-title">
                        태스크명
                      </label>
                      <input
                        id="new-subtask-title"
                        form={addFormId}
                        value={newSubtaskDraft.title}
                        placeholder="태스크명"
                        onChange={(event) => onNewSubtaskDraftChange({ title: event.target.value })}
                      />
                      <label className={'sr-only'} htmlFor="new-subtask-note">
                        비고
                      </label>
                      <textarea
                        id="new-subtask-note"
                        form={addFormId}
                        value={newSubtaskDraft.note}
                        placeholder="비고"
                        rows={3}
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
                      <td>{subtask.taskDate || '-'}</td>
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
                        <td>
                          <label className={'sr-only'} htmlFor={`subtask-date-${subtask.id}`}>
                            작업일
                          </label>
                          <input
                            id={`subtask-date-${subtask.id}`}
                            type="date"
                            value={draft.taskDate}
                            onChange={(event) =>
                              onSubtaskDraftChange(subtask.id, {
                                taskDate: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <div className={'projects-feature__subtask-title-stack'}>
                            <label className={'sr-only'} htmlFor={`subtask-title-${subtask.id}`}>
                              태스크명
                            </label>
                            <input
                              id={`subtask-title-${subtask.id}`}
                              value={draft.title}
                              onChange={(event) =>
                                onSubtaskDraftChange(subtask.id, { title: event.target.value })
                              }
                            />
                            <label className={'sr-only'} htmlFor={`subtask-note-${subtask.id}`}>
                              비고
                            </label>
                            <textarea
                              id={`subtask-note-${subtask.id}`}
                              value={draft.note}
                              rows={3}
                              onChange={(event) =>
                                onSubtaskDraftChange(subtask.id, { note: event.target.value })
                              }
                            />
                          </div>
                        </td>
                        <td>
                          <label className={'sr-only'} htmlFor={`subtask-url-${subtask.id}`}>
                            보고서 URL
                          </label>
                          <input
                            id={`subtask-url-${subtask.id}`}
                            value={draft.url}
                            onChange={(event) =>
                              onSubtaskDraftChange(subtask.id, { url: event.target.value })
                            }
                          />
                        </td>
                        <td>
                          <label className={'sr-only'} htmlFor={`subtask-owner-${subtask.id}`}>
                            담당자
                          </label>
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
                        </td>
                        <td>
                          <label className={'sr-only'} htmlFor={`subtask-status-${subtask.id}`}>
                            상태
                          </label>
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
                        </td>
                        <td>
                          <div className={'projects-feature__subtask-table-actions'}>
                            <button
                              type="button"
                              className={
                                'projects-feature__button projects-feature__button--secondary'
                              }
                              aria-label="태스크 저장"
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
                                aria-label="태스크 삭제"
                                onClick={() => onSubtaskDelete(subtask)}
                              >
                                삭제
                              </button>
                            ) : null}
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
          message={
            subtaskAddOpen ? '추가할 태스크 정보를 입력하십시오.' : '등록된 과업이 없습니다.'
          }
        />
      )}
    </section>
  );
}

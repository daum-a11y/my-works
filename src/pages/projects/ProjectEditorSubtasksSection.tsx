import type { FormEvent } from 'react';
import { EmptyState } from '../../components/shared/EmptyState';
import type { ProjectSubtask } from '../../types/domain';
import type { SubtaskFormState } from './ProjectEditorPage.types';

interface ProjectEditorSubtasksSectionProps {
  subtaskAddOpen: boolean;
  newSubtaskDraft: SubtaskFormState | null;
  selectedProjectSubtasks: ProjectSubtask[];
  subtaskDrafts: Record<string, SubtaskFormState>;
  members: Array<{ id: string; accountId: string; name: string }>;
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
            <thead>
              <tr>
                <th scope="col">과업명</th>
                <th scope="col">과업 URL</th>
                <th scope="col">담당자</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {subtaskAddOpen && newSubtaskDraft ? (
                <tr className={'projects-feature__subtask-add-row'}>
                  <td>
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
                  </td>
                  <td>
                    <label className={'sr-only'} htmlFor="new-subtask-url">
                      과업 URL
                    </label>
                    <input
                      id="new-subtask-url"
                      form={addFormId}
                      value={newSubtaskDraft.url}
                      placeholder="https://example.com/subtask"
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

                return (
                  <tr key={subtask.id}>
                    <td>
                      <label className={'sr-only'} htmlFor={`subtask-title-${subtask.id}`}>
                        과업명
                      </label>
                      <input
                        id={`subtask-title-${subtask.id}`}
                        value={draft.title}
                        placeholder="과업명"
                        onChange={(event) =>
                          onSubtaskDraftChange(subtask.id, { title: event.target.value })
                        }
                      />
                    </td>
                    <td>
                      <label className={'sr-only'} htmlFor={`subtask-url-${subtask.id}`}>
                        과업 URL
                      </label>
                      <input
                        id={`subtask-url-${subtask.id}`}
                        value={draft.url}
                        placeholder="과업 URL"
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
                          onSubtaskDraftChange(subtask.id, { ownerMemberId: event.target.value })
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
                      <div className={'projects-feature__subtask-table-actions'}>
                        <button
                          type="button"
                          className={'projects-feature__button projects-feature__button--secondary'}
                          onClick={() => onSubtaskSave(subtask.id)}
                        >
                          수정
                        </button>
                        {canDeleteSubtask(subtask) ? (
                          <button
                            type="button"
                            className={'projects-feature__delete-button'}
                            onClick={() => onSubtaskDelete(subtask)}
                          >
                            삭제
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
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

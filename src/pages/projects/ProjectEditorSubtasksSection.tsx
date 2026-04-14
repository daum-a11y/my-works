import { Fragment, useState, type FormEvent } from 'react';
import { Button, Link as KrdsLink, Select, TextInput, Textarea } from 'krds-react';
import {
  EmptyState,
  KrdsDateInput,
  PageSection,
  SubtaskStatusBadge,
} from '../../components/shared';
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
    <PageSection
      title="태스크 목록"
      className={'krds-page__subtask-section'}
      actions={
        <Button
          size="medium"
          type="button"
          variant="secondary"
          onClick={onToggleAdd}
          aria-expanded={subtaskAddOpen}
        >
          {subtaskAddOpen ? '추가 취소' : '태스크 추가'}
        </Button>
      }
    >
      {subtaskAddOpen && newSubtaskDraft ? (
        <form id={addFormId} className={'krds-page__subtask-add-form'} onSubmit={onAddSubmit} />
      ) : null}

      {showSubtaskTable ? (
        <div className={'krds-page__subtask-table-wrap krds-table-wrap'}>
          <table className={'krds-page__subtask-table tbl data'}>
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
                <tr className={'krds-page__subtask-add-row'}>
                  <td>
                    <KrdsDateInput
                      id="new-subtask-date"
                      label="작업일"
                      form={addFormId}
                      value={newSubtaskDraft.taskDate}
                      onChange={(value) => onNewSubtaskDraftChange({ taskDate: value })}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <div className={'krds-page__subtask-title-stack'}>
                      <TextInput
                        size="medium"
                        id="new-subtask-title"
                        label="태스크명"
                        form={addFormId}
                        value={newSubtaskDraft.title}
                        placeholder="태스크명"
                        onChange={(value) => onNewSubtaskDraftChange({ title: value })}
                        style={{ width: '100%' }}
                      />
                      <Textarea
                        id="new-subtask-note"
                        label="비고"
                        form={addFormId}
                        value={newSubtaskDraft.note}
                        placeholder="비고"
                        rows={3}
                        onChange={(value) => onNewSubtaskDraftChange({ note: value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </td>
                  <td>
                    <TextInput
                      size="medium"
                      id="new-subtask-url"
                      label="보고서 URL"
                      form={addFormId}
                      value={newSubtaskDraft.url}
                      placeholder="보고서 URL"
                      onChange={(value) => onNewSubtaskDraftChange({ url: value })}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <Select
                      size="medium"
                      id="new-subtask-owner"
                      label="담당자"
                      form={addFormId}
                      value={newSubtaskDraft.ownerMemberId}
                      onChange={(value) => onNewSubtaskDraftChange({ ownerMemberId: value })}
                      options={[
                        { value: '', label: '담당자 선택' },
                        ...members.map((item) => ({
                          value: item.id,
                          label: [item.accountId, item.name].filter(Boolean).join(' '),
                        })),
                      ]}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <Select
                      size="medium"
                      id="new-subtask-status"
                      label="상태"
                      form={addFormId}
                      value={newSubtaskDraft.taskStatus}
                      onChange={(value) =>
                        onNewSubtaskDraftChange({
                          taskStatus: value as SubtaskStatus,
                        })
                      }
                      options={subtaskStatusOptions.map((status) => ({
                        value: status,
                        label: status,
                      }))}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <div className={'krds-page__subtask-table-actions'}>
                      <Button
                        size="medium"
                        type="submit"
                        form={addFormId}
                        variant="secondary"
                        disabled={savePending}
                      >
                        추가
                      </Button>
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
                        <div className={'krds-page__subtask-read-title'}>
                          <strong>{subtask.title}</strong>
                          {subtask.note ? (
                            <span className={'krds-page__subtask-read-note'}>{subtask.note}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {subtask.url ? (
                          <KrdsLink size="medium" href={subtask.url} external>
                            링크
                          </KrdsLink>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{ownerText}</td>
                      <td>
                        <SubtaskStatusBadge status={subtask.taskStatus} />
                      </td>
                      <td>
                        <div className={'krds-page__subtask-table-actions'}>
                          {canEdit ? (
                            <Button
                              size="medium"
                              type="button"
                              variant="secondary"
                              aria-expanded={isEditing}
                              onClick={() => {
                                onSubtaskDraftChange(subtask.id, toSubtaskDraft(subtask));
                                setEditingSubtaskId(isEditing ? null : subtask.id);
                              }}
                            >
                              수정
                            </Button>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                    </tr>
                    {isEditing ? (
                      <tr className={'krds-page__subtask-edit-row'}>
                        <td>
                          <KrdsDateInput
                            id={`subtask-date-${subtask.id}`}
                            label="작업일"
                            value={draft.taskDate}
                            onChange={(value) =>
                              onSubtaskDraftChange(subtask.id, {
                                taskDate: value,
                              })
                            }
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <div className={'krds-page__subtask-title-stack'}>
                            <TextInput
                              size="medium"
                              id={`subtask-title-${subtask.id}`}
                              label="태스크명"
                              value={draft.title}
                              onChange={(value) =>
                                onSubtaskDraftChange(subtask.id, { title: value })
                              }
                              style={{ width: '100%' }}
                            />
                            <Textarea
                              id={`subtask-note-${subtask.id}`}
                              label="비고"
                              value={draft.note}
                              rows={3}
                              onChange={(value) =>
                                onSubtaskDraftChange(subtask.id, { note: value })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>
                        </td>
                        <td>
                          <TextInput
                            size="medium"
                            id={`subtask-url-${subtask.id}`}
                            label="보고서 URL"
                            value={draft.url}
                            onChange={(value) => onSubtaskDraftChange(subtask.id, { url: value })}
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <Select
                            size="medium"
                            id={`subtask-owner-${subtask.id}`}
                            label="담당자"
                            value={draft.ownerMemberId}
                            onChange={(value) =>
                              onSubtaskDraftChange(subtask.id, {
                                ownerMemberId: value,
                              })
                            }
                            options={[
                              { value: '', label: '담당자 선택' },
                              ...members.map((item) => ({
                                value: item.id,
                                label: [item.accountId, item.name].filter(Boolean).join(' '),
                              })),
                            ]}
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <Select
                            size="medium"
                            id={`subtask-status-${subtask.id}`}
                            label="상태"
                            value={draft.taskStatus}
                            onChange={(value) =>
                              onSubtaskDraftChange(subtask.id, {
                                taskStatus: value as SubtaskStatus,
                              })
                            }
                            options={subtaskStatusOptions.map((status) => ({
                              value: status,
                              label: status,
                            }))}
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <div className={'krds-page__subtask-table-actions'}>
                            <Button
                              size="medium"
                              type="button"
                              variant="secondary"
                              aria-label="태스크 저장"
                              disabled={savePending}
                              onClick={() => onSubtaskSave(subtask.id)}
                            >
                              저장
                            </Button>
                            <Button
                              size="medium"
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                onSubtaskDraftChange(subtask.id, toSubtaskDraft(subtask));
                                setEditingSubtaskId(null);
                              }}
                            >
                              취소
                            </Button>
                            {canDeleteSubtask(subtask) ? (
                              <Button
                                size="medium"
                                type="button"
                                variant="secondary"
                                aria-label="태스크 삭제"
                                onClick={() => onSubtaskDelete(subtask)}
                              >
                                삭제
                              </Button>
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
    </PageSection>
  );
}

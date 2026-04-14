import type { RefObject } from 'react';
import { Select, TextInput } from 'krds-react';
import type { ProjectFormState } from './ProjectEditorPage.types';

interface ProjectEditorFormProps {
  projectDraft: ProjectFormState;
  projectTypeOptions: Array<{ id: string; type1: string }>;
  platforms: Array<{ id: string; name: string; isVisible: boolean }>;
  serviceGroupOptions: Array<{ costGroupId: string | null; costGroupName: string }>;
  selectedCostGroupId: string;
  serviceGroupNameOptions: string[];
  serviceNameOptions: string[];
  selectedServiceGroup: string;
  selectedServiceName: string;
  members: Array<{ id: string; accountId: string; name: string }>;
  titleRef: RefObject<HTMLInputElement | null>;
  onProjectDraftChange: (patch: Partial<ProjectFormState>) => void;
  onCostGroupChange: (value: string) => void;
  onServiceGroupChange: (value: string) => void;
  onServiceNameChange: (value: string) => void;
}

export function ProjectEditorForm({
  projectDraft,
  projectTypeOptions,
  platforms,
  serviceGroupOptions,
  selectedCostGroupId,
  serviceGroupNameOptions,
  serviceNameOptions,
  selectedServiceGroup,
  selectedServiceName,
  members,
  titleRef,
  onProjectDraftChange,
  onCostGroupChange,
  onServiceGroupChange,
  onServiceNameChange,
}: ProjectEditorFormProps) {
  return (
    <div className={'projects-feature__editor-form-grid'}>
      <label className={'projects-feature__field'}>
        <span>청구그룹</span>
        <Select
          value={selectedCostGroupId}
          onChange={onCostGroupChange}
          options={[
            { value: '', label: '선택' },
            ...serviceGroupOptions
              .filter((group) => Boolean(group.costGroupId))
              .map((group) => ({
                value: group.costGroupId as string,
                label: group.costGroupName,
              })),
          ]}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>프로젝트 종류</span>
        <Select
          value={projectDraft.taskTypeId}
          onChange={(value) => onProjectDraftChange({ taskTypeId: value })}
          options={[
            { value: '', label: '선택' },
            ...projectTypeOptions.map((projectType) => ({
              value: projectType.id,
              label: projectType.type1,
            })),
          ]}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>서비스 그룹</span>
        <Select
          value={selectedServiceGroup}
          onChange={onServiceGroupChange}
          disabled={!selectedCostGroupId}
          options={[
            { value: '', label: '선택' },
            ...serviceGroupNameOptions.map((name) => ({ value: name, label: name })),
          ]}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>서비스명</span>
        <Select
          value={selectedServiceName}
          onChange={onServiceNameChange}
          disabled={!selectedServiceGroup}
          options={[
            { value: '', label: '선택' },
            ...serviceNameOptions.map((name) => ({ value: name, label: name })),
          ]}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>플랫폼</span>
        <Select
          value={projectDraft.platformId}
          onChange={(value) => onProjectDraftChange({ platformId: value })}
          options={[
            { value: '', label: '선택' },
            ...platforms
              .filter((platform) => platform.isVisible || platform.id === projectDraft.platformId)
              .map((platform) => ({
                value: platform.id,
                label: platform.name,
              })),
          ]}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field projects-feature__field--wide'}>
        <span>프로젝트명</span>
        <TextInput
          ref={titleRef}
          value={projectDraft.name}
          onChange={(value) => onProjectDraftChange({ name: value })}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field projects-feature__field--wide'}>
        <span>보고서URL</span>
        <TextInput
          value={projectDraft.reportUrl}
          onChange={(value) => onProjectDraftChange({ reportUrl: value })}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>QA시작일</span>
        <TextInput
          type="date"
          value={projectDraft.startDate}
          max={projectDraft.endDate || undefined}
          onChange={(value) => onProjectDraftChange({ startDate: value })}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>QA종료일</span>
        <TextInput
          type="date"
          value={projectDraft.endDate}
          min={projectDraft.startDate || undefined}
          onChange={(value) => onProjectDraftChange({ endDate: value })}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>리포터</span>
        <Select
          value={projectDraft.reporterMemberId}
          onChange={(value) => onProjectDraftChange({ reporterMemberId: value })}
          options={[
            { value: '', label: '선택' },
            ...members.map((item) => ({
              value: item.id,
              label: `${item.accountId}(${item.name})`,
            })),
          ]}
          style={{ width: '100%' }}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>리뷰어</span>
        <Select
          value={projectDraft.reviewerMemberId}
          onChange={(value) => onProjectDraftChange({ reviewerMemberId: value })}
          options={[
            { value: '', label: '선택' },
            ...members.map((item) => ({
              value: item.id,
              label: `${item.accountId}(${item.name})`,
            })),
          ]}
          style={{ width: '100%' }}
        />
      </label>
    </div>
  );
}

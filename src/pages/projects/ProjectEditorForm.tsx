import type { RefObject } from 'react';
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
        <select
          value={selectedCostGroupId}
          onChange={(event) => onCostGroupChange(event.target.value)}
        >
          <option value="">선택</option>
          {serviceGroupOptions.map((group) =>
            group.costGroupId ? (
              <option key={group.costGroupId} value={group.costGroupId}>
                {group.costGroupName}
              </option>
            ) : null,
          )}
        </select>
      </label>

      <label className={'projects-feature__field'}>
        <span>프로젝트 종류</span>
        <select
          value={projectDraft.taskTypeId}
          onChange={(event) => onProjectDraftChange({ taskTypeId: event.target.value })}
        >
          <option value="">선택</option>
          {projectTypeOptions.map((projectType) => (
            <option key={projectType.id} value={projectType.id}>
              {projectType.type1}
            </option>
          ))}
        </select>
      </label>

      <label className={'projects-feature__field'}>
        <span>서비스 그룹</span>
        <select
          value={selectedServiceGroup}
          onChange={(event) => onServiceGroupChange(event.target.value)}
          disabled={!selectedCostGroupId}
        >
          <option value="">선택</option>
          {serviceGroupNameOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className={'projects-feature__field'}>
        <span>서비스명</span>
        <select
          value={selectedServiceName}
          onChange={(event) => onServiceNameChange(event.target.value)}
          disabled={!selectedServiceGroup}
        >
          <option value="">선택</option>
          {serviceNameOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className={'projects-feature__field'}>
        <span>플랫폼</span>
        <select
          value={projectDraft.platformId}
          onChange={(event) => onProjectDraftChange({ platformId: event.target.value })}
        >
          <option value="">선택</option>
          {platforms
            .filter((platform) => platform.isVisible || platform.id === projectDraft.platformId)
            .map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
        </select>
      </label>

      <label className={'projects-feature__field projects-feature__field--wide'}>
        <span>프로젝트명</span>
        <input
          ref={titleRef}
          value={projectDraft.name}
          onChange={(event) => onProjectDraftChange({ name: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field projects-feature__field--wide'}>
        <span>보고서URL</span>
        <input
          value={projectDraft.reportUrl}
          onChange={(event) => onProjectDraftChange({ reportUrl: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>QA시작일</span>
        <input
          type="date"
          value={projectDraft.startDate}
          max={projectDraft.endDate || undefined}
          onChange={(event) => onProjectDraftChange({ startDate: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>QA종료일</span>
        <input
          type="date"
          value={projectDraft.endDate}
          min={projectDraft.startDate || undefined}
          onChange={(event) => onProjectDraftChange({ endDate: event.target.value })}
        />
      </label>

      <label className={'projects-feature__field'}>
        <span>리포터</span>
        <select
          value={projectDraft.reporterMemberId}
          onChange={(event) => onProjectDraftChange({ reporterMemberId: event.target.value })}
        >
          <option value="">선택</option>
          {members.map((item) => (
            <option key={item.id} value={item.id}>
              {`${item.accountId}(${item.name})`}
            </option>
          ))}
        </select>
      </label>

      <label className={'projects-feature__field'}>
        <span>리뷰어</span>
        <select
          value={projectDraft.reviewerMemberId}
          onChange={(event) => onProjectDraftChange({ reviewerMemberId: event.target.value })}
        >
          <option value="">선택</option>
          {members.map((item) => (
            <option key={item.id} value={item.id}>
              {`${item.accountId}(${item.name})`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

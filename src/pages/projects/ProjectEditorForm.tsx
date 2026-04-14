import type { RefObject } from 'react';
import { Select, TextInput } from 'krds-react';
import { KrdsDateInput } from '../../components/shared';
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
    <div className={'krds-page__editor-form-grid'}>
      <Select
        size="medium"
        id="project-editor-cost-group"
        label="청구그룹"
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

      <Select
        size="medium"
        id="project-editor-project-type"
        label="프로젝트 종류"
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

      <Select
        size="medium"
        id="project-editor-service-group"
        label="서비스 그룹"
        value={selectedServiceGroup}
        onChange={onServiceGroupChange}
        disabled={!selectedCostGroupId}
        options={[
          { value: '', label: '선택' },
          ...serviceGroupNameOptions.map((name) => ({ value: name, label: name })),
        ]}
        style={{ width: '100%' }}
      />

      <Select
        size="medium"
        id="project-editor-service-name"
        label="서비스명"
        value={selectedServiceName}
        onChange={onServiceNameChange}
        disabled={!selectedServiceGroup}
        options={[
          { value: '', label: '선택' },
          ...serviceNameOptions.map((name) => ({ value: name, label: name })),
        ]}
        style={{ width: '100%' }}
      />

      <Select
        size="medium"
        id="project-editor-platform"
        label="플랫폼"
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

      <TextInput
        size="medium"
        id="project-editor-name"
        label="프로젝트명"
        ref={titleRef}
        value={projectDraft.name}
        onChange={(value) => onProjectDraftChange({ name: value })}
        style={{ width: '100%' }}
      />

      <TextInput
        size="medium"
        id="project-editor-report-url"
        label="보고서URL"
        value={projectDraft.reportUrl}
        onChange={(value) => onProjectDraftChange({ reportUrl: value })}
        style={{ width: '100%' }}
      />

      <KrdsDateInput
        id="project-editor-start-date"
        label="QA시작일"
        value={projectDraft.startDate}
        max={projectDraft.endDate || undefined}
        onChange={(value) => onProjectDraftChange({ startDate: value })}
        style={{ width: '100%' }}
      />

      <KrdsDateInput
        id="project-editor-end-date"
        label="QA종료일"
        value={projectDraft.endDate}
        min={projectDraft.startDate || undefined}
        onChange={(value) => onProjectDraftChange({ endDate: value })}
        style={{ width: '100%' }}
      />

      <Select
        size="medium"
        id="project-editor-reporter"
        label="리포터"
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

      <Select
        size="medium"
        id="project-editor-reviewer"
        label="리뷰어"
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
    </div>
  );
}

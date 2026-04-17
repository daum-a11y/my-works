import type { FormEvent } from 'react';
import { Accordion, Button, Checkbox, CheckboxGroup, Select, TextInput } from 'krds-react';
import { EmptyState } from '../../../components/shared/EmptyState';
import { IsoDateInput } from '../../../components/shared/IsoDateInput';
import { PageFilterField } from '../../../components/shared/PageFilterField';
import type {
  AdminCostGroupItem,
  AdminProjectOption,
  AdminTaskSearchFilters,
  MemberAdminItem,
} from '../admin.types';

interface AdminReportsFilterFormProps {
  filters: AdminTaskSearchFilters;
  taskType1Options: string[];
  taskType2Options: string[];
  costGroups: AdminCostGroupItem[];
  visibleProjects: AdminProjectOption[];
  members: MemberAdminItem[];
  visibleMembers: MemberAdminItem[];
  memberFilterIds: string[];
  memberFilterOpen: boolean;
  memberSearchInput: string;
  loading: boolean;
  searching: boolean;
  totalTasks: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFilterField: <K extends keyof AdminTaskSearchFilters>(
    key: K,
    value: AdminTaskSearchFilters[K],
  ) => void;
  onMemberFilterOpenToggle: () => void;
  onMemberSearchInputChange: (value: string) => void;
  onSelectAllMembers: () => void;
  onClearAllMembers: () => void;
  onMemberCheckedChange: (memberId: string, checked: boolean) => void;
  onReset: () => void;
  onExport: () => void;
}

export function AdminReportsFilterForm({
  filters,
  taskType1Options,
  taskType2Options,
  costGroups,
  visibleProjects,
  members,
  visibleMembers,
  memberFilterIds,
  memberFilterOpen,
  memberSearchInput,
  loading,
  searching,
  totalTasks,
  onSubmit,
  onFilterField,
  onMemberFilterOpenToggle,
  onMemberSearchInputChange,
  onSelectAllMembers,
  onClearAllMembers,
  onMemberCheckedChange,
  onReset,
  onExport,
}: AdminReportsFilterFormProps) {
  const selectedMemberLabel =
    memberFilterIds.length === members.length && members.length > 0
      ? '전체'
      : memberFilterIds.length === 0
        ? '전체'
        : `${memberFilterIds.length}명 선택`;

  return (
    <form className={'filter-form'} onSubmit={onSubmit}>
      <div className={'date-row'}>
        <PageFilterField className={'filter-field'} label="시작일">
          <IsoDateInput
            id="admin-reports-start-date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(next) => onFilterField('startDate', next)}
          />
        </PageFilterField>
        <PageFilterField className={'filter-field'} label="종료일">
          <IsoDateInput
            id="admin-reports-end-date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(next) => onFilterField('endDate', next)}
          />
        </PageFilterField>
      </div>

      <div className={'meta-row'}>
        <PageFilterField className={'filter-field'} label="타입1">
          <Select
            size="medium"
            id="admin-reports-task-type-1"
            value={filters.taskType1}
            onChange={(value) => onFilterField('taskType1', value)}
            options={[
              { value: '', label: '전체' },
              ...taskType1Options.map((type1) => ({ value: type1, label: type1 })),
            ]}
          />
        </PageFilterField>
        <PageFilterField className={'filter-field'} label="타입2">
          <Select
            size="medium"
            id="admin-reports-task-type-2"
            value={filters.taskType2}
            onChange={(value) => onFilterField('taskType2', value)}
            disabled={!filters.taskType1}
            options={[
              { value: '', label: '전체' },
              ...taskType2Options.map((type2) => ({ value: type2, label: type2 })),
            ]}
          />
        </PageFilterField>
        <PageFilterField className={'filter-field'} label="청구그룹">
          <Select
            size="medium"
            id="admin-reports-cost-group"
            value={filters.costGroupId}
            onChange={(value) => onFilterField('costGroupId', value)}
            options={[
              { value: '', label: '전체' },
              ...costGroups.map((group) => ({ value: group.id, label: group.name })),
            ]}
          />
        </PageFilterField>
        <PageFilterField className={'filter-field'} label="프로젝트">
          <Select
            size="medium"
            id="admin-reports-service-name"
            value={filters.projectId}
            onChange={(value) => onFilterField('projectId', value)}
            disabled={!filters.costGroupId}
            options={[
              { value: '', label: '전체' },
              ...visibleProjects.map((project) => ({ value: project.id, label: project.name })),
            ]}
          />
        </PageFilterField>
      </div>

      <div className={'search-row'}>
        <PageFilterField className={'filter-field'} label="사용자">
          <div className={'filter-select-panel'}>
            <Accordion
              value={memberFilterOpen ? ['members'] : []}
              onChange={(values) => {
                const nextOpen = values.includes('members');
                if (nextOpen !== memberFilterOpen) {
                  onMemberFilterOpenToggle();
                }
              }}
              variant="line"
            >
              <Accordion.Item value="members">
                <Accordion.Header>{selectedMemberLabel}</Accordion.Header>
                <Accordion.Panel>
                  <div className={'filter-head'}>
                    <TextInput
                      size="medium"
                      id="admin-reports-member-search"
                      className={'filter-search-input'}
                      value={memberSearchInput}
                      onChange={onMemberSearchInputChange}
                      placeholder="ID, 이름, 이메일 검색"
                      aria-label="사용자 검색"
                    />
                  </div>
                  <div className={'filter-quick-actions'}>
                    <Button
                      size="medium"
                      type="button"
                      variant="tertiary"
                      onClick={onSelectAllMembers}
                    >
                      전체 선택
                    </Button>
                    <Button
                      size="medium"
                      type="button"
                      variant="tertiary"
                      onClick={onClearAllMembers}
                    >
                      전체 해제
                    </Button>
                  </div>
                  <CheckboxGroup className={'filter-check-list'} column>
                    {visibleMembers.length === 0 ? (
                      <EmptyState
                        className={'empty-state'}
                        message="검색 조건에 맞는 사용자가 없습니다."
                      />
                    ) : (
                      visibleMembers.map((member) => {
                        const checked = memberFilterIds.includes(member.id);

                        return (
                          <Checkbox
                            key={member.id}
                            id={`admin-report-member-${member.id}`}
                            label={`${member.accountId} ${member.name}`}
                            checked={checked}
                            onChange={(event) =>
                              onMemberCheckedChange(member.id, event.target.checked)
                            }
                          />
                        );
                      })
                    )}
                  </CheckboxGroup>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>
        </PageFilterField>
        <PageFilterField className={'filter-field'} label="검색어">
          <TextInput
            size="medium"
            id="admin-reports-keyword"
            value={filters.keyword}
            onChange={(value) => onFilterField('keyword', value)}
            placeholder="ID, 이름, 서비스명, 비고 검색"
          />
        </PageFilterField>
      </div>

      <div className={'filter-actions'}>
        <div>
          <Button size="medium" type="submit" variant="primary" disabled={loading || searching}>
            검색
          </Button>
          <Button size="medium" type="button" variant="secondary" onClick={onReset}>
            초기화
          </Button>
          <Button
            size="medium"
            type="button"
            variant="secondary"
            onClick={onExport}
            disabled={totalTasks === 0}
          >
            다운로드
          </Button>
        </div>
      </div>
    </form>
  );
}

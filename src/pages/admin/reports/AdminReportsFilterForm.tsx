import type { FormEvent } from 'react';
import { Button, Select, TextInput } from 'krds-react';
import { EmptyState } from '../../../components/shared/EmptyState';
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
  return (
    <form className={'admin-reports-page__filter-form'} onSubmit={onSubmit}>
      <div className={'admin-reports-page__date-row'}>
        <PageFilterField className={'admin-reports-page__filter-field'} label="시작일">
          <TextInput
            id="admin-reports-start-date"
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(value) => onFilterField('startDate', value)}
          />
        </PageFilterField>
        <PageFilterField className={'admin-reports-page__filter-field'} label="종료일">
          <TextInput
            id="admin-reports-end-date"
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(value) => onFilterField('endDate', value)}
          />
        </PageFilterField>
      </div>

      <div className={'admin-reports-page__meta-row'}>
        <PageFilterField className={'admin-reports-page__filter-field'} label="타입1">
          <Select
            id="admin-reports-task-type-1"
            value={filters.taskType1}
            onChange={(value) => onFilterField('taskType1', value)}
            options={[
              { value: '', label: '전체' },
              ...taskType1Options.map((type1) => ({ value: type1, label: type1 })),
            ]}
          />
        </PageFilterField>
        <PageFilterField className={'admin-reports-page__filter-field'} label="타입2">
          <Select
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
        <PageFilterField className={'admin-reports-page__filter-field'} label="청구그룹">
          <Select
            id="admin-reports-cost-group"
            value={filters.costGroupId}
            onChange={(value) => onFilterField('costGroupId', value)}
            options={[
              { value: '', label: '전체' },
              ...costGroups.map((group) => ({ value: group.id, label: group.name })),
            ]}
          />
        </PageFilterField>
        <PageFilterField className={'admin-reports-page__filter-field'} label="프로젝트">
          <Select
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

      <div className={'admin-reports-page__search-row'}>
        <div className={'page-filter-field admin-reports-page__filter-field'}>
          <span className="page-filter-field__label">사용자</span>
          <div className={'admin-reports-page__member-select'}>
            <button
              type="button"
              className={'admin-reports-page__member-accordion-trigger'}
              onClick={onMemberFilterOpenToggle}
              aria-expanded={memberFilterOpen}
              aria-controls="admin-reports-member-panel"
            >
              <span className={'admin-reports-page__member-accordion-value'}>
                {memberFilterIds.length === members.length && members.length > 0
                  ? '전체'
                  : memberFilterIds.length === 0
                    ? '전체'
                    : `${memberFilterIds.length}명 선택`}
              </span>
              <span className={'admin-reports-page__member-accordion-arrow'} aria-hidden="true">
                {memberFilterOpen ? '▲' : '▼'}
              </span>
            </button>
            <div
              id="admin-reports-member-panel"
              className={[
                'admin-reports-page__member-accordion-body',
                memberFilterOpen ? 'admin-reports-page__member-accordion-body--open' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={'admin-reports-page__member-accordion-inner'}>
                <div className={'admin-reports-page__member-panel-toolbar'}>
                  <TextInput
                    className={'admin-reports-page__member-search-input'}
                    value={memberSearchInput}
                    onChange={onMemberSearchInputChange}
                    placeholder="ID, 이름, 이메일 검색"
                    aria-label="사용자 검색"
                  />
                </div>
                <div className={'admin-reports-page__member-quick-actions'}>
                  <Button type="button" variant="tertiary" onClick={onSelectAllMembers}>
                    전체 선택
                  </Button>
                  <Button type="button" variant="tertiary" onClick={onClearAllMembers}>
                    전체 해제
                  </Button>
                </div>
                <div className={'admin-reports-page__member-checkboxes'}>
                  {visibleMembers.length === 0 ? (
                    <EmptyState
                      className={'admin-reports-page__member-empty-state'}
                      message="검색 조건에 맞는 사용자가 없습니다."
                    />
                  ) : (
                    visibleMembers.map((member) => {
                      const checked = memberFilterIds.includes(member.id);

                      return (
                        <label
                          key={member.id}
                          className={[
                            'admin-reports-page__member-checkbox',
                            checked ? 'admin-reports-page__member-checkbox--selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              onMemberCheckedChange(member.id, event.target.checked)
                            }
                          />
                          <span className={'admin-reports-page__member-account'}>
                            {member.accountId}
                          </span>
                          <span className={'admin-reports-page__member-name'}>{member.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <PageFilterField className={'admin-reports-page__filter-field'} label="검색어">
          <TextInput
            value={filters.keyword}
            onChange={(value) => onFilterField('keyword', value)}
            placeholder="ID, 이름, 서비스명, 비고 검색"
          />
        </PageFilterField>
      </div>

      <div className={'admin-reports-page__filter-actions-row'}>
        <div className={'page-filter-actions'}>
          <Button type="submit" variant="primary" disabled={loading || searching}>
            검색
          </Button>
          <Button type="button" variant="secondary" onClick={onReset}>
            초기화
          </Button>
          <span className={'page-filter-divider'} aria-hidden="true" />
          <Button type="button" variant="secondary" onClick={onExport} disabled={totalTasks === 0}>
            다운로드
          </Button>
        </div>
      </div>
    </form>
  );
}

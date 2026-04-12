import type { FormEvent } from 'react';
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
          <input
            id="admin-reports-start-date"
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(event) => onFilterField('startDate', event.target.value)}
          />
        </PageFilterField>
        <PageFilterField className={'admin-reports-page__filter-field'} label="종료일">
          <input
            id="admin-reports-end-date"
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(event) => onFilterField('endDate', event.target.value)}
          />
        </PageFilterField>
      </div>

      <div className={'admin-reports-page__meta-row'}>
        <PageFilterField className={'admin-reports-page__filter-field'} label="타입1">
          <select
            id="admin-reports-task-type-1"
            value={filters.taskType1}
            onChange={(event) => onFilterField('taskType1', event.target.value)}
          >
            <option value="">전체</option>
            {taskType1Options.map((type1) => (
              <option key={`filter-type1-${type1}`} value={type1}>
                {type1}
              </option>
            ))}
          </select>
        </PageFilterField>
        <PageFilterField className={'admin-reports-page__filter-field'} label="타입2">
          <select
            id="admin-reports-task-type-2"
            value={filters.taskType2}
            onChange={(event) => onFilterField('taskType2', event.target.value)}
            disabled={!filters.taskType1}
          >
            <option value="">전체</option>
            {taskType2Options.map((type2) => (
              <option key={`filter-type2-${type2}`} value={type2}>
                {type2}
              </option>
            ))}
          </select>
        </PageFilterField>
        <PageFilterField className={'admin-reports-page__filter-field'} label="청구그룹">
          <select
            id="admin-reports-cost-group"
            value={filters.costGroupId}
            onChange={(event) => onFilterField('costGroupId', event.target.value)}
          >
            <option value="">전체</option>
            {costGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </PageFilterField>
        <PageFilterField className={'admin-reports-page__filter-field'} label="프로젝트">
          <select
            id="admin-reports-service-name"
            value={filters.projectId}
            onChange={(event) => onFilterField('projectId', event.target.value)}
            disabled={!filters.costGroupId}
          >
            <option value="">전체</option>
            {visibleProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
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
                  <input
                    className={'admin-reports-page__member-search-input'}
                    value={memberSearchInput}
                    onChange={(event) => onMemberSearchInputChange(event.target.value)}
                    placeholder="ID, 이름, 이메일 검색"
                    aria-label="사용자 검색"
                  />
                </div>
                <div className={'admin-reports-page__member-quick-actions'}>
                  <button
                    type="button"
                    className={'admin-reports-page__member-quick-action'}
                    onClick={onSelectAllMembers}
                  >
                    전체 선택
                  </button>
                  <button
                    type="button"
                    className={'admin-reports-page__member-quick-action'}
                    onClick={onClearAllMembers}
                  >
                    전체 해제
                  </button>
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
          <input
            value={filters.keyword}
            onChange={(event) => onFilterField('keyword', event.target.value)}
            placeholder="ID, 이름, 서비스명, 비고 검색"
          />
        </PageFilterField>
      </div>

      <div className={'admin-reports-page__filter-actions-row'}>
        <div className={'admin-reports-page__filter-actions'}>
          <button
            type="submit"
            className={'admin-reports-page__button admin-reports-page__button--filter'}
            disabled={loading || searching}
          >
            검색
          </button>
          <button
            type="button"
            className={'admin-reports-page__button admin-reports-page__button--filter-secondary'}
            onClick={onReset}
          >
            초기화
          </button>
          <span className={'admin-reports-page__filter-divider'} aria-hidden="true" />
          <button
            type="button"
            className={'admin-reports-page__button admin-reports-page__button--filter-secondary'}
            onClick={onExport}
            disabled={totalTasks === 0}
          >
            다운로드
          </button>
        </div>
      </div>
    </form>
  );
}

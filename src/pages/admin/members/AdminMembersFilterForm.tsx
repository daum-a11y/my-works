import type { FormEvent } from 'react';
import { PageFilterBar } from '../../../components/shared/PageFilterBar';
import { PageFilterField } from '../../../components/shared/PageFilterField';
import type { MemberFilterState } from './AdminMembersPage.types';

interface AdminMembersFilterFormProps {
  filterDraft: MemberFilterState;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onFilterDraftChange: (next: MemberFilterState) => void;
}

export function AdminMembersFilterForm({
  filterDraft,
  onSubmit,
  onReset,
  onFilterDraftChange,
}: AdminMembersFilterFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <PageFilterBar
        actions={
          <div className={'admin-members-page__filter-actions'}>
            <button type="submit" className={'admin-members-page__filter-button'}>
              검색
            </button>
            <button
              type="button"
              className={
                'admin-members-page__filter-button admin-members-page__filter-button--secondary'
              }
              onClick={onReset}
            >
              초기화
            </button>
          </div>
        }
      >
        <PageFilterField className={'admin-members-page__filter-field'} label="활성 여부">
          <select
            value={filterDraft.status}
            onChange={(event) =>
              onFilterDraftChange({
                ...filterDraft,
                status: event.target.value as MemberFilterState['status'],
              })
            }
          >
            <option value="all">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </PageFilterField>
        <PageFilterField className={'admin-members-page__filter-field'} label="검색어">
          <input
            value={filterDraft.keyword}
            onChange={(event) =>
              onFilterDraftChange({ ...filterDraft, keyword: event.target.value })
            }
            placeholder="이름, ID, 메일 검색"
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

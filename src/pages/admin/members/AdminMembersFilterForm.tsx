import type { FormEvent } from 'react';
import { Button, Select, TextInput } from 'krds-react';
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
            <Button type="submit" variant="primary">
              검색
            </Button>
            <Button type="button" variant="secondary" onClick={onReset}>
              초기화
            </Button>
          </div>
        }
      >
        <PageFilterField className={'admin-members-page__filter-field'} label="활성 여부">
          <Select
            value={filterDraft.status}
            onChange={(value) =>
              onFilterDraftChange({
                ...filterDraft,
                status: value as MemberFilterState['status'],
              })
            }
            options={[
              { value: 'all', label: '전체' },
              { value: 'active', label: '활성' },
              { value: 'inactive', label: '비활성' },
            ]}
          />
        </PageFilterField>
        <PageFilterField className={'admin-members-page__filter-field'} label="검색어">
          <TextInput
            value={filterDraft.keyword}
            onChange={(value) => onFilterDraftChange({ ...filterDraft, keyword: value })}
            placeholder="이름, ID, 메일 검색"
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

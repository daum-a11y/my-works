import type { FormEvent } from 'react';
import { Button, TextInput } from 'krds-react';
import { KrdsDateInput } from '../../components/shared';
import { PageFilterBar } from '../../components/shared/PageFilterBar';
import { PageFilterField } from '../../components/shared/PageFilterField';
import type { SearchFilters } from './SearchPage.types';

interface SearchFilterFormProps {
  filterDraft: SearchFilters;
  searchInput: string;
  totalReports: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onDownload: () => void;
  onFilterDraftChange: (next: SearchFilters) => void;
  onSearchInputChange: (value: string) => void;
}

export function SearchFilterForm({
  filterDraft,
  searchInput,
  totalReports,
  onSubmit,
  onReset,
  onDownload,
  onFilterDraftChange,
  onSearchInputChange,
}: SearchFilterFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <PageFilterBar
        actions={
          <div>
            <Button size="medium" type="submit" variant="primary">
              검색
            </Button>
            <Button size="medium" type="button" variant="secondary" onClick={onReset}>
              초기화
            </Button>
            <Button
              size="medium"
              type="button"
              variant="secondary"
              onClick={onDownload}
              disabled={!totalReports}
            >
              다운로드
            </Button>
          </div>
        }
      >
        <PageFilterField className="krds-page__filter-field" label="시작일">
          <KrdsDateInput
            value={filterDraft.startDate}
            max={filterDraft.endDate || undefined}
            onChange={(value) => onFilterDraftChange({ ...filterDraft, startDate: value })}
          />
        </PageFilterField>
        <PageFilterField className="krds-page__filter-field" label="종료일">
          <KrdsDateInput
            value={filterDraft.endDate}
            min={filterDraft.startDate || undefined}
            onChange={(value) => onFilterDraftChange({ ...filterDraft, endDate: value })}
          />
        </PageFilterField>
        <PageFilterField className="krds-page__filter-field" label="검색어">
          <TextInput
            size="medium"
            value={searchInput}
            onChange={onSearchInputChange}
            placeholder="프로젝트, 페이지, 내용, 비고 검색"
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

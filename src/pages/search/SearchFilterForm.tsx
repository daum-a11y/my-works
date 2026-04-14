import type { FormEvent } from 'react';
import { Button, TextInput } from 'krds-react';
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
          <div className="search-page__filter-actions">
            <Button type="submit" variant="primary">
              검색
            </Button>
            <Button type="button" variant="secondary" onClick={onReset}>
              초기화
            </Button>
            <span className="search-page__filter-divider" aria-hidden="true" />
            <Button
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
        <PageFilterField className="search-page__filter-field" label="시작일">
          <TextInput
            type="date"
            value={filterDraft.startDate}
            max={filterDraft.endDate || undefined}
            onChange={(value) => onFilterDraftChange({ ...filterDraft, startDate: value })}
          />
        </PageFilterField>
        <PageFilterField className="search-page__filter-field" label="종료일">
          <TextInput
            type="date"
            value={filterDraft.endDate}
            min={filterDraft.startDate || undefined}
            onChange={(value) => onFilterDraftChange({ ...filterDraft, endDate: value })}
          />
        </PageFilterField>
        <PageFilterField className="search-page__filter-field" label="검색어">
          <TextInput
            value={searchInput}
            onChange={onSearchInputChange}
            placeholder="프로젝트, 페이지, 내용, 비고 검색"
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

import type { FormEvent } from 'react';
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
            <button type="submit" className="search-page__filter-button">
              검색
            </button>
            <button
              type="button"
              className="search-page__filter-button search-page__filter-button--secondary"
              onClick={onReset}
            >
              초기화
            </button>
            <span className="search-page__filter-divider" aria-hidden="true" />
            <button
              type="button"
              className="search-page__filter-button search-page__filter-button--secondary"
              onClick={onDownload}
              disabled={!totalReports}
            >
              다운로드
            </button>
          </div>
        }
      >
        <PageFilterField className="search-page__filter-field" label="시작일">
          <input
            type="date"
            value={filterDraft.startDate}
            max={filterDraft.endDate || undefined}
            onChange={(event) =>
              onFilterDraftChange({ ...filterDraft, startDate: event.target.value })
            }
          />
        </PageFilterField>
        <PageFilterField className="search-page__filter-field" label="종료일">
          <input
            type="date"
            value={filterDraft.endDate}
            min={filterDraft.startDate || undefined}
            onChange={(event) =>
              onFilterDraftChange({ ...filterDraft, endDate: event.target.value })
            }
          />
        </PageFilterField>
        <PageFilterField className="search-page__filter-field" label="검색어">
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="프로젝트, 페이지, 내용, 비고 검색"
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

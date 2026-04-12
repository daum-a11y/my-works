import type { FormEvent } from 'react';
import { PageFilterBar } from '../../components/shared/PageFilterBar';
import { PageFilterField } from '../../components/shared/PageFilterField';
import type { ProjectFilterState } from './ProjectsPage.types';

interface ProjectsFilterFormProps {
  filterDraft: ProjectFilterState;
  searchInput: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onFilterDraftChange: (next: ProjectFilterState) => void;
  onSearchInputChange: (value: string) => void;
}

export function ProjectsFilterForm({
  filterDraft,
  searchInput,
  onSubmit,
  onReset,
  onFilterDraftChange,
  onSearchInputChange,
}: ProjectsFilterFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <PageFilterBar
        actions={
          <div className="projects-feature__filter-actions">
            <button type="submit" className="projects-feature__filter-button">
              검색
            </button>
            <button
              type="button"
              className="projects-feature__filter-button projects-feature__filter-button--secondary"
              onClick={onReset}
            >
              초기화
            </button>
          </div>
        }
      >
        <PageFilterField className="projects-feature__filter-field" label="시작일">
          <input
            type="date"
            value={filterDraft.startDate}
            max={filterDraft.endDate || undefined}
            onChange={(event) =>
              onFilterDraftChange({ ...filterDraft, startDate: event.target.value })
            }
          />
        </PageFilterField>
        <PageFilterField className="projects-feature__filter-field" label="종료일">
          <input
            type="date"
            value={filterDraft.endDate}
            min={filterDraft.startDate || undefined}
            onChange={(event) =>
              onFilterDraftChange({ ...filterDraft, endDate: event.target.value })
            }
          />
        </PageFilterField>
        <PageFilterField className="projects-feature__filter-field" label="검색어">
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="검색어 입력"
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

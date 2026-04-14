import type { FormEvent } from 'react';
import { Button, TextInput } from 'krds-react';
import { KrdsDateInput } from '../../components/shared';
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
          <div>
            <Button size="medium" type="submit" variant="primary">
              검색
            </Button>
            <Button size="medium" type="button" variant="secondary" onClick={onReset}>
              초기화
            </Button>
          </div>
        }
      >
        <PageFilterField className="krds-page__filter-field" label="시작일">
          <KrdsDateInput
            id="projects-filter-start-date"
            value={filterDraft.startDate}
            max={filterDraft.endDate || undefined}
            onChange={(value) => onFilterDraftChange({ ...filterDraft, startDate: value })}
          />
        </PageFilterField>
        <PageFilterField className="krds-page__filter-field" label="종료일">
          <KrdsDateInput
            id="projects-filter-end-date"
            value={filterDraft.endDate}
            min={filterDraft.startDate || undefined}
            onChange={(value) => onFilterDraftChange({ ...filterDraft, endDate: value })}
          />
        </PageFilterField>
        <PageFilterField className="krds-page__filter-field" label="검색어">
          <TextInput
            size="medium"
            id="projects-filter-keyword"
            value={searchInput}
            onChange={onSearchInputChange}
            placeholder="검색어 입력"
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

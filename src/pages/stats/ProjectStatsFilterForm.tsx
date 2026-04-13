import type { FormEvent } from 'react';
import { PageFilterBar } from '../../components/shared/PageFilterBar';
import { PageFilterField } from '../../components/shared/PageFilterField';

interface ProjectStatsFilterFormProps {
  draftStartMonth: string;
  draftEndMonth: string;
  draftTaskType1: string;
  taskType1Options: string[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onDraftStartMonthChange: (value: string) => void;
  onDraftEndMonthChange: (value: string) => void;
  onDraftTaskType1Change: (value: string) => void;
}

export function ProjectStatsFilterForm({
  draftStartMonth,
  draftEndMonth,
  draftTaskType1,
  taskType1Options,
  onSubmit,
  onReset,
  onDraftStartMonthChange,
  onDraftEndMonthChange,
  onDraftTaskType1Change,
}: ProjectStatsFilterFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <PageFilterBar
        actions={
          <div className={'stats-page__filter-actions'}>
            <button type="submit" className={'stats-page__filter-button'}>
              검색
            </button>
            <button
              type="button"
              className={'stats-page__filter-button stats-page__filter-button--secondary'}
              onClick={onReset}
            >
              초기화
            </button>
          </div>
        }
      >
        <PageFilterField className={'stats-page__filter-field'} label="시작월">
          <input
            type="month"
            aria-label="프로젝트 통계 시작월"
            value={draftStartMonth}
            max={draftEndMonth || undefined}
            onChange={(event) => onDraftStartMonthChange(event.target.value)}
          />
        </PageFilterField>
        <PageFilterField className={'stats-page__filter-field'} label="종료월">
          <input
            type="month"
            aria-label="프로젝트 통계 종료월"
            value={draftEndMonth}
            min={draftStartMonth || undefined}
            onChange={(event) => onDraftEndMonthChange(event.target.value)}
          />
        </PageFilterField>
        <PageFilterField className={'stats-page__filter-field'} label="타입 1">
          <select
            aria-label="프로젝트 통계 타입 1"
            value={draftTaskType1}
            onChange={(event) => onDraftTaskType1Change(event.target.value)}
          >
            {taskType1Options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

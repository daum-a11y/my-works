import type { FormEvent } from 'react';
import { PageFilterBar } from '../../components/shared/PageFilterBar';
import { PageFilterField } from '../../components/shared/PageFilterField';

interface TaskMonitoringFilterFormProps {
  draftStartMonth: string;
  draftEndMonth: string;
  draftQuery: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onDraftStartMonthChange: (value: string) => void;
  onDraftEndMonthChange: (value: string) => void;
  onDraftQueryChange: (value: string) => void;
}

export function TaskMonitoringFilterForm({
  draftStartMonth,
  draftEndMonth,
  draftQuery,
  onSubmit,
  onReset,
  onDraftStartMonthChange,
  onDraftEndMonthChange,
  onDraftQueryChange,
}: TaskMonitoringFilterFormProps) {
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
            aria-label="태스크 현황 시작월"
            value={draftStartMonth}
            max={draftEndMonth || undefined}
            onChange={(event) => onDraftStartMonthChange(event.target.value)}
          />
        </PageFilterField>
        <PageFilterField className={'stats-page__filter-field'} label="종료월">
          <input
            type="month"
            aria-label="태스크 현황 종료월"
            value={draftEndMonth}
            min={draftStartMonth || undefined}
            onChange={(event) => onDraftEndMonthChange(event.target.value)}
          />
        </PageFilterField>
        <PageFilterField className={'stats-page__filter-field'} label="검색">
          <input
            type="search"
            aria-label="태스크 현황 검색"
            value={draftQuery}
            placeholder="프로젝트, 태스크, 담당자"
            onChange={(event) => onDraftQueryChange(event.target.value)}
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

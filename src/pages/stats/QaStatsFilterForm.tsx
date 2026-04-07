import { PageFilterBar } from '../../components/shared/PageFilterBar';
import { PageFilterField } from '../../components/shared/PageFilterField';

interface QaStatsFilterFormProps {
  draftStartMonth: string;
  draftEndMonth: string;
  onDraftStartMonthChange: (value: string) => void;
  onDraftEndMonthChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function QaStatsFilterForm({
  draftStartMonth,
  draftEndMonth,
  onDraftStartMonthChange,
  onDraftEndMonthChange,
  onSearch,
  onReset,
}: QaStatsFilterFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
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
            aria-label="QA 시작월"
            value={draftStartMonth}
            onChange={(event) => onDraftStartMonthChange(event.target.value)}
          />
        </PageFilterField>
        <PageFilterField className={'stats-page__filter-field'} label="종료월">
          <input
            type="month"
            aria-label="QA 종료월"
            value={draftEndMonth}
            onChange={(event) => onDraftEndMonthChange(event.target.value)}
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

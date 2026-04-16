import type { FormEvent } from 'react';
import { Button, TextInput } from 'krds-react';
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
        <PageFilterField className={'filter-field'} label="시작월">
          <TextInput
            size="medium"
            id="task-monitoring-start-month"
            type="month"
            aria-label="태스크 현황 시작월"
            value={draftStartMonth}
            max={draftEndMonth || undefined}
            onChange={onDraftStartMonthChange}
          />
        </PageFilterField>
        <PageFilterField className={'filter-field'} label="종료월">
          <TextInput
            size="medium"
            id="task-monitoring-end-month"
            type="month"
            aria-label="태스크 현황 종료월"
            value={draftEndMonth}
            min={draftStartMonth || undefined}
            onChange={onDraftEndMonthChange}
          />
        </PageFilterField>
        <PageFilterField className={'filter-field'} label="검색">
          <TextInput
            size="medium"
            id="task-monitoring-query"
            type="search"
            aria-label="태스크 현황 검색"
            value={draftQuery}
            placeholder="프로젝트, 태스크, 담당자"
            onChange={onDraftQueryChange}
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

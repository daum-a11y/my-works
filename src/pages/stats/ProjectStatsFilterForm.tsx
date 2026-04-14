import type { FormEvent } from 'react';
import { Button, Select, TextInput } from 'krds-react';
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
          <div className={'page-filter-actions'}>
            <Button type="submit" variant="primary">
              검색
            </Button>
            <Button type="button" variant="secondary" onClick={onReset}>
              초기화
            </Button>
          </div>
        }
      >
        <PageFilterField className={'stats-page__filter-field'} label="시작월">
          <TextInput
            type="month"
            aria-label="프로젝트 통계 시작월"
            value={draftStartMonth}
            max={draftEndMonth || undefined}
            onChange={onDraftStartMonthChange}
          />
        </PageFilterField>
        <PageFilterField className={'stats-page__filter-field'} label="종료월">
          <TextInput
            type="month"
            aria-label="프로젝트 통계 종료월"
            value={draftEndMonth}
            min={draftStartMonth || undefined}
            onChange={onDraftEndMonthChange}
          />
        </PageFilterField>
        <PageFilterField className={'stats-page__filter-field'} label="타입 1">
          <Select
            aria-label="프로젝트 통계 타입 1"
            value={draftTaskType1}
            onChange={onDraftTaskType1Change}
            options={taskType1Options.map((option) => ({ value: option, label: option }))}
          />
        </PageFilterField>
      </PageFilterBar>
    </form>
  );
}

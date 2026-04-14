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
        <PageFilterField className={'krds-page__filter-field'} label="시작월">
          <TextInput
            size="medium"
            id="project-stats-start-month"
            type="month"
            aria-label="프로젝트 통계 시작월"
            value={draftStartMonth}
            max={draftEndMonth || undefined}
            onChange={onDraftStartMonthChange}
          />
        </PageFilterField>
        <PageFilterField className={'krds-page__filter-field'} label="종료월">
          <TextInput
            size="medium"
            id="project-stats-end-month"
            type="month"
            aria-label="프로젝트 통계 종료월"
            value={draftEndMonth}
            min={draftStartMonth || undefined}
            onChange={onDraftEndMonthChange}
          />
        </PageFilterField>
        <PageFilterField className={'krds-page__filter-field'} label="타입 1">
          <Select
            size="medium"
            id="project-stats-task-type1"
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

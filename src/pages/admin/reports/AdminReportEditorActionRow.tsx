import type { ReactNode } from 'react';
import { getTodayInputValue, shiftDateInput, type ReportDraft } from '../../reports/reportUtils';

interface AdminReportEditorActionRowProps {
  draft: ReportDraft;
  disabled: boolean;
  onSubmitLabel?: ReactNode;
  onCancel: () => void;
  onDateChange: (nextDate: string) => void;
}

export function AdminReportEditorActionRow({
  draft,
  disabled,
  onSubmitLabel = '저장',
  onCancel,
  onDateChange,
}: AdminReportEditorActionRowProps) {
  const baseDate = draft.reportDate || getTodayInputValue();

  return (
    <div className={'reports-page__action-row'}>
      <button
        type="submit"
        className={'reports-page__button reports-page__button--primary'}
        disabled={disabled}
      >
        {onSubmitLabel}
      </button>
      <button
        type="button"
        className={'reports-page__button reports-page__button--secondary'}
        onClick={onCancel}
      >
        취소
      </button>
      <button
        type="button"
        className={'reports-page__button reports-page__button--secondary'}
        onClick={() => onDateChange(shiftDateInput(baseDate, -1))}
      >
        이전일
      </button>
      <button
        type="button"
        className={'reports-page__button reports-page__button--secondary'}
        onClick={() => onDateChange(getTodayInputValue())}
      >
        오늘
      </button>
      <button
        type="button"
        className={'reports-page__button reports-page__button--secondary'}
        onClick={() => onDateChange(shiftDateInput(baseDate, 1))}
      >
        다음일
      </button>
    </div>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { Button } from 'krds-react';
import { getTodayInputValue, shiftDateInput, type ReportDraft } from '../../reports/reportUtils';

const actionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center',
};

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
    <div className={'krds-page__action-row'} style={actionRowStyle}>
      <Button size="medium" type="submit" variant="primary" disabled={disabled}>
        {onSubmitLabel}
      </Button>
      <Button size="medium" type="button" variant="secondary" onClick={onCancel}>
        취소
      </Button>
      <Button
        size="medium"
        type="button"
        variant="secondary"
        onClick={() => onDateChange(shiftDateInput(baseDate, -1))}
      >
        이전일
      </Button>
      <Button
        size="medium"
        type="button"
        variant="secondary"
        onClick={() => onDateChange(getTodayInputValue())}
      >
        오늘
      </Button>
      <Button
        size="medium"
        type="button"
        variant="secondary"
        onClick={() => onDateChange(shiftDateInput(baseDate, 1))}
      >
        다음일
      </Button>
    </div>
  );
}

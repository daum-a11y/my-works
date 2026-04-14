import type { CSSProperties } from 'react';
import { type ReportDraft } from '../../reports/reportUtils';
import { Select, TextInput } from 'krds-react';
import type { MemberAdminItem } from '../admin.types';

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

interface AdminReportEditorBasicFieldsProps {
  isEdit: boolean;
  members: MemberAdminItem[];
  selectedMemberId: string;
  draft: ReportDraft;
  onMemberChange: (value: string) => void;
  onReportDateChange: (value: string) => void;
  formatCompactDate: (value: string, mode: 'short' | 'long') => string;
  parseCompactDate: (value: string, mode: 'short' | 'long') => string;
}

export function AdminReportEditorBasicFields({
  isEdit,
  members,
  selectedMemberId,
  draft,
  onMemberChange,
  onReportDateChange,
  formatCompactDate,
  parseCompactDate,
}: AdminReportEditorBasicFieldsProps) {
  return (
    <div className={'reports-page__form-grid'} style={gridStyle}>
      <Select
        label="사용자"
        value={selectedMemberId}
        onChange={onMemberChange}
        disabled={isEdit}
        options={[
          { value: '', label: members.length ? '선택' : '사용자가 없습니다.' },
          ...members.map((member) => ({
            value: member.id,
            label: `${member.accountId} (${member.name})`,
          })),
        ]}
        style={{ width: '100%' }}
      />

      <TextInput
        label="일자"
        type="text"
        placeholder="YYMMDD"
        value={formatCompactDate(draft.reportDate, 'short')}
        onChange={(value) => onReportDateChange(parseCompactDate(value, 'short'))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

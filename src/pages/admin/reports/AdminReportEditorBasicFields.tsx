import { type ReportDraft } from '../../reports/reportUtils';
import type { MemberAdminItem } from '../admin.types';

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
    <div className={'reports-page__form-grid'}>
      <label className={'reports-page__field'}>
        <span>사용자</span>
        <select
          value={selectedMemberId}
          onChange={(event) => onMemberChange(event.target.value)}
          disabled={isEdit}
        >
          <option value="">{members.length ? '선택' : '사용자가 없습니다.'}</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.accountId} ({member.name})
            </option>
          ))}
        </select>
      </label>

      <label className={'reports-page__field'}>
        <span>일자</span>
        <input
          type="text"
          placeholder="YYMMDD"
          value={formatCompactDate(draft.reportDate, 'short')}
          onChange={(event) => onReportDateChange(parseCompactDate(event.target.value, 'short'))}
        />
      </label>
    </div>
  );
}

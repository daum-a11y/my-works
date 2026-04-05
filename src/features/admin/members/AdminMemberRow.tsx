import { Link } from 'react-router-dom';
import { formatDateLabel, formatDateTimeLabel } from '../../../lib/utils';
import type { MemberAdminItem, MemberAdminPayload } from '../admin-types';
import '../../../styles/domain/pages/admin-members-page.scss';

type AdminMemberRowProps = {
  member: MemberAdminItem;
};

function getRoleLabel(role: MemberAdminPayload['role']) {
  return role === 'admin' ? '관리자' : '일반';
}

function getActiveLabel(active: boolean) {
  return active ? '활성' : '비활성';
}

function getMemberStatusLabel(status: MemberAdminItem['memberStatus']) {
  return status === 'pending' ? '승인대기' : '활성';
}

function getReportRequiredLabel(reportRequired: boolean) {
  return reportRequired ? '허용' : '차단';
}

function formatMemberDate(value: string) {
  if (!value) {
    return '-';
  }

  return formatDateLabel(value.slice(0, 10));
}

function formatMemberDateTime(value: string) {
  if (!value) {
    return '-';
  }

  return formatDateTimeLabel(value);
}

export function AdminMemberRow({ member }: AdminMemberRowProps) {
  return (
    <tr className={member.userActive ? undefined : 'admin-members-page__inactive-row'}>
      <td>{member.accountId}</td>
      <td>{member.name}</td>
      <td>{member.email || '-'}</td>
      <td>{getRoleLabel(member.role)}</td>
      <td>{getActiveLabel(member.userActive)}</td>
      <td>{getMemberStatusLabel(member.memberStatus)}</td>
      <td>{getReportRequiredLabel(member.reportRequired)}</td>
      <td>{formatMemberDate(member.joinedAt)}</td>
      <td>{formatMemberDateTime(member.lastLoginAt)}</td>
      <td>
        <div className={'admin-members-page__button-row'}>
          <Link
            to={`/admin/members/${member.id}/edit`}
            className={'admin-members-page__button admin-members-page__button--secondary'}
          >
            수정
          </Link>
        </div>
      </td>
    </tr>
  );
}

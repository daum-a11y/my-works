import { Badge } from 'krds-react';

import { KrdsRouterButtonLink } from '../../../components/shared';
import { formatDateLabel, formatDateTimeLabel } from '../../../utils';
import type { MemberAdminItem, MemberAdminPayload } from '../admin.types';

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
    <tr className={member.userActive ? undefined : 'krds-page-admin__inactive-row'}>
      <td>{member.accountId}</td>
      <td>{member.name}</td>
      <td>{member.email || '-'}</td>
      <td>
        <Badge
          variant="light"
          color={member.role === 'admin' ? 'information' : 'gray'}
          size="small"
        >
          {getRoleLabel(member.role)}
        </Badge>
      </td>
      <td>
        <Badge
          variant="light"
          color={member.userActive ? 'success' : 'gray'}
          size="small"
        >
          {getActiveLabel(member.userActive)}
        </Badge>
      </td>
      <td>
        <Badge
          variant="light"
          color={member.memberStatus === 'pending' ? 'warning' : 'success'}
          size="small"
        >
          {getMemberStatusLabel(member.memberStatus)}
        </Badge>
      </td>
      <td>
        <Badge
          variant="light"
          color={member.reportRequired ? 'success' : 'gray'}
          size="small"
        >
          {getReportRequiredLabel(member.reportRequired)}
        </Badge>
      </td>
      <td>{formatMemberDate(member.joinedAt)}</td>
      <td>{formatMemberDateTime(member.lastLoginAt)}</td>
      <td>
        <KrdsRouterButtonLink to={`/admin/members/${member.id}/edit`}>
          수정
        </KrdsRouterButtonLink>
      </td>
    </tr>
  );
}

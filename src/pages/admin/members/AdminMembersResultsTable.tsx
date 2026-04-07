import { TableEmptyRow } from '../../../components/shared/TableEmptyRow';
import type { MemberAdminItem } from '../types';
import { AdminMemberRow } from './AdminMemberRow';

interface AdminMembersResultsTableProps {
  loading: boolean;
  members: MemberAdminItem[];
}

export function AdminMembersResultsTable({ loading, members }: AdminMembersResultsTableProps) {
  return (
    <div className={'admin-members-page__table-wrap'}>
      <table className={'admin-members-page__table'}>
        <caption className="sr-only">사용자 내역</caption>
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>이메일</th>
            <th>권한</th>
            <th>활성여부</th>
            <th>승인상태</th>
            <th>업무보고접근</th>
            <th>등록일</th>
            <th>최종로그인</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableEmptyRow
              colSpan={10}
              className={'admin-members-page__empty-cell'}
              message="불러오는 중..."
            />
          ) : members.length === 0 ? (
            <TableEmptyRow
              colSpan={10}
              className={'admin-members-page__empty-cell'}
              message="조회된 사용자가 없습니다."
            />
          ) : (
            members.map((member) => <AdminMemberRow key={member.id} member={member} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

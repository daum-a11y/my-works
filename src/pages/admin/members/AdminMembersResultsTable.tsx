import { SortableTableHeaderButton, TableEmptyRow } from '../../../components/shared';
import type { MemberAdminItem } from '../admin.types';
import { AdminMemberRow } from './AdminMemberRow';
import type { AdminMembersSortState } from './AdminMembersPage.sort';

interface AdminMembersResultsTableProps {
  loading: boolean;
  members: MemberAdminItem[];
  onSortChange: (next: AdminMembersSortState) => void;
  sortState: AdminMembersSortState;
}

export function AdminMembersResultsTable({
  loading,
  members,
  onSortChange,
  sortState,
}: AdminMembersResultsTableProps) {
  const getAriaSort = (key: AdminMembersSortState['key']) => {
    if (sortState.key !== key) {
      return 'none';
    }

    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={'table-wrap krds-table-wrap'}>
      <table className={'krds-table tbl data'}>
        <caption className="sr-only">사용자 내역</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={getAriaSort('accountId')}>
              <SortableTableHeaderButton
                label="ID"
                sortKey="accountId"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('name')}>
              <SortableTableHeaderButton
                label="이름"
                sortKey="name"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('email')}>
              <SortableTableHeaderButton
                label="이메일"
                sortKey="email"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('role')}>
              <SortableTableHeaderButton
                label="권한"
                sortKey="role"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('userActive')}>
              <SortableTableHeaderButton
                label="활성여부"
                sortKey="userActive"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('memberStatus')}>
              <SortableTableHeaderButton
                label="승인상태"
                sortKey="memberStatus"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('reportRequired')}>
              <SortableTableHeaderButton
                label="업무보고접근"
                sortKey="reportRequired"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('joinedAt')}>
              <SortableTableHeaderButton
                label="등록일"
                sortKey="joinedAt"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th scope="col" aria-sort={getAriaSort('lastLoginAt')}>
              <SortableTableHeaderButton
                label="최종로그인"
                sortKey="lastLoginAt"
                sortState={sortState}
                onChange={onSortChange}
              />
            </th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {!loading && members.length === 0 ? (
            <TableEmptyRow colSpan={10} message="조회된 사용자가 없습니다." />
          ) : null}
          {!loading
            ? members.map((member) => <AdminMemberRow key={member.id} member={member} />)
            : null}
        </tbody>
      </table>
    </div>
  );
}

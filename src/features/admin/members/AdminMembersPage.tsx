import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { PageSection } from '../../../components/common/PageSection';
import { adminDataClient } from '../adminClient';
import type { MemberAdminItem } from '../admin-types';
import { AdminMemberRow } from './AdminMemberRow';
import styles from './AdminMembersPage.module.css';

type MemberFilterState = {
  status: 'all' | 'active' | 'inactive';
  keyword: string;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function createInitialFilters(): MemberFilterState {
  return {
    status: 'all',
    keyword: '',
  };
}

function matchesMemberFilters(member: MemberAdminItem, filters: MemberFilterState) {
  if (filters.status === 'active' && !member.userActive) {
    return false;
  }

  if (filters.status === 'inactive' && member.userActive) {
    return false;
  }

  const queryText = normalizeText(filters.keyword);

  if (!queryText) {
    return true;
  }

  return normalizeText(
    [member.name, member.accountId, member.email, member.authEmail].join(' '),
  ).includes(queryText);
}

export function AdminMembersPage() {
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');
  const [filterDraft, setFilterDraft] = useState<MemberFilterState>(createInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MemberFilterState>(createInitialFilters);

  const membersQuery = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;

    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const filteredMembers = useMemo(
    () => members.filter((member) => matchesMemberFilters(member, appliedFilters)),
    [appliedFilters, members],
  );
  const activeMemberCount = useMemo(
    () => members.filter((member) => member.userActive).length,
    [members],
  );

  const errorMessage = (membersQuery.error instanceof Error && membersQuery.error.message) || '';

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filterDraft);
  };

  const handleReset = () => {
    const initialFilters = createInitialFilters();
    setFilterDraft(initialFilters);
    setAppliedFilters(initialFilters);
  };

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <h1 className={styles.title}>사용자 관리</h1>
          <Link to="/admin/members/new" className={styles.headerAction}>
            사용자 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className={styles.statusText}>{statusMessage}</p> : null}
      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <PageSection title="필터">
        <form className={styles.filterBar} onSubmit={handleSearchSubmit}>
          <label className={styles.filterField}>
            <span>활성 여부</span>
            <select
              value={filterDraft.status}
              onChange={(event) =>
                setFilterDraft((current) => ({
                  ...current,
                  status: event.target.value as MemberFilterState['status'],
                }))
              }
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </label>
          <label className={styles.filterField}>
            <span>검색어</span>
            <input
              value={filterDraft.keyword}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, keyword: event.target.value }))
              }
              placeholder="이름, ID, 메일 검색"
            />
          </label>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.filterButton}>
              검색
            </button>
            <button type="button" className={styles.filterButtonSecondary} onClick={handleReset}>
              초기화
            </button>
          </div>
        </form>
      </PageSection>

      <section className={styles.resultBar} aria-label="사용자 목록 상태">
        <p className={styles.resultMetric}>
          <span className={styles.resultLabel}>조회 결과</span>
          <strong className={styles.resultValue}>{filteredMembers.length}</strong>
        </p>
        <div className={styles.resultMetrics}>
          <p className={styles.resultMetric}>
            <span className={styles.resultLabel}>전체 사용자</span>
            <strong className={styles.resultValue}>{members.length}</strong>
          </p>
          <p className={styles.resultMetric}>
            <span className={styles.resultLabel}>활성 사용자</span>
            <strong className={styles.resultValue}>{activeMemberCount}</strong>
          </p>
        </div>
      </section>

      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">사용자 내역</caption>
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
              {membersQuery.isLoading ? (
                <tr>
                  <td colSpan={10} className={styles.emptyCell}>
                    불러오는 중...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.emptyCell}>
                    조회된 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => <AdminMemberRow key={member.id} member={member} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

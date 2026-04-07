import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { PageSection } from '../../../components/shared/PageSection';
import { adminDataClient } from '../../../api/admin';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminMemberRow } from './AdminMemberRow';
import {
  ADMIN_MEMBERS_DEFAULT_PAGE_SIZE,
  ADMIN_MEMBERS_PAGE_SIZE_OPTIONS,
  ADMIN_MEMBERS_PAGE_TITLE,
} from './AdminMembersPage.constants';
import type { MemberFilterState } from './AdminMembersPage.types';
import { createInitialFilters, matchesMemberFilters } from './AdminMembersPage.utils';
import '../../../styles/domain/pages/admin-members-page.scss';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function AdminMembersPage() {
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');
  const [filterDraft, setFilterDraft] = useState<MemberFilterState>(createInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MemberFilterState>(createInitialFilters);
  const [pageSize, setPageSize] = useState<number>(ADMIN_MEMBERS_DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

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
  const totalMembers = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalMembers / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pagedMembers = useMemo(() => {
    const from = (currentPageSafe - 1) * pageSize;
    return filteredMembers.slice(from, from + pageSize);
  }, [currentPageSafe, filteredMembers, pageSize]);
  const activeMemberCount = useMemo(
    () => members.filter((member) => member.userActive).length,
    [members],
  );

  useEffect(() => {
    setDocumentTitle(ADMIN_MEMBERS_PAGE_TITLE);
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const errorMessage = (membersQuery.error instanceof Error && membersQuery.error.message) || '';

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filterDraft);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initialFilters = createInitialFilters();
    setFilterDraft(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  return (
    <section className={'admin-members-page admin-members-page--page'}>
      <header className={'admin-members-page__page-header'}>
        <div className={'admin-members-page__page-header-top'}>
          <h1 className={'admin-members-page__title'}>사용자 관리</h1>
          <Link to="/admin/members/new" className={'admin-members-page__header-action'}>
            사용자 추가
          </Link>
        </div>
      </header>

      {statusMessage ? <p className={'admin-members-page__status-text'}>{statusMessage}</p> : null}
      {errorMessage ? <p className={'admin-members-page__helper-text'}>{errorMessage}</p> : null}

      <PageSection title="필터">
        <form className={'admin-members-page__filter-bar'} onSubmit={handleSearchSubmit}>
          <label className={'admin-members-page__filter-field'}>
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
          <label className={'admin-members-page__filter-field'}>
            <span>검색어</span>
            <input
              value={filterDraft.keyword}
              onChange={(event) =>
                setFilterDraft((current) => ({ ...current, keyword: event.target.value }))
              }
              placeholder="이름, ID, 메일 검색"
            />
          </label>
          <div className={'admin-members-page__filter-actions'}>
            <button type="submit" className={'admin-members-page__filter-button'}>
              검색
            </button>
            <button
              type="button"
              className={
                'admin-members-page__filter-button admin-members-page__filter-button--secondary'
              }
              onClick={handleReset}
            >
              초기화
            </button>
          </div>
        </form>
      </PageSection>

      <section className={'admin-members-page__result-bar'} aria-label="사용자 목록 상태">
        <div className={'admin-members-page__result-metrics'}>
          <div className={'admin-members-page__pager'} aria-label="사용자 목록 페이지 이동">
            <button
              type="button"
              className={'admin-members-page__page-button'}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPageSafe === 1}
              aria-label="이전 페이지"
            >
              이전
            </button>
            <p className={'admin-members-page__page-status'}>
              <strong>{currentPageSafe}</strong>
              <span>/ {numberFormatter.format(totalPages)}</span>
            </p>
            <button
              type="button"
              className={'admin-members-page__page-button'}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPageSafe === totalPages || totalMembers === 0}
              aria-label="다음 페이지"
            >
              다음
            </button>
          </div>
          <p className={'admin-members-page__result-metric'}>
            <span className={'admin-members-page__result-label'}>조회 결과</span>
            <strong className={'admin-members-page__result-value'}>
              {numberFormatter.format(totalMembers)}명
            </strong>
          </p>
          <p className={'admin-members-page__result-metric'}>
            <span className={'admin-members-page__result-label'}>전체 사용자</span>
            <strong className={'admin-members-page__result-value'}>
              {numberFormatter.format(members.length)}명
            </strong>
          </p>
          <p className={'admin-members-page__result-metric'}>
            <span className={'admin-members-page__result-label'}>활성 사용자</span>
            <strong className={'admin-members-page__result-value'}>
              {numberFormatter.format(activeMemberCount)}명
            </strong>
          </p>
        </div>
        <div className={'admin-members-page__result-controls'}>
          <label className={'admin-members-page__page-size-field'}>
            <span>페이지당</span>
            <select
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              aria-label="페이지당 행 수"
            >
              {ADMIN_MEMBERS_PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}행
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

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
            {membersQuery.isLoading ? (
              <tr>
                <td colSpan={10} className={'admin-members-page__empty-cell'}>
                  불러오는 중...
                </td>
              </tr>
            ) : pagedMembers.length === 0 ? (
              <tr>
                <td colSpan={10} className={'admin-members-page__empty-cell'}>
                  조회된 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              pagedMembers.map((member) => <AdminMemberRow key={member.id} member={member} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

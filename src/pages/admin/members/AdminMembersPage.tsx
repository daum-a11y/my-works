import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '../../../components/shared/PageHeader';
import { PagePager } from '../../../components/shared/PagePager';
import { PageResultBar } from '../../../components/shared/PageResultBar';
import { PageSection } from '../../../components/shared/PageSection';
import { PageSizeField } from '../../../components/shared/PageSizeField';
import { adminDataClient } from '../../../api/admin';
import { setDocumentTitle } from '../../../router/navigation';
import { AdminMembersFilterForm } from './AdminMembersFilterForm';
import { AdminMembersResultsTable } from './AdminMembersResultsTable';
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
      <PageHeader
        title="사용자 관리"
        actions={
          <Link to="/admin/members/new" className={'admin-members-page__header-action'}>
            사용자 추가
          </Link>
        }
      />

      {statusMessage ? <p className={'admin-members-page__status-text'}>{statusMessage}</p> : null}
      {errorMessage ? <p className={'admin-members-page__helper-text'}>{errorMessage}</p> : null}

      <PageSection title="필터">
        <AdminMembersFilterForm
          filterDraft={filterDraft}
          onSubmit={handleSearchSubmit}
          onReset={handleReset}
          onFilterDraftChange={setFilterDraft}
        />
      </PageSection>

      <PageResultBar
        className={'admin-members-page__result-bar'}
        aria-label="사용자 목록 상태"
        metrics={
          <>
            <PagePager
              className={'admin-members-page__pager'}
              aria-label="사용자 목록 페이지 이동"
              buttonClassName={'admin-members-page__page-button'}
              statusClassName={'admin-members-page__page-status'}
              currentPage={currentPageSafe}
              totalPages={totalPages}
              canGoPrevious={currentPageSafe > 1}
              canGoNext={currentPageSafe < totalPages && totalMembers > 0}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
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
          </>
        }
        controls={
          <PageSizeField
            className={'admin-members-page__page-size-field'}
            aria-label="페이지당 행 수"
            value={pageSize}
            options={ADMIN_MEMBERS_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              setPageSize(next);
              setCurrentPage(1);
            }}
          />
        }
      />

      <AdminMembersResultsTable loading={membersQuery.isLoading} members={pagedMembers} />
    </section>
  );
}

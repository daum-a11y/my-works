import { CriticalAlert } from 'krds-react';
import { KrdsRouterButtonLink } from '../../../components/shared';
import { PageHeader } from '../../../components/shared/PageHeader';
import { PagePager } from '../../../components/shared/PagePager';
import { PageResultBar } from '../../../components/shared/PageResultBar';
import { PageSection } from '../../../components/shared/PageSection';
import { PageSizeField } from '../../../components/shared/PageSizeField';
import { AdminMembersFilterForm } from './AdminMembersFilterForm';
import { AdminMembersResultsTable } from './AdminMembersResultsTable';
import { ADMIN_MEMBERS_PAGE_SIZE_OPTIONS } from './AdminMembersPage.constants';
import { useAdminMembersPage } from './useAdminMembersPage';
import { useAlertMessage } from '../../../hooks/useAlertMessage';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function AdminMembersPage() {
  const page = useAdminMembersPage();
  useAlertMessage(page.errorMessage);

  return (
    <section className={'krds-page-admin krds-page-admin--page'}>
      <PageHeader
        title="사용자 관리"
        actions={
          <KrdsRouterButtonLink to="/admin/members/new" variant="primary" size="medium">
            사용자 추가
          </KrdsRouterButtonLink>
        }
      />

      {page.statusMessage ? (
        <CriticalAlert alerts={[{ variant: 'ok', message: page.statusMessage }]} />
      ) : null}
      <PageSection title="필터">
        <AdminMembersFilterForm
          filterDraft={page.filterDraft}
          onSubmit={page.handleSearchSubmit}
          onReset={page.handleReset}
          onFilterDraftChange={page.setFilterDraft}
        />
      </PageSection>

      <PageResultBar
        aria-label="사용자 목록 상태"
        metrics={
          <>
            <PagePager
              aria-label="사용자 목록 페이지 이동"
              currentPage={page.currentPageSafe}
              totalPages={page.totalPages}
              canGoPrevious={page.currentPageSafe > 1}
              canGoNext={page.currentPageSafe < page.totalPages && page.totalMembers > 0}
              onPrevious={() => page.setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                page.setCurrentPage((current) => Math.min(page.totalPages, current + 1))
              }
              onPageChange={page.setCurrentPage}
            />
            <p>
              <span>검색 결과</span>
              <strong>{numberFormatter.format(page.totalMembers)}건</strong>
            </p>
            <p>
              <span>전체 사용자</span>
              <strong>{numberFormatter.format(page.members.length)}명</strong>
            </p>
            <p>
              <span>활성 사용자</span>
              <strong>{numberFormatter.format(page.activeMemberCount)}명</strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            value={page.pageSize}
            options={ADMIN_MEMBERS_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              page.setPageSize(next);
              page.setCurrentPage(1);
            }}
          />
        }
      />

      <AdminMembersResultsTable
        loading={page.loading}
        members={page.pagedMembers}
        sortState={page.sortState}
        onSortChange={page.setSortState}
      />
    </section>
  );
}

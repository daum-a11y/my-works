import { Link } from 'react-router-dom';
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
    <section className={'admin-members-page admin-members-page--page'}>
      <PageHeader
        title="사용자 관리"
        actions={
          <Link to="/admin/members/new" className={'admin-members-page__header-action'}>
            사용자 추가
          </Link>
        }
      />

      {page.statusMessage ? (
        <p className={'admin-members-page__status-text'}>{page.statusMessage}</p>
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
        className={'admin-members-page__result-bar'}
        aria-label="사용자 목록 상태"
        metrics={
          <>
            <PagePager
              className={'admin-members-page__pager'}
              aria-label="사용자 목록 페이지 이동"
              buttonClassName={'admin-members-page__page-button'}
              statusClassName={'admin-members-page__page-status'}
              currentPage={page.currentPageSafe}
              totalPages={page.totalPages}
              canGoPrevious={page.currentPageSafe > 1}
              canGoNext={page.currentPageSafe < page.totalPages && page.totalMembers > 0}
              onPrevious={() => page.setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                page.setCurrentPage((current) => Math.min(page.totalPages, current + 1))
              }
            />
            <p className={'admin-members-page__result-metric'}>
              <span className={'admin-members-page__result-label'}>조회 결과</span>
              <strong className={'admin-members-page__result-value'}>
                {numberFormatter.format(page.totalMembers)}명
              </strong>
            </p>
            <p className={'admin-members-page__result-metric'}>
              <span className={'admin-members-page__result-label'}>전체 사용자</span>
              <strong className={'admin-members-page__result-value'}>
                {numberFormatter.format(page.members.length)}명
              </strong>
            </p>
            <p className={'admin-members-page__result-metric'}>
              <span className={'admin-members-page__result-label'}>활성 사용자</span>
              <strong className={'admin-members-page__result-value'}>
                {numberFormatter.format(page.activeMemberCount)}명
              </strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            className={'admin-members-page__page-size-field'}
            aria-label="페이지당 행 수"
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

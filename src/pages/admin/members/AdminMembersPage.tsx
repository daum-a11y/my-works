import { Button, CriticalAlert, Pagination, Select } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../../../components/shared/PageHeader';
import { PageResultBar } from '../../../components/shared/PageResultBar';
import { PageSection } from '../../../components/shared/PageSection';
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
          <Button
            as={RouterLink}
            to="/admin/members/new"
            role="link"
            variant="primary"
            size="medium"
          >
            사용자 추가
          </Button>
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
            <div aria-label="사용자 목록 페이지 이동">
              <span className="sr-only">
                {page.currentPageSafe}/ {page.totalPages}
              </span>
              <Pagination
                currentPage={page.currentPageSafe}
                totalPages={page.totalPages}
                onChange={page.setCurrentPage}
                prevLabel="이전 페이지"
                nextLabel="다음 페이지"
                disabled={
                  !(page.currentPageSafe > 1) &&
                  !(page.currentPageSafe < page.totalPages && page.totalMembers > 0)
                }
              />
            </div>
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
          <>
            <strong className="sort-label">
              <label htmlFor="admin-members-page-size">페이지당 행 수</label>
            </strong>
            <Select
              id="admin-members-page-size"
              value={String(page.pageSize)}
              variant="sorting"
              size="small"
              options={ADMIN_MEMBERS_PAGE_SIZE_OPTIONS.map((option) => ({
                value: String(option),
                label: `${option}개`,
              }))}
              onChange={(next) => {
                page.setPageSize(Number(next));
                page.setCurrentPage(1);
              }}
            />
          </>
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

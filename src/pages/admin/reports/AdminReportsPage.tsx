import { PagePager } from '../../../components/shared/PagePager';
import { PageResultBar } from '../../../components/shared/PageResultBar';
import { PageSizeField } from '../../../components/shared/PageSizeField';
import { PageHeader } from '../../../components/shared/PageHeader';
import { PageSection } from '../../../components/shared/PageSection';
import { ADMIN_REPORTS_PAGE_SIZE_OPTIONS } from './AdminReportsPage.constants';
import { AdminReportsFilterForm } from './AdminReportsFilterForm';
import { AdminReportsResultsTable } from './AdminReportsResultsTable';
import { useAdminReportsPage } from './useAdminReportsPage';
import '../../../styles/pages/AdminPage.scss';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function AdminReportsPage() {
  const page = useAdminReportsPage();

  return (
    <section className={'admin-reports-page admin-reports-page--shell'}>
      <PageHeader
        title="업무보고 조회"
        actions={
          <button
            type="button"
            className={'admin-reports-page__header-action'}
            onClick={page.handleCreate}
          >
            업무보고 추가
          </button>
        }
      />

      <PageSection title="필터">
        <AdminReportsFilterForm
          filters={page.filters}
          taskType1Options={page.taskType1Options}
          taskType2Options={page.taskType2Options}
          costGroups={page.costGroups}
          visibleProjects={page.visibleProjects}
          members={page.members}
          visibleMembers={page.visibleMembers}
          memberFilterIds={page.memberFilterIds}
          memberFilterOpen={page.memberFilterOpen}
          memberSearchInput={page.memberSearchInput}
          loading={page.loading}
          searching={page.searching}
          totalTasks={page.totalTasks}
          onSubmit={page.handleSearchSubmit}
          onFilterField={page.handleFilterField}
          onMemberFilterOpenToggle={page.handleMemberFilterOpenToggle}
          onMemberSearchInputChange={page.setMemberSearchInput}
          onSelectAllMembers={page.handleSelectAllMembers}
          onClearAllMembers={page.handleClearAllMembers}
          onMemberCheckedChange={page.handleMemberCheckedChange}
          onReset={page.handleReset}
          onExport={() => void page.handleExport()}
        />
      </PageSection>

      {(page.queryError || page.mutationError) && (
        <p className={'admin-reports-page__status-message'}>
          {page.queryError || page.mutationError}
        </p>
      )}

      <PageResultBar
        className={'admin-reports-page__result-bar'}
        aria-label="업무보고 조회 결과 요약"
        metrics={
          <>
            <PagePager
              className={'admin-reports-page__pager'}
              aria-label="업무보고 목록 페이지 이동"
              buttonClassName={'admin-reports-page__button admin-reports-page__button--page'}
              statusClassName={'admin-reports-page__page-status'}
              currentPage={page.currentPageSafe}
              totalPages={page.totalPages}
              canGoPrevious={page.currentPageSafe > 1}
              canGoNext={page.currentPageSafe < page.totalPages && page.totalTasks > 0}
              onPrevious={() => page.setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                page.setCurrentPage((current) => Math.min(page.totalPages, current + 1))
              }
            />
            <p className={'admin-reports-page__result-metric'}>
              <span className={'admin-reports-page__result-label'}>총 건수</span>
              <strong className={'admin-reports-page__result-value'}>
                {numberFormatter.format(page.totalTasks)}건
              </strong>
            </p>
            <p className={'admin-reports-page__result-metric'}>
              <span className={'admin-reports-page__result-label'}>총 시간</span>
              <strong className={'admin-reports-page__result-value'}>{page.summaryTime}</strong>
            </p>
          </>
        }
        controls={
          <PageSizeField
            className={'admin-reports-page__page-size-field'}
            aria-label="페이지당 행 수"
            value={page.pageSize}
            options={ADMIN_REPORTS_PAGE_SIZE_OPTIONS}
            onValueChange={(next) => {
              page.setPageSize(next);
              page.setCurrentPage(1);
            }}
          />
        }
      />

      <AdminReportsResultsTable
        tasks={page.sortedTasks}
        sortState={page.sortState}
        deletePending={page.deletePending}
        onSortChange={page.setSortState}
        onEdit={page.handleEdit}
        onDelete={(taskId) => void page.handleDelete(taskId)}
      />
    </section>
  );
}

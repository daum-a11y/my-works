import { Button, Pagination, Select } from 'krds-react';
import { PageResultBar } from '../../../components/shared/PageResultBar';
import { PageHeader } from '../../../components/shared/PageHeader';
import { PageSection } from '../../../components/shared/PageSection';
import { ADMIN_REPORTS_PAGE_SIZE_OPTIONS } from './AdminReportsPage.constants';
import { AdminReportsFilterForm } from './AdminReportsFilterForm';
import { AdminReportsResultsTable } from './AdminReportsResultsTable';
import { useAdminReportsPage } from './useAdminReportsPage';
import { useAlertMessage } from '../../../hooks/useAlertMessage';
const numberFormatter = new Intl.NumberFormat('ko-KR');

export function AdminReportsPage() {
  const page = useAdminReportsPage();
  const errorMessage = page.queryError || page.mutationError;
  useAlertMessage(errorMessage);

  return (
    <section className={'admin-page page-view'}>
      <PageHeader
        title="업무보고 조회"
        actions={
          <Button size="medium" type="button" onClick={page.handleCreate} variant="primary">
            업무보고 추가
          </Button>
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

      <PageResultBar
        aria-label="업무보고 검색 결과 요약"
        metrics={
          <>
            <div aria-label="업무보고 목록 페이지 이동">
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
                  !(page.currentPageSafe < page.totalPages && page.totalTasks > 0)
                }
              />
            </div>
            <p>
              <span>검색 결과</span>
              <strong>{numberFormatter.format(page.totalTasks)}건</strong>
            </p>
            <p>
              <span>총 시간</span>
              <strong>{page.summaryTime}</strong>
            </p>
          </>
        }
        controls={
          <>
            <strong className="sort-label">
              <label htmlFor="admin-reports-page-size">페이지당 행 수</label>
            </strong>
            <Select
              id="admin-reports-page-size"
              value={String(page.pageSize)}
              variant="sorting"
              size="small"
              options={ADMIN_REPORTS_PAGE_SIZE_OPTIONS.map((option) => ({
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

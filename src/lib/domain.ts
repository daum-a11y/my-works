export type UserRole = 'user' | 'admin';
export type MemberStatus = 'pending' | 'active';

export type PageStatus = '미수정' | '전체 수정' | '일부 수정';

export function normalizePageStatus(value: string | null | undefined): PageStatus {
  switch (value) {
    case '전체 수정':
    case '개선':
      return '전체 수정';
    case '일부 수정':
    case '일부':
      return '일부 수정';
    case '미수정':
    case '미개선':
    case '중지':
    default:
      return '미수정';
  }
}

export interface Member {
  id: string;
  accountId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  status: MemberStatus;
  reportRequired: boolean;
  joinedAt: string;
  authUserId?: string | null;
}

export interface TaskType {
  id: string;
  type1: string;
  type2: string;
  label: string;
  displayOrder: number;
  requiresServiceGroup: boolean;
  isActive: boolean;
}

export interface CostGroup {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Platform {
  id: string;
  name: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface ServiceGroup {
  id: string;
  name: string;
  costGroupId: string | null;
  costGroupName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Project {
  id: string;
  createdByMemberId: string | null;
  projectType1: string;
  name: string;
  platformId: string | null;
  platform: string;
  serviceGroupId: string | null;
  reportUrl: string;
  reporterMemberId: string | null;
  reviewerMemberId: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ProjectListRow {
  id: string;
  createdByMemberId: string | null;
  projectType1: string;
  name: string;
  platformId: string | null;
  platform: string;
  serviceGroupId: string | null;
  serviceGroupName: string;
  reportUrl: string;
  reporterMemberId: string | null;
  reporterDisplay: string;
  reviewerMemberId: string | null;
  reviewerDisplay: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  pageCount: number;
}

export interface ReportProjectOptionRow {
  id: string;
  projectType1: string;
  name: string;
  platform: string;
  serviceGroupId: string | null;
  serviceGroupName: string;
  serviceName: string;
  costGroupId: string | null;
  costGroupName: string;
  reportUrl: string;
}

export interface ProjectPage {
  id: string;
  projectId: string;
  title: string;
  url: string;
  ownerMemberId: string | null;
  monitoringMonth: string;
  trackStatus: PageStatus;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
  note: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  memberId: string;
  taskDate: string;
  costGroupId: string;
  costGroupName: string;
  projectId: string | null;
  pageId: string | null;
  taskType1: string;
  taskType2: string;
  taskUsedtime: number;
  content: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  platform: string;
  serviceGroupName: string;
  serviceName: string;
  projectDisplayName: string;
  pageDisplayName: string;
  pageUrl: string;
}

export interface SearchTaskRow {
  id: string;
  taskDate: string;
  costGroupId: string;
  costGroupName: string;
  taskType1: string;
  taskType2: string;
  taskUsedtime: number;
  content: string;
  note: string;
  updatedAt: string;
  platform: string;
  serviceGroupName: string;
  serviceName: string;
  projectDisplayName: string;
  pageDisplayName: string;
  pageUrl: string;
}

export interface DailyTask {
  id: string;
  taskDate: string;
  projectId: string | null;
  pageId: string | null;
  taskType1: string;
  taskType2: string;
  taskUsedtime: number;
  content: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  memberId: string;
  taskDate: string;
  taskUsedtime: number;
}

export interface DashboardTaskCalendarDay {
  taskDate: string;
  taskUsedtime: number;
}

export interface ResourceSummaryDayRow {
  memberId: string;
  accountId: string;
  memberName: string;
  taskDate: string;
  taskUsedtime: number;
}

export interface ResourceSummaryMemberRow {
  id: string;
  accountId: string;
  name: string;
}

export interface ResourceTypeSummaryRow {
  year: string;
  month: string;
  taskType1: string;
  taskUsedtime: number;
}

export interface ResourceServiceSummaryRow {
  year: string;
  month: string;
  costGroupName: string;
  serviceGroupName: string;
  serviceName: string;
  taskUsedtime: number;
}

export interface ResourceMonthReportRow {
  memberId: string;
  accountId: string;
  taskDate: string;
  costGroupId: string;
  taskType1: string;
  taskType2: string;
  taskUsedtime: number;
  isServiceTask: boolean;
  costGroupName: string;
  serviceGroupName: string;
  serviceName: string;
}

export interface ResourceMonthReportTypeItem {
  type2: string;
  minutes: number;
  requiresServiceGroup: boolean;
}

export interface ResourceMonthReportTypeRow {
  type1: string;
  totalMinutes: number;
  requiresServiceGroup: boolean;
  items: ResourceMonthReportTypeItem[];
}

export interface ResourceMonthReportServiceNameSummary {
  name: string;
  minutes: number;
}

export interface ResourceMonthReportServiceSummaryRow {
  costGroup: string;
  group: string;
  totalMinutes: number;
  names: ResourceMonthReportServiceNameSummary[];
}

export interface ResourceMonthReportServiceDetailItem {
  type1: string;
  minutes: number;
}

export interface ResourceMonthReportServiceDetailName {
  name: string;
  items: ResourceMonthReportServiceDetailItem[];
}

export interface ResourceMonthReportServiceDetailRow {
  costGroup: string;
  group: string;
  totalMinutes: number;
  names: ResourceMonthReportServiceDetailName[];
}

export interface ResourceMonthReportMemberTotal {
  id: string;
  accountId: string;
  totalMinutes: number;
}

export interface ResourceMonthReport {
  typeRows: ResourceMonthReportTypeRow[];
  serviceSummaryRows: ResourceMonthReportServiceSummaryRow[];
  serviceDetailRows: ResourceMonthReportServiceDetailRow[];
  memberTotals: ResourceMonthReportMemberTotal[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface ReportFilters {
  query: string;
  projectId: string;
  pageId: string;
  taskType1: string;
  taskType2: string;
  startDate: string;
  endDate: string;
  minTaskUsedtime: string;
  maxTaskUsedtime: string;
}

export interface SaveTaskInput {
  id?: string;
  taskDate: string;
  costGroupId: string;
  projectId: string | null;
  pageId: string | null;
  taskType1: string;
  taskType2: string;
  taskUsedtime: number;
  content: string;
  note: string;
}

export interface SaveProjectInput {
  id?: string;
  projectType1: string;
  name: string;
  platformId: string | null;
  serviceGroupId: string | null;
  reportUrl: string;
  reporterMemberId: string | null;
  reviewerMemberId: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SaveProjectPageInput {
  id?: string;
  projectId: string;
  title: string;
  url: string;
  ownerMemberId: string | null;
  monitoringMonth?: string;
  trackStatus: PageStatus;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
  note: string;
}

export interface DashboardProjectItem {
  projectId: string;
  type1: string;
  projectName: string;
  platform: string;
  serviceGroupName: string;
  startDate: string;
  endDate: string;
}

export interface DashboardSnapshot {
  inProgressProjects: DashboardProjectItem[];
}

export interface StatsSnapshot {
  totalTaskUsedtime: number;
  totalTasks: number;
  monitoringInProgress: number;
  qaInProgress: number;
  statusBreakdown: Array<{ status: PageStatus; count: number }>;
  typeBreakdown: Array<{ type: string; taskUsedtime: number }>;
}

export interface MonitoringStatsRow {
  pageId: string;
  projectId: string;
  title: string;
  url: string;
  ownerMemberId: string | null;
  monitoringMonth: string;
  trackStatus: PageStatus;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
  note: string;
  updatedAt: string;
  serviceGroupName: string;
  projectName: string;
  platform: string;
  assigneeDisplay: string;
  reportUrl: string;
}

export interface QaStatsProjectRow {
  id: string;
  type1: string;
  name: string;
  serviceGroupName: string;
  reportUrl: string;
  reporterDisplay: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface OpsStore {
  members: Member[];
  platforms: Platform[];
  costGroups: CostGroup[];
  taskTypes: TaskType[];
  serviceGroups: ServiceGroup[];
  projects: Project[];
  projectPages: ProjectPage[];
  tasks: Task[];
}

export const pageStatusOptions: PageStatus[] = ['미수정', '전체 수정', '일부 수정'];

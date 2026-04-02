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
  legacyCostGroupCode: number | null;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Platform {
  id: string;
  legacyPlatformName: string | null;
  name: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface ServiceGroup {
  id: string;
  legacyServiceGroupId: string;
  name: string;
  costGroupId: string | null;
  costGroupName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Project {
  id: string;
  legacyProjectId: string;
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

export interface ProjectPage {
  id: string;
  legacyPageId: string;
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
  legacyTaskId: string;
  memberId: string;
  taskDate: string;
  projectId: string | null;
  pageId: string | null;
  taskType1: string;
  taskType2: string;
  hours: number;
  content: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  memberId: string;
  taskDate: string;
  hours: number;
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
  minHours: string;
  maxHours: string;
}

export interface SaveTaskInput {
  id?: string;
  taskDate: string;
  projectId: string | null;
  pageId: string | null;
  taskType1: string;
  taskType2: string;
  hours: number;
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
  totalHours: number;
  totalTasks: number;
  monitoringInProgress: number;
  qaInProgress: number;
  statusBreakdown: Array<{ status: PageStatus; count: number }>;
  typeBreakdown: Array<{ type: string; hours: number }>;
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

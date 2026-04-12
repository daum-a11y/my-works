export interface AdminTaskSearchFilters {
  startDate: string;
  endDate: string;
  memberId: string;
  costGroupId: string;
  platformId: string;
  serviceGroupId: string;
  projectId: string;
  subtaskId: string;
  taskTypeId: string;
  taskType1: string;
  taskType2: string;
  keyword: string;
}

export interface AdminTaskSearchItem {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  taskDate: string;
  costGroupId: string;
  costGroupName: string;
  platform: string | null;
  projectId: string | null;
  projectName: string | null;
  subtaskId: string | null;
  subtaskTitle: string | null;
  url: string | null;
  serviceGroupId: string | null;
  serviceGroupName: string | null;
  serviceName: string | null;
  taskType1: string;
  taskType2: string;
  taskUsedtime: number;
  content: string;
  note: string;
  updatedAt: string;
}

export interface AdminTaskSearchPage {
  items: AdminTaskSearchItem[];
  totalCount: number;
}

export interface AdminTaskSaveInput {
  id?: string;
  memberId: string;
  taskDate: string;
  costGroupId: string;
  projectId: string;
  subtaskId: string;
  taskType1: string;
  taskType2: string;
  taskUsedtime: number;
  url: string;
  content: string;
  note: string;
}

export interface AdminTaskTypeItem {
  id: string;
  type1: string;
  type2: string;
  note: string;
  displayOrder: number;
  requiresServiceGroup: boolean;
  isActive: boolean;
}

export interface AdminTaskTypePayload {
  id?: string;
  type1: string;
  type2: string;
  note: string;
  displayOrder: number;
  requiresServiceGroup: boolean;
  isActive: boolean;
}

export interface AdminTaskTypeUsageSummary {
  taskCount: number;
}

export interface AdminCostGroupItem {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminCostGroupPayload {
  id?: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminPlatformItem {
  id: string;
  name: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface AdminPlatformPayload {
  id?: string;
  name: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface AdminReorderPayload {
  ids: string[];
}

export interface AdminServiceGroupItem {
  id: string;
  name: string;
  serviceGroupName: string;
  serviceName: string;
  costGroupId: string | null;
  costGroupName: string;
  svcActive: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminServiceGroupPayload {
  id?: string;
  name: string;
  serviceGroupName: string;
  serviceName: string;
  costGroupId: string;
  svcActive: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminServiceGroupUsageSummary {
  projectCount: number;
  projectNames: string[];
}

export interface AdminProjectOption {
  id: string;
  name: string;
  taskTypeId: string | null;
  taskType1: string;
  platformId: string | null;
  platform: string;
  costGroupId: string | null;
  costGroupName: string;
  serviceGroupId: string | null;
  serviceGroupName: string;
  serviceName: string;
  reportUrl: string;
  isActive: boolean;
}

export interface AdminSubtaskOption {
  id: string;
  projectId: string;
  title: string;
  url: string;
  trackStatus: string;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
}

export interface MemberAdminItem {
  id: string;
  authUserId: string | null;
  accountId: string;
  name: string;
  email: string;
  note: string;
  role: 'user' | 'admin';
  userActive: boolean;
  memberStatus: 'pending' | 'active';
  reportRequired: boolean;
  isActive: boolean;
  authEmail: string;
  queueReasons: string[];
  joinedAt: string;
  lastLoginAt: string;
  updatedAt: string;
}

export interface MemberAdminPayload {
  id?: string;
  authUserId?: string | null;
  accountId: string;
  name: string;
  email: string;
  note: string;
  role: 'user' | 'admin';
  userActive: boolean;
  memberStatus: 'pending' | 'active';
  reportRequired: boolean;
  isActive?: boolean;
}

export interface MemberInvitePayload {
  email: string;
  accountId: string;
  name: string;
  role: 'user' | 'admin';
}

export interface MemberPasswordResetPayload {
  email: string;
}

export interface MemberCreateResult {
  action: 'updated' | 'created';
  memberId: string;
}

export interface AdminTaskSearchFilters {
  startDate: string;
  endDate: string;
  memberId: string;
  projectId: string;
  pageId: string;
  taskType1: string;
  taskType2: string;
  serviceGroupId: string;
  keyword: string;
}

export interface AdminTaskSearchItem {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  taskDate: string;
  projectId: string | null;
  projectName: string;
  pageId: string | null;
  pageTitle: string;
  serviceGroupId: string | null;
  serviceGroupName: string;
  taskType1: string;
  taskType2: string;
  hours: number;
  content: string;
  note: string;
  updatedAt: string;
}

export interface AdminTaskSaveInput {
  id?: string;
  memberId: string;
  taskDate: string;
  projectId: string;
  pageId: string;
  taskType1: string;
  taskType2: string;
  hours: number;
  content: string;
  note: string;
}

export interface AdminLookupOption {
  id: string;
  name: string;
  isActive: boolean;
  displayOrder?: number;
  requiresServiceGroup?: boolean;
}

export interface AdminProjectOption {
  id: string;
  name: string;
  serviceGroupId: string | null;
  isActive: boolean;
}

export interface AdminPageOption {
  id: string;
  projectId: string;
  title: string;
  trackStatus: string;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
}

export interface MemberAdminItem {
  id: string;
  authUserId: string | null;
  legacyUserId: string;
  name: string;
  email: string;
  department: string;
  role: "user" | "admin";
  isActive: boolean;
  authEmail: string;
  queueReasons: string[];
  updatedAt: string;
}

export interface MemberAdminPayload {
  id?: string;
  authUserId?: string | null;
  legacyUserId: string;
  name: string;
  email: string;
  department: string;
  role: "user" | "admin";
  isActive: boolean;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function createDefaultAdminTaskSearchFilters(referenceDate = new Date()): AdminTaskSearchFilters {
  return {
    startDate: formatDate(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)),
    endDate: formatDate(referenceDate),
    memberId: "",
    projectId: "",
    pageId: "",
    taskType1: "",
    taskType2: "",
    serviceGroupId: "",
    keyword: "",
  };
}

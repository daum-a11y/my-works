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
  platform: string;
  projectId: string | null;
  projectName: string;
  pageId: string | null;
  pageTitle: string;
  pageUrl: string;
  serviceGroupId: string | null;
  serviceGroupName: string;
  serviceName: string;
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

export interface AdminTaskTypeItem {
  id: string;
  legacyTypeNum: number | null;
  type1: string;
  type2: string;
  displayLabel: string;
  displayOrder: number;
  requiresServiceGroup: boolean;
  isActive: boolean;
}

export interface AdminTaskTypePayload {
  id?: string;
  legacyTypeNum?: number | null;
  type1: string;
  type2: string;
  displayLabel: string;
  displayOrder: number;
  requiresServiceGroup: boolean;
  isActive: boolean;
}

export interface AdminTaskTypeUsageSummary {
  taskCount: number;
}

export interface AdminServiceGroupItem {
  id: string;
  legacySvcNum: number | null;
  name: string;
  svcGroup: string;
  svcName: string;
  svcType: number;
  svcActive: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminServiceGroupPayload {
  id?: string;
  legacySvcNum?: number | null;
  name: string;
  svcGroup: string;
  svcName: string;
  svcType: number;
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
  projectType1: string;
  platform: string;
  serviceGroupId: string | null;
  reportUrl: string;
  isActive: boolean;
}

export interface AdminPageOption {
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
  reportRequired: boolean;
  isActive?: boolean;
}

export interface MemberInvitePayload {
  email: string;
  accountId: string;
  name: string;
  role: 'user' | 'admin';
}

import { toLocalDateInputValue } from '../../lib/utils';

function formatDate(date: Date) {
  return toLocalDateInputValue(date);
}

export function createDefaultAdminTaskSearchFilters(
  referenceDate = new Date(),
): AdminTaskSearchFilters {
  return {
    startDate: formatDate(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)),
    endDate: formatDate(referenceDate),
    memberId: '',
    projectId: '',
    pageId: '',
    taskType1: '',
    taskType2: '',
    serviceGroupId: '',
    keyword: '',
  };
}

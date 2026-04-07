import type { PageStatus } from '../../types/domain';

export interface ProjectFormState {
  id?: string;
  projectType1: string;
  name: string;
  platformId: string;
  serviceGroupId: string;
  reportUrl: string;
  reporterMemberId: string;
  reviewerMemberId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface PageFormState {
  id?: string;
  projectId: string;
  title: string;
  url: string;
  ownerMemberId: string;
  trackStatus: PageStatus;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
  note: string;
}

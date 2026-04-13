import type { SubtaskStatus } from '../../types/domain';

export interface ProjectFormState {
  id?: string;
  taskTypeId: string;
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

export interface SubtaskFormState {
  id?: string;
  projectId: string;
  title: string;
  url: string;
  ownerMemberId: string;
  taskMonth: string;
  taskStatus: SubtaskStatus;
  note: string;
}

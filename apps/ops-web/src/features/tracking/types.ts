export type TrackingState = 0 | 1 | 2 | 3;

export interface TrackingRecord {
  id: string;
  projectCode: string;
  projectName: string;
  pageTitle: string;
  assignee: string;
  reviewer: string;
  state: TrackingState;
  summary: string;
  note: string;
  updatedAt: string;
}

export interface TrackingDraft {
  state: TrackingState;
  assignee: string;
  reviewer: string;
  summary: string;
  note: string;
}

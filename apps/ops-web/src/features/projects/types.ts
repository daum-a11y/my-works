export type ProjectStatus = 'planning' | 'active' | 'blocked' | 'paused' | 'done';

export type ProjectPageStatus = 'queued' | 'working' | 'review' | 'done';

export type ProjectPageTrackEnd = 0 | 1 | 2 | 3;

export interface ProjectPage {
  id: string;
  title: string;
  assignee: string;
  reviewer: string;
  status: ProjectPageStatus;
  trackEnd: ProjectPageTrackEnd;
  note: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  code: string;
  name: string;
  client: string;
  owner: string;
  manager: string;
  status: ProjectStatus;
  summary: string;
  updatedAt: string;
  pages: ProjectPage[];
}

export interface PageAssignmentDraft {
  pageId: string;
  assignee: string;
  reviewer: string;
  status: ProjectPageStatus;
  trackEnd: ProjectPageTrackEnd;
  note: string;
}

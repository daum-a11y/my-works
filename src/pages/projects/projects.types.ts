export type ProjectStatus = 'planning' | 'active' | 'blocked' | 'paused' | 'done';

export type ProjectSubtaskStatus = 'queued' | 'working' | 'review' | 'done';

export type ProjectSubtaskTrackEnd = 0 | 1 | 2 | 3;

export interface ProjectSubtask {
  id: string;
  title: string;
  assignee: string;
  reviewer: string;
  status: ProjectSubtaskStatus;
  trackEnd: ProjectSubtaskTrackEnd;
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
  pages: ProjectSubtask[];
}

export interface PageAssignmentDraft {
  subtaskId: string;
  assignee: string;
  reviewer: string;
  status: ProjectSubtaskStatus;
  trackEnd: ProjectSubtaskTrackEnd;
  note: string;
}

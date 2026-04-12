import type { Member, Project, ProjectSubtask } from '../../types/domain';

export function canDeleteProject(
  project: Project,
  memberId: string | null,
  role: Member['role'] | undefined,
) {
  if (!memberId) {
    return false;
  }

  return (
    role === 'admin' ||
    project.createdByMemberId === memberId ||
    project.reporterMemberId === memberId
  );
}

export function canDeleteSubtask(
  subtask: ProjectSubtask,
  memberId: string | null,
  role: Member['role'] | undefined,
) {
  if (!memberId) {
    return false;
  }

  return role === 'admin' || subtask.ownerMemberId === memberId;
}

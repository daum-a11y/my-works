import type { Member, Project, ProjectPage } from '../../types/domain';

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

export function canDeletePage(
  page: ProjectPage,
  memberId: string | null,
  role: Member['role'] | undefined,
) {
  if (!memberId) {
    return false;
  }

  return role === 'admin' || page.ownerMemberId === memberId;
}

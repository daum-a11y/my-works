import type { MemberAdminItem, MemberAdminPayload } from '../admin.types';

export function getAuthActionLabel(hasAuthAccount: boolean) {
  return hasAuthAccount ? '비밀번호 재설정' : '초대 메일 발송';
}

export function getSaveSuccessMessage(isEditMode: boolean) {
  return isEditMode ? '사용자 정보를 저장했습니다.' : '사용자를 추가하고 초대 메일을 보냈습니다.';
}

export function getInviteSuccessMessage(hasAuthAccount: boolean) {
  return hasAuthAccount ? '비밀번호 재설정 메일을 보냈습니다.' : '초대 메일을 보냈습니다.';
}

export function getDeleteSuccessMessage(result: 'deleted' | 'deactivated') {
  return result === 'deleted'
    ? '사용자와 인증 계정을 삭제했습니다.'
    : '업무 데이터가 있어 사용자를 비활성 보관 처리했습니다.';
}

export function buildInvitePayload(selectedMember: MemberAdminItem): MemberAdminPayload {
  return {
    id: selectedMember.id,
    authUserId: selectedMember.authUserId,
    accountId: selectedMember.accountId,
    name: selectedMember.name,
    email: selectedMember.email,
    note: selectedMember.note,
    role: selectedMember.role,
    userActive: selectedMember.userActive,
    memberStatus: selectedMember.memberStatus,
    reportRequired: selectedMember.reportRequired,
    isActive: selectedMember.isActive,
  };
}

export function getDeleteConfirmMessage(name: string) {
  return `${name} 사용자를 삭제하시겠습니까?\n업무 데이터가 없으면 사용자와 인증 계정을 함께 삭제하고, 업무 데이터가 있으면 비활성 보관 처리합니다.`;
}

export function getInviteConfirmMessage(name: string, hasAuthAccount: boolean) {
  return hasAuthAccount
    ? `${name}에게 비밀번호 재설정 메일을 보내시겠습니까?`
    : `${name}에게 초대 메일을 보내시겠습니까?`;
}

export function getRestoreConfirmMessage(name: string) {
  return `${name} 사용자를 다시 활성화하시겠습니까?`;
}

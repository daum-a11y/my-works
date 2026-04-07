import type { MemberAdminPayload } from '../admin.types';

export interface AdminMemberEditorState {
  draft: MemberAdminPayload;
  localErrorMessage: string;
}

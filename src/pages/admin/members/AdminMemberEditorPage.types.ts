import type { MemberAdminPayload } from '../types';

export interface AdminMemberEditorState {
  draft: MemberAdminPayload;
  localErrorMessage: string;
}

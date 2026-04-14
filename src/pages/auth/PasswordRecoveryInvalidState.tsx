import { AuthLayoutShell } from '../../components/layout/AuthLayoutShell';
import { Button } from '../../components/base/Button';

interface PasswordRecoveryInvalidStateProps {
  onLogin: () => void;
}

export function PasswordRecoveryInvalidState({ onLogin }: PasswordRecoveryInvalidStateProps) {
  return (
    <AuthLayoutShell
      caption="비밀번호 재설정"
      labelledBy="recovery-invalid-title"
      title="유효하지 않은 재설정 링크"
      description="비밀번호 재설정 메일에서 다시 진입해 주세요. 필요하면 로그인 화면에서 메일을 다시 요청하실 수 있습니다."
      body={
        <div className="auth-layout-shell__actions">
          <Button type="button" onPress={onLogin}>
            로그인으로 이동
          </Button>
        </div>
      }
    />
  );
}

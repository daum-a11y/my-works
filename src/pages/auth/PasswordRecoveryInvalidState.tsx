import { BrandLogo } from '../../components/layout/BrandLogo';
import { Button } from '../../components/base/Button';

interface PasswordRecoveryInvalidStateProps {
  onLogin: () => void;
}

export function PasswordRecoveryInvalidState({ onLogin }: PasswordRecoveryInvalidStateProps) {
  return (
    <main className="password-recovery-page">
      <section className="password-recovery-page__panel" aria-labelledby="recovery-invalid-title">
        <div className="password-recovery-page__hero">
          <h1 className="password-recovery-page__logo-heading">
            <BrandLogo
              className="password-recovery-page__logo"
              alt="My Works"
              width={100}
              height={30}
            />
          </h1>
          <p id="recovery-invalid-title" className="password-recovery-page__caption">
            비밀번호 재설정
          </p>
        </div>
        <div className="password-recovery-page__form">
          <div className="password-recovery-page__lead">
            <h1 className="password-recovery-page__title">유효하지 않은 재설정 링크</h1>
            <p className="password-recovery-page__description">
              비밀번호 재설정 메일에서 다시 진입해 주세요. 필요하면 로그인 화면에서 메일을 다시
              요청하실 수 있습니다.
            </p>
          </div>
          <div className="password-recovery-page__actions">
            <Button type="button" onPress={onLogin}>
              로그인으로 이동
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

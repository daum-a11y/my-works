import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/Field";
import { isSupabaseConfigured } from "../../lib/env";
import { useAuth } from "./AuthContext";
import styles from "./ForgotPasswordPage.module.css";

const forgotPasswordSchema = z.object({
  email: z.string().email("이메일 형식으로 입력해 주세요."),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    document.title = "My Works · 비밀번호 찾기";
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="forgot-password-title">
        <div className={styles.introBlock}>
          <h1 className={styles.logoHeading}>
            <img
              className={styles.logo}
              src="/img/my-works-logo-200x60.png"
              alt="My Works"
              width="100"
              height="30"
            />
          </h1>
          <p id="forgot-password-title" className={styles.caption}>비밀번호 찾기</p>
        </div>
        <div className={styles.formBlock}>
          <div className={styles.hero}>
            <p className={styles.description}>
              가입한 이메일 주소를 입력하면 재설정 메일을 보내어 새 비밀번호를 설정합니다.
            </p>
          </div>
          <form
            className={styles.form}
            onSubmit={handleSubmit(async (values) => {
              try {
                setErrorMessage("");
                setNoticeMessage("");
                await resetPassword(values.email);
                setNoticeMessage("메일을 확인해 비밀번호를 재설정해 주세요.");
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "메일 발송 실패.");
              }
            })}
          >
            <InputField
              label="이메일"
              type="email"
              autoComplete="username"
              errorMessage={errors.email?.message}
              disabled={!isSupabaseConfigured || isSubmitting}
              {...register("email")}
            />
            {noticeMessage ? (
              <div className={styles.notice} data-state="success" role="status">
                <strong>메일 발송 완료</strong>
                <p>{noticeMessage}</p>
              </div>
            ) : null}
            {errorMessage ? (
              <div className={styles.error} role="alert">
                <strong>입력 확인 필요</strong>
                <p>{errorMessage}</p>
              </div>
            ) : null}
            <div className={styles.actions}>
              <Button type="submit" isDisabled={!isSupabaseConfigured || isSubmitting}>
                {isSubmitting ? "메일 발송 중..." : "재설정 메일 보내기"}
              </Button>
            </div>
            <div className={styles.recoveryPanel}>
              <button type="button" className={styles.backLink} onClick={() => navigate("/login")}>
                로그인으로 돌아가기
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

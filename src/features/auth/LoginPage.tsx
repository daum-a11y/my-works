import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isSupabaseConfigured } from "../../lib/env";
import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/Field";
import styles from "./LoginPage.module.css";

const loginSchema = z.object({
  email: z.string().email("이메일 형식으로 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, resetPassword, session, status } = useAuth();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState(
    typeof location.state === "object" && location.state && "noticeMessage" in location.state
      ? String(location.state.noticeMessage)
      : "",
  );
  const [isWorking, setIsWorking] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (status === "authenticated" && session) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    document.title = "My Works · 로그인";
  }, []);

  const isBusy = isSubmitting || isWorking;

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.hero}>
          <h1 className={styles.logoHeading}>
            <img
              className={styles.logo}
              src="/img/my-works-logo-200x60.png"
              alt="My Works"
              width="200"
              height="60"
            />
          </h1>
          <p id="login-title" className={styles.caption}>로그인</p>
        </div>
        <form
          className={styles.form}
          onSubmit={handleSubmit(async (values) => {
            try {
              setErrorMessage("");
              setNoticeMessage("");
              await login(values.email, values.password);
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
            }
          })}
        >
          <InputField
            label="이메일"
            type="email"
            autoComplete="username"
            errorMessage={errors.email?.message}
            disabled={!isSupabaseConfigured || isBusy}
            {...register("email")}
          />
          <InputField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            errorMessage={errors.password?.message}
            disabled={!isSupabaseConfigured || isBusy}
            {...register("password")}
          />
          {noticeMessage ? (
            <p className={styles.notice} data-state="success" role="status">
              {noticeMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          ) : null}
          <div className={styles.submitRow}>
            <Button type="submit" isDisabled={!isSupabaseConfigured || isBusy}>
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.textLink}
              disabled={!isSupabaseConfigured || isBusy}
              onClick={async () => {
                const validEmail = await trigger("email");
                if (!validEmail) return;
                const { email } = getValues();
                try {
                  setIsWorking(true);
                  setErrorMessage("");
                  setNoticeMessage("");
                  await resetPassword(email);
                  setNoticeMessage("메일을 확인해 비밀번호를 재설정해 주세요.");
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "메일 발송 실패.");
                } finally {
                  setIsWorking(false);
                }
              }}
            >
              비밀번호 찾기
            </button>
          </div>
        </form>
      </section>
      {!isSupabaseConfigured ? (
        <div className={`${styles.notice} ${styles.configNotice}`} data-state="info">
          <strong>환경 설정 필요</strong>
          <p>`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 설정되어야 로그인할 수 있습니다.</p>
        </div>
      ) : null}
    </main>
  );
}

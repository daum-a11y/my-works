import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
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
  const { login, session, status } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const {
    register,
    handleSubmit,
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

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.hero}>
          <h1>My Works</h1>
          <p className={styles.caption}>로그인</p>
        </div>
        <form
          className={styles.form}
          onSubmit={handleSubmit(async (values) => {
            try {
              setErrorMessage("");
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
            disabled={!isSupabaseConfigured || isSubmitting}
            {...register("email")}
          />
          <InputField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            errorMessage={errors.password?.message}
            disabled={!isSupabaseConfigured || isSubmitting}
            {...register("password")}
          />
          {errorMessage ? (
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button type="submit" isDisabled={!isSupabaseConfigured || isSubmitting}>
            {isSubmitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </section>
      {!isSupabaseConfigured ? (
        <div className={styles.notice} data-state="info">
          <strong>환경 설정 필요</strong>
          <p>`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 설정되어야 로그인할 수 있습니다.</p>
        </div>
      ) : null}
    </main>
  );
}

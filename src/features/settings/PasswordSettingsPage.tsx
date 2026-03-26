import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/Field";
import { useAuth } from "../auth/AuthContext";
import styles from "./PasswordSettingsPage.module.css";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
    nextPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다."),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해 주세요."),
  })
  .refine((values) => values.nextPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordSettingsPage() {
  const { updatePassword } = useAuth();
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "danger">("success");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>설정</p>
        <h1>계정 보안</h1>
        <p>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2>작업 기준</h2>
          <p>비밀번호는 즉시 갱신되며 다음 로그인부터 새 값이 적용됩니다.</p>
        </aside>

        <form
          className={styles.form}
          onSubmit={handleSubmit(async (values) => {
            try {
              await updatePassword(values.currentPassword, values.nextPassword);
              setMessageTone("success");
              setMessage("비밀번호를 변경했습니다.");
              reset();
            } catch (error) {
              setMessageTone("danger");
              setMessage(error instanceof Error ? error.message : "비밀번호를 변경하지 못했습니다.");
            }
          })}
        >
          <InputField
            label="현재 비밀번호"
            type="password"
            autoComplete="current-password"
            errorMessage={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <InputField
            label="변경할 비밀번호"
            type="password"
            autoComplete="new-password"
            errorMessage={errors.nextPassword?.message}
            {...register("nextPassword")}
          />
          <InputField
            label="비밀번호 재확인"
            type="password"
            autoComplete="new-password"
            errorMessage={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          {message ? (
            <p className={styles.message} data-state={messageTone} role={messageTone === "success" ? "status" : "alert"}>
              {message}
            </p>
          ) : null}
          <Button type="submit" isDisabled={isSubmitting}>
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </div>
    </div>
  );
}

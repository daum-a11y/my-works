import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/Field";
import { PageSection } from "../../components/ui/PageSection";
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
  const { session, updatePassword } = useAuth();
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
      <PageSection
        title="비밀번호 변경"
        description="현재 비밀번호와 새 비밀번호를 입력해 계정 정보를 안전하게 갱신합니다."
      >
        <div className={styles.identity}>
          <div>
            <span>ID</span>
            <strong>{session?.member.legacyUserId}</strong>
          </div>
          <div>
            <span>이름</span>
            <strong>{session?.member.name}</strong>
          </div>
        </div>
        <form
          className={styles.form}
          onSubmit={handleSubmit(async (values) => {
            try {
              await updatePassword(values.nextPassword);
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
            label="새 비밀번호"
            type="password"
            autoComplete="new-password"
            errorMessage={errors.nextPassword?.message}
            {...register("nextPassword")}
          />
          <InputField
            label="비밀번호 확인"
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
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </form>
      </PageSection>
    </div>
  );
}

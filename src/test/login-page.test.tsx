import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../features/auth/LoginPage";

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../lib/env", () => ({
  isSupabaseConfigured: true,
}));

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      status: "guest",
      authFlow: "default",
      isRecoverySession: false,
      session: null,
      login: vi.fn(),
      resetPassword: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  it("renders only login and password reset actions", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: "My Works" })).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "비밀번호 찾기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "회원가입" })).not.toBeInTheDocument();
  });

  it("sends a password reset email and shows the updated success message", async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      status: "guest",
      authFlow: "default",
      isRecoverySession: false,
      session: null,
      login: vi.fn(),
      resetPassword,
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: "이메일" }), "crew@example.com");
    await user.click(screen.getByRole("button", { name: "비밀번호 찾기" }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith("crew@example.com");
    });

    expect(screen.getByText("메일을 확인해 비밀번호를 재설정해 주세요.")).toBeInTheDocument();
  });
});

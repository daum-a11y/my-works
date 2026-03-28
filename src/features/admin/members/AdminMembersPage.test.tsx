import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMembersPage } from "./AdminMembersPage";

const listMembersAdmin = vi.fn();
const saveMemberAdmin = vi.fn();
const inviteMemberAdmin = vi.fn();
const deleteMemberAdmin = vi.fn();

vi.mock("../admin-client", () => ({
  adminDataClient: {
    listMembersAdmin: (...args: unknown[]) => listMembersAdmin(...args),
    saveMemberAdmin: (...args: unknown[]) => saveMemberAdmin(...args),
    inviteMemberAdmin: (...args: unknown[]) => inviteMemberAdmin(...args),
    deleteMemberAdmin: (...args: unknown[]) => deleteMemberAdmin(...args),
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
  listMembersAdmin.mockReset();
  saveMemberAdmin.mockReset();
  inviteMemberAdmin.mockReset();
  deleteMemberAdmin.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminMembersPage", () => {
  it("renders the original-style member table without auth queue columns", async () => {
    listMembersAdmin.mockResolvedValue([
      {
        id: "member-1",
        authUserId: "auth-1",
        legacyUserId: "jenny.c",
        name: "제니",
        email: "jenny@example.com",
        role: "user",
        userActive: true,
        isActive: true,
        authEmail: "jenny@example.com",
        queueReasons: [],
        updatedAt: "2026-03-27T00:00:00.000Z",
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminMembersPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "사용자 관리" })).toBeInTheDocument();
    await screen.findByRole("button", { name: "초대 메일" });

    expect(screen.getByRole("columnheader", { name: "ID" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "이름" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "이메일" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "권한" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "활성여부" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "등록일" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "최종로그인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "초대 메일" })).toBeInTheDocument();
    expect(screen.queryByText("Auth 연결")).not.toBeInTheDocument();
  });

  it("supports add row and invite flows", async () => {
    listMembersAdmin.mockResolvedValue([
      {
        id: "member-1",
        authUserId: null,
        legacyUserId: "jenny.c",
        name: "제니",
        email: "jenny@example.com",
        role: "user",
        userActive: true,
        isActive: true,
        authEmail: "jenny@example.com",
        queueReasons: [],
        updatedAt: "2026-03-27T00:00:00.000Z",
      },
    ]);
    saveMemberAdmin.mockResolvedValue({
      id: "member-2",
      authUserId: null,
      legacyUserId: "baro.h",
      name: "바로",
      email: "baro@example.com",
      role: "admin",
      userActive: true,
      isActive: true,
      authEmail: "baro@example.com",
      queueReasons: [],
      updatedAt: "2026-03-27T00:00:00.000Z",
    });
    inviteMemberAdmin.mockResolvedValue(undefined);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <AdminMembersPage />
      </QueryClientProvider>,
    );

    await screen.findByRole("button", { name: "초대 메일" });

    await user.click(screen.getByRole("button", { name: "사용자 추가" }));
    await user.type(screen.getByLabelText("ID"), "baro.h");
    await user.type(screen.getByLabelText("이름"), "바로");
    await user.type(screen.getByLabelText("이메일"), "baro@example.com");
    await user.selectOptions(screen.getByLabelText("권한"), "admin");
    await user.click(screen.getByRole("button", { name: "저장 및 초대" }));

    await waitFor(() => {
      expect(saveMemberAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          legacyUserId: "baro.h",
          name: "바로",
          email: "baro@example.com",
          role: "admin",
          userActive: true,
        }),
      );
    });

    await waitFor(() => {
      expect(inviteMemberAdmin).toHaveBeenCalledWith({
        email: "baro@example.com",
        legacyUserId: "baro.h",
        name: "바로",
        role: "admin",
      });
    });

    await user.click(screen.getByRole("button", { name: "초대 메일" }));

    await waitFor(() => {
      expect(inviteMemberAdmin).toHaveBeenCalledWith({
        email: "jenny@example.com",
        legacyUserId: "jenny.c",
        name: "제니",
        role: "user",
      });
    });
  });
});

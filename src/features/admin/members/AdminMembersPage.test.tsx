import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMembersPage } from "./AdminMembersPage";

const listMembersAdmin = vi.fn();
const saveMemberAdmin = vi.fn();
const deleteMemberAdmin = vi.fn();
const resetMemberPasswordAdmin = vi.fn();

vi.mock("../admin-client", () => ({
  adminDataClient: {
    listMembersAdmin: (...args: unknown[]) => listMembersAdmin(...args),
    saveMemberAdmin: (...args: unknown[]) => saveMemberAdmin(...args),
    deleteMemberAdmin: (...args: unknown[]) => deleteMemberAdmin(...args),
    resetMemberPasswordAdmin: (...args: unknown[]) => resetMemberPasswordAdmin(...args),
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
  listMembersAdmin.mockReset();
  saveMemberAdmin.mockReset();
  deleteMemberAdmin.mockReset();
  resetMemberPasswordAdmin.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
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

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "사용자 관리" })).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "ID" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "이름" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "권한" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "활성여부" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "등록일" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "최종로그인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PW 초기화" })).toBeInTheDocument();
    expect(screen.queryByText("Auth 연결")).not.toBeInTheDocument();
  });

  it("supports add row and password reset flows", async () => {
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
      email: "baro.h",
      role: "admin",
      userActive: true,
      isActive: true,
      authEmail: "baro.h",
      queueReasons: [],
      updatedAt: "2026-03-27T00:00:00.000Z",
    });

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

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "사용자 추가" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "사용자 추가" }));
    await user.type(screen.getByLabelText("ID"), "baro.h");
    await user.type(screen.getByLabelText("이름"), "바로");
    await user.selectOptions(screen.getByLabelText("권한"), "admin");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(saveMemberAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          legacyUserId: "baro.h",
          name: "바로",
          email: "baro.h",
          role: "admin",
          userActive: true,
        }),
      );
    });

    await user.click(screen.getByRole("button", { name: "PW 초기화" }));

    await waitFor(() => {
      expect(resetMemberPasswordAdmin).toHaveBeenCalledWith("jenny@example.com");
    });
  });
});

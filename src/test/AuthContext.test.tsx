import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../pages/auth/AuthContext';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockOnAuthStateChange = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockResetPasswordForEmail = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockGetMemberByAuthId = vi.hoisted(() => vi.fn());
const mockBindAuthSessionMember = vi.hoisted(() => vi.fn());
const mockTouchMemberLastLogin = vi.hoisted(() => vi.fn());
const mockGetMemberByEmail = vi.hoisted(() => vi.fn());
const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
  },
}));
let authStateChangeCallback: ((event: string, session: unknown) => void) | null = null;

vi.mock('../config/env', () => ({
  isSupabaseConfigured: true,
  env: {
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    appUrl: 'http://localhost:4173',
  },
}));

vi.mock('../api/supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

vi.mock('../api/client', () => ({
  dataClient: {
    getMemberByAuthId: mockGetMemberByAuthId,
    bindAuthSessionMember: mockBindAuthSessionMember,
    touchMemberLastLogin: mockTouchMemberLastLogin,
    getMemberByEmail: mockGetMemberByEmail,
  },
}));

function AuthProbe() {
  const { status, authFlow, isRecoverySession } = useAuth();

  return (
    <output>
      {status}:{authFlow}:{String(isRecoverySession)}
    </output>
  );
}

describe('AuthContext', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockSignOut.mockReset();
    mockResetPasswordForEmail.mockReset();
    mockUpdateUser.mockReset();
    mockGetMemberByAuthId.mockReset();
    mockBindAuthSessionMember.mockReset();
    mockTouchMemberLastLogin.mockReset();
    mockGetMemberByEmail.mockReset();

    mockGetSession.mockResolvedValue({
      data: {
        session: null,
      },
    });

    mockOnAuthStateChange.mockImplementation(
      (callback: (event: string, session: unknown) => void) => {
        authStateChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      },
    );
  });

  it('switches to recovery flow when Supabase emits PASSWORD_RECOVERY', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('guest:default:false')).toBeInTheDocument();
    });

    await act(async () => {
      await authStateChangeCallback?.('PASSWORD_RECOVERY', {
        user: {
          id: 'auth-user-1',
          email: 'crew@example.com',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('guest:recovery:true')).toBeInTheDocument();
    });
  });

  it('keeps recovery flow when entering from a recovery link before a session is available', async () => {
    window.history.replaceState({}, '', '/auth/recovery#type=recovery');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('guest:recovery:true')).toBeInTheDocument();
    });
  });

  it('keeps recovery flow when a recovery session already exists on the recovery route', async () => {
    window.history.replaceState({}, '', '/auth/recovery');
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'auth-user-1',
            email: 'crew@example.com',
          },
        },
      },
    });
    mockTouchMemberLastLogin.mockResolvedValue({
      id: 'member-1',
      authUserId: 'auth-user-1',
      accountId: 'crew',
      name: '크루',
      email: 'crew@example.com',
      role: 'user',
      isActive: true,
      status: 'active',
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('guest:recovery:true')).toBeInTheDocument();
    });
    expect(mockTouchMemberLastLogin).not.toHaveBeenCalled();
  });

  it('returns to default guest flow when signing out from a recovery session', async () => {
    window.history.replaceState({}, '', '/auth/recovery#type=recovery');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('guest:recovery:true')).toBeInTheDocument();
    });

    await act(async () => {
      await authStateChangeCallback?.('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByText('guest:default:false')).toBeInTheDocument();
    });
  });

  it('signs out when the linked member is inactive', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'auth-user-1',
            email: 'crew@example.com',
          },
        },
      },
    });
    mockTouchMemberLastLogin.mockResolvedValue(null);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockTouchMemberLastLogin).toHaveBeenCalledWith('auth-user-1', 'crew@example.com');
    });

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByText('guest:default:false')).toBeInTheDocument();
    });
  });

  it('keeps recovery flow when auth state changes with a recovery session on the recovery route', async () => {
    window.history.replaceState({}, '', '/auth/recovery');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('guest:default:false')).toBeInTheDocument();
    });

    await act(async () => {
      await authStateChangeCallback?.('SIGNED_IN', {
        user: {
          id: 'auth-user-1',
          email: 'crew@example.com',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('guest:recovery:true')).toBeInTheDocument();
    });
    expect(mockTouchMemberLastLogin).not.toHaveBeenCalled();
  });
});

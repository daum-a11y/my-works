import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';

const mockGetSession = vi.hoisted(() => vi.fn());
const mockOnAuthStateChange = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockResetPasswordForEmail = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockGetMemberByAuthId = vi.hoisted(() => vi.fn());
const mockBindAuthSessionMember = vi.hoisted(() => vi.fn());
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

vi.mock('../lib/env', () => ({
  isSupabaseConfigured: true,
  env: {
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    appUrl: 'http://localhost:4173',
  },
}));

vi.mock('../lib/supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

vi.mock('../lib/data-client', () => ({
  opsDataClient: {
    getMemberByAuthId: mockGetMemberByAuthId,
    bindAuthSessionMember: mockBindAuthSessionMember,
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
  beforeEach(() => {
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockSignOut.mockReset();
    mockResetPasswordForEmail.mockReset();
    mockUpdateUser.mockReset();
    mockGetMemberByAuthId.mockReset();
    mockBindAuthSessionMember.mockReset();
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
});

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { isSupabaseConfigured } from '../../lib/env';
import { opsDataClient } from '../../lib/data-client';
import { type Member } from '../../lib/domain';
import { getPasswordRecoveryRedirectUrl, isPasswordRecoveryUrl } from './auth-urls';

type AuthStatus = 'loading' | 'guest' | 'authenticated';
type AuthFlow = 'default' | 'recovery';

interface AuthSession {
  member: Member;
}

interface AuthContextValue {
  status: AuthStatus;
  authFlow: AuthFlow;
  isRecoverySession: boolean;
  session: AuthSession | null;
  login(email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  logout(): Promise<void>;
  updatePassword(nextPassword: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function getMemberForSupabaseSession(
  userId: string,
  email?: string | null,
): Promise<Member | null> {
  const touchedMember = await opsDataClient.touchMemberLastLogin(userId, email);
  if (touchedMember) {
    return touchedMember;
  }

  return email ? opsDataClient.getMemberByEmail(email) : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [authFlow, setAuthFlow] = useState<AuthFlow>('default');
  const [session, setSession] = useState<AuthSession | null>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (isSupabaseConfigured && supabase) {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (!activeSession?.user) {
          startTransition(() => {
            setAuthFlow('default');
            setStatus('guest');
            setSession(null);
          });
          return;
        }

        if (isPasswordRecoveryUrl()) {
          startTransition(() => {
            setAuthFlow('recovery');
            setStatus('guest');
            setSession(null);
          });
          return;
        }

        const member = await getMemberForSupabaseSession(
          activeSession.user.id,
          activeSession.user.email,
        );

        if (!member || !member.isActive) {
          await supabase.auth.signOut();
          startTransition(() => {
            setAuthFlow('default');
            setStatus('guest');
            setSession(null);
          });
          return;
        }

        startTransition(() => {
          setAuthFlow('default');
          setSession({ member });
          setStatus('authenticated');
        });
        return;
      }
      setAuthFlow('default');
      setStatus('guest');
      setSession(null);
    }

    void bootstrap();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void (async () => {
        if (!mounted) {
          return;
        }

        if (event === 'PASSWORD_RECOVERY') {
          startTransition(() => {
            setAuthFlow('recovery');
            setSession(null);
            setStatus('guest');
          });
          return;
        }

        if (!nextSession?.user) {
          startTransition(() => {
            setAuthFlow('default');
            setSession(null);
            setStatus('guest');
          });
          return;
        }

        const member = await getMemberForSupabaseSession(
          nextSession.user.id,
          nextSession.user.email,
        );
        if (!member || !member.isActive) {
          await supabase.auth.signOut();
          startTransition(() => {
            setAuthFlow('default');
            setSession(null);
            setStatus('guest');
          });
          return;
        }

        startTransition(() => {
          setAuthFlow('default');
          setSession({ member });
          setStatus('authenticated');
        });
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      authFlow,
      isRecoverySession: authFlow === 'recovery',
      session,
      async login(email, password) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
          throw new Error('이메일을 입력해 주세요.');
        }

        if (!password.trim()) {
          throw new Error('비밀번호를 입력해 주세요.');
        }

        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) {
          throw new Error('이메일 또는 비밀번호를 확인해 주세요.');
        }
      },
      async resetPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
          throw new Error('이메일을 입력해 주세요.');
        }

        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
        }

        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: getPasswordRecoveryRedirectUrl(),
        });

        if (error) {
          throw new Error(error.message);
        }
      },
      async logout() {
        if (!isSupabaseConfigured || !supabase) {
          setAuthFlow('default');
          setSession(null);
          setStatus('guest');
          return;
        }

        setAuthFlow('default');
        await supabase.auth.signOut();
      },
      async updatePassword(nextPassword) {
        if (nextPassword.trim().length < 8) {
          throw new Error('비밀번호는 8자 이상이어야 합니다.');
        }

        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
        }

        const { error } = await supabase.auth.updateUser({ password: nextPassword });
        if (error) {
          throw new Error(error.message);
        }
      },
    }),
    [authFlow, session, status, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

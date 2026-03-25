import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { getSupabaseClient } from "../../lib/supabase";
import { isSupabaseConfigured } from "../../lib/env";
import { opsDataClient } from "../../lib/data-client";
import { type Member } from "../../lib/domain";

type AuthStatus = "loading" | "guest" | "authenticated";

interface AuthSession {
  member: Member;
}

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  updatePassword(nextPassword: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function getMemberForSupabaseSession(userId: string, email?: string | null): Promise<Member | null> {
  const memberByAuthId = await opsDataClient.getMemberByAuthId(userId);
  if (memberByAuthId) {
    return memberByAuthId;
  }
  if (email) {
    return opsDataClient.getMemberByEmail(email);
  }
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
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
            setStatus("guest");
            setSession(null);
          });
          return;
        }

        const member = await getMemberForSupabaseSession(activeSession.user.id, activeSession.user.email);

        if (!member || !member.isActive) {
          await supabase.auth.signOut();
          startTransition(() => {
            setStatus("guest");
            setSession(null);
          });
          return;
        }

        startTransition(() => {
          setSession({ member });
          setStatus("authenticated");
        });
        return;
      }
      setStatus("guest");
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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void (async () => {
        if (!mounted) {
          return;
        }

        if (!nextSession?.user) {
          startTransition(() => {
            setSession(null);
            setStatus("guest");
          });
          return;
        }

        const member = await getMemberForSupabaseSession(nextSession.user.id, nextSession.user.email);
        if (!member || !member.isActive) {
          await supabase.auth.signOut();
          startTransition(() => {
            setSession(null);
            setStatus("guest");
          });
          return;
        }

        startTransition(() => {
          setSession({ member });
          setStatus("authenticated");
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
      session,
      async login(email, password) {
        if (!password.trim()) {
          throw new Error("비밀번호를 입력해 주세요.");
        }

        if (!isSupabaseConfigured || !supabase) {
          throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw new Error(error.message);
        }
      },
      async logout() {
        if (!isSupabaseConfigured || !supabase) {
          setSession(null);
          setStatus("guest");
          return;
        }

        await supabase.auth.signOut();
      },
      async updatePassword(nextPassword) {
        if (nextPassword.trim().length < 8) {
          throw new Error("비밀번호는 8자 이상이어야 합니다.");
        }

        if (!isSupabaseConfigured || !supabase) {
          throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
        }

        const { error } = await supabase.auth.updateUser({ password: nextPassword });
        if (error) {
          throw new Error(error.message);
        }
      },
    }),
    [session, status, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';

type HealthState = 'loading' | 'ok' | 'error';

interface HealthCheckRow {
  ok: boolean;
}

export function HealthCheckPage() {
  const [status, setStatus] = useState<HealthState>('loading');

  useEffect(() => {
    let active = true;

    document.title = 'My Works · Health Check';

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus('error');
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const { data, error } = await supabase.rpc('health_check');
        if (error) {
          throw error;
        }

        const rows = (data ?? []) as HealthCheckRow[];
        const nextStatus = rows[0]?.ok === true ? 'ok' : 'error';

        if (active) {
          setStatus(nextStatus);
        }
      } catch {
        if (active) {
          setStatus('error');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const label = status === 'ok' ? 'OK' : status === 'error' ? 'ERROR' : '';

  return (
    <main
      aria-live="polite"
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        background: '#ffffff',
        color: '#111111',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '4rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      {label}
    </main>
  );
}

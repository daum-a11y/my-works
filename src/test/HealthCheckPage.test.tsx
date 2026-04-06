import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthCheckPage } from '../pages/health';

const mockRpc = vi.hoisted(() => vi.fn());

vi.mock('../api/supabase', () => ({
  getSupabaseClient: () => ({
    rpc: mockRpc,
  }),
}));

describe('HealthCheckPage', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('renders OK when the health check rpc succeeds', async () => {
    mockRpc.mockResolvedValue({
      data: [{ ok: true }],
      error: null,
    });

    render(<HealthCheckPage />);

    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
  });

  it('renders ERROR when the health check rpc fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: new Error('database unavailable'),
    });

    render(<HealthCheckPage />);

    await waitFor(() => {
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });
  });
});

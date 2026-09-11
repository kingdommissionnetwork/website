import { expect, test, describe, beforeAll, vi } from 'vitest';
import { Hono } from 'hono';
import { donationRoutes } from './donations';
import { getSupabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

process.env.JWT_SECRET = 'test-secret';

const app = new Hono();
app.route('/', donationRoutes);

type Row = Record<string, unknown>;

/**
 * Chainable PostgREST-shaped mock: every query-builder method returns the
 * chain itself; the terminal `.limit()` resolves with { data, error }.
 */
function chainFor(result: { data: Row[] | null; error: { message: string } | null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    from: vi.fn(() => chain),
  };
  for (const method of ['select', 'eq', 'or', 'ilike', 'order', 'in']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.limit = vi.fn(() => Promise.resolve(result));
  return chain;
}

const donationRow: Row = {
  id: 16,
  amount: 5000,
  currency: 'KES',
  donor_name: 'Test Donor',
  donor_email: 'donor@example.com',
  recurring: false,
  payment_provider: 'paystack',
  payment_reference: 'RTY54EW23R',
  status: 'completed',
  created_at: '2026-01-15T10:00:00Z',
};

const subscriptionRow: Row = {
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  subscriber_name: 'Jane Partner',
  subscriber_email: 'jane@example.com',
  plan_name: 'Harvest Partner',
  status: 'active',
  created_at: '2026-02-01T09:00:00Z',
  billing_cycle: 'monthly',
};

beforeAll(() => {
  process.env.DISABLE_RATE_LIMIT = '1';
});

describe('Donation Routes', () => {
  test('POST / requires auth (no token)', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100, donor_email: 'test@test.com' }),
    });
    expect(res.status).toBe(401);
  });

  test('POST / rejects with invalid token', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.here',
      },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(res.status).toBe(401);
  });

  test('GET /history returns empty without email', async () => {
    const res = await app.request('/history');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  test('GET /history returns 401 without token when email provided', async () => {
    const res = await app.request('/history?email=test@test.com');
    expect(res.status).toBe(401);
  });

  test('GET /history returns 401 with invalid token', async () => {
    const res = await app.request('/history?email=test@test.com', {
      headers: { Authorization: 'Bearer bad.token.here' },
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /verify-receipt (fail-closed verification)', () => {
  test('returns 400 when missing parameters', async () => {
    const res = await app.request('/verify-receipt');
    expect(res.status).toBe(400);
  });

  test('returns the real record for a known payment reference', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: [donationRow], error: null }) as never);
    const res = await app.request('/verify-receipt?ref=RTY54EW23R');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(true);
    expect(body.type).toBe('invoice');
    expect(body.amount).toBe(5000);
    expect(body.reference).toBe('RTY54EW23R');
  });

  test('returns verified:false for an unknown payment reference (no synthetic data)', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: [], error: null }) as never);
    const res = await app.request('/verify-receipt?ref=FAKE123456');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(false);
    expect(body.amount).toBeUndefined();
    expect(body.donorName).toBeUndefined();
  });

  test('returns verified:false when the registry lookup errors (fail closed)', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: null, error: { message: 'db down' } }) as never);
    const res = await app.request('/verify-receipt?ref=RTY54EW23R');
    const body = await res.json();
    expect(body.verified).toBe(false);
  });

  test('returns verified:false when Supabase is not configured (fail closed)', async () => {
    vi.mocked(getSupabase).mockImplementation(() => {
      throw new Error('SUPABASE_URL must be set');
    });
    const res = await app.request('/verify-receipt?ref=RTY54EW23R');
    const body = await res.json();
    expect(body.verified).toBe(false);
  });

  test('verifies a partner by credential ID', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: [subscriptionRow], error: null }) as never);
    const res = await app.request('/verify-receipt?partner=HKN-PTN-4029');
    const body = await res.json();
    expect(body.verified).toBe(true);
    expect(body.type).toBe('partner');
    expect(body.tier).toBe('Harvest Partner');
  });

  test('verifies a partner only by exact email match (no partial probing)', async () => {
    const chain = chainFor({ data: [subscriptionRow], error: null });
    vi.mocked(getSupabase).mockReturnValue(chain as never);
    const res = await app.request('/verify-receipt?partner=jane@example.com');
    const body = await res.json();
    expect(body.verified).toBe(true);
    // Exact equality, not an ilike substring probe.
    expect(chain.eq).toHaveBeenCalledWith('subscriber_email', 'jane@example.com');
    expect(chain.ilike).not.toHaveBeenCalled();
  });

  test('returns verified:false for an unknown partner credential', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: [], error: null }) as never);
    const res = await app.request('/verify-receipt?partner=HKN-PTN-999999');
    const body = await res.json();
    expect(body.verified).toBe(false);
    expect(body.tier).toBeUndefined();
    expect(body.name).toBeUndefined();
  });

  test('verifies a statement only with a valid year and a known partner', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: [subscriptionRow], error: null }) as never);
    const res = await app.request('/verify-receipt?statement=2026&partner=HKN-PTN-4029');
    const body = await res.json();
    expect(body.verified).toBe(true);
    expect(body.type).toBe('statement');
    expect(body.year).toBe('2026');
  });

  test('returns verified:false for a statement without a partner credential', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: [subscriptionRow], error: null }) as never);
    const res = await app.request('/verify-receipt?statement=2026');
    const body = await res.json();
    expect(body.verified).toBe(false);
  });

  test('returns verified:false for a statement whose partner is not in the registry', async () => {
    vi.mocked(getSupabase).mockReturnValue(chainFor({ data: [], error: null }) as never);
    const res = await app.request('/verify-receipt?statement=2026&partner=HKN-PTN-4029');
    const body = await res.json();
    expect(body.verified).toBe(false);
  });
});

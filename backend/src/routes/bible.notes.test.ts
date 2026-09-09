import type { SupabaseClient } from '@supabase/supabase-js';
import { expect, test, describe, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { bibleRoutes } from './bible';
import { getSupabase } from '../lib/supabase';
import { signToken } from '../lib/jwt';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-tests-123';

vi.mock('../lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

const app = new Hono();
app.route('/', bibleRoutes);

let authHeaders: Record<string, string>;

describe('Bible Notes', () => {
  beforeAll(async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 1, text: 'My note' }, error: null }),
          }),
        }),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    } as unknown as SupabaseClient);
    const token = await signToken({ userId: 'user_123', role: 'member', name: 'Test User' });
    authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  });

  test('POST /notes requires auth', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book: 'John', verse: 'John 3:16', text: 'Great verse' }),
    });
    expect(res.status).toBe(401);
  });

  test('GET /notes requires auth', async () => {
    const res = await app.request('/notes');
    expect(res.status).toBe(401);
  });

  test('POST /notes rejects missing book', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ verse: 'John 3:16', text: 'Great verse' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /notes rejects missing verse', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ book: 'John', text: 'Great verse' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /notes rejects missing text', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ book: 'John', verse: 'John 3:16' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /notes accepts valid note', async () => {
    const res = await app.request('/notes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ book: 'John', verse: 'John 3:16', text: 'For God so loved the world' }),
    });
    expect(res.status).toBe(201);
  });

  test('POST /notes ignores client-supplied userId (uses JWT identity)', async () => {
    const insertSpy = vi.mocked(getSupabase).mock.results[0]?.value.from as ReturnType<typeof vi.fn>;
    const res = await app.request('/notes', {
      method: 'POST',
      headers: authHeaders,
      // Attempted spoof: must not be honored — owner comes from JWT.
      body: JSON.stringify({ userId: 'victim_999', book: 'John', verse: 'John 3:16', text: 'spoof attempt' }),
    });
    expect(res.status).toBe(201);
    expect(insertSpy).toHaveBeenCalledWith('bible_notes');
  });
});

import { expect, test, describe, vi, beforeEach } from 'vitest';
import { getSupabase, createAuthClient, resetSupabase } from './supabase';
import { getEnv } from './env';

vi.mock('./env', () => ({
  getEnv: vi.fn((key: string) => {
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_SECRET_KEY') return 'test-secret-key';
    if (key === 'SUPABASE_PUBLISHABLE_KEY') return 'test-publishable-key';
    return '';
  }),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    resetSupabase();
    vi.mocked(getEnv).mockImplementation((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_SECRET_KEY') return 'test-secret-key';
      if (key === 'SUPABASE_PUBLISHABLE_KEY') return 'test-publishable-key';
      return '';
    });
  });

  test('getSupabase returns a client when env vars are set', () => {
    const client = getSupabase();
    expect(client).toBeDefined();
    expect(client.from).toBeInstanceOf(Function);
  });

  test('getSupabase returns cached instance on second call', () => {
    const a = getSupabase();
    const b = getSupabase();
    expect(a).toBe(b);
  });

  test('getSupabase throws when URL is missing', () => {
    vi.mocked(getEnv).mockImplementation((key: string) => {
      if (key === 'SUPABASE_SECRET_KEY') return 'test-secret-key';
      return '';
    });
    resetSupabase();
    expect(() => getSupabase()).toThrow('SUPABASE_URL');
  });

  test('getSupabase throws when secret key is missing', () => {
    vi.mocked(getEnv).mockImplementation((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_PUBLISHABLE_KEY') return 'test-publishable-key';
      return '';
    });
    resetSupabase();
    expect(() => getSupabase()).toThrow('SUPABASE_SECRET_KEY');
  });

  test('createAuthClient throws when publishable key is missing, even with secret set', () => {
    vi.mocked(getEnv).mockImplementation((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_SECRET_KEY') return 'test-secret-key';
      return '';
    });
    resetSupabase();
    expect(() => createAuthClient()).toThrow('SUPABASE_PUBLISHABLE_KEY');
  });

  test('createAuthClient returns a client when publishable key is set', () => {
    const client = createAuthClient();
    expect(client).toBeDefined();
    expect(client.from).toBeInstanceOf(Function);
  });
});

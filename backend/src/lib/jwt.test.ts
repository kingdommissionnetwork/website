import { expect, test, describe } from 'vitest';
import { Hono } from 'hono';
import { signToken, verifyToken, requireAdmin, requireAdminScope } from './jwt';

process.env.JWT_SECRET = 'test-secret';

describe('JWT Utility', () => {
  test('should sign and verify a token correctly', async () => {
    const payload = { userId: 'user_123', role: 'admin', name: 'John Doe' };
    const token = await signToken(payload);
    expect(token).toBeDefined();

    const verified = await verifyToken(token);
    expect(verified.userId).toBe('user_123');
    expect(verified.role).toBe('admin');
    expect(verified.name).toBe('John Doe');
  });

  test('should throw on invalid token', async () => {
    await expect(verifyToken('invalid.token.here')).rejects.toThrow();
  });

  async function scopeStatus(role: string, method: string, path: string, body?: unknown) {
    const app = new Hono();
    app.use('*', requireAdmin, requireAdminScope);
    app.all('*', (c) => c.json({ ok: true }));
    const token = await signToken({ userId: 'u1', role, name: 'Test' });
    return app.request(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  test('analyst is read-only: GET allowed, broadcast/claim-resolve blocked', async () => {
    expect((await scopeStatus('analyst', 'GET', '/api/admin/stats')).status).toBe(200);
    expect((await scopeStatus('analyst', 'POST', '/api/admin/broadcast', {})).status).toBe(403);
    expect((await scopeStatus('analyst', 'POST', '/api/admin/mpesa/claims/1/resolve', {})).status).toBe(403);
  });

  test('change_role and invites require super roles', async () => {
    expect(
      (await scopeStatus('support_admin', 'POST', '/api/admin/members/1/action', { action: 'change_role', role: 'admin' })).status
    ).toBe(403);
    expect((await scopeStatus('finance_admin', 'POST', '/api/admin/invite', {})).status).toBe(403);
    expect(
      (await scopeStatus('superadmin', 'POST', '/api/admin/members/1/action', { action: 'change_role', role: 'admin' })).status
    ).toBe(200);
  });
});

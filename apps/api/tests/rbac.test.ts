import { describe, expect, it, vi } from 'vitest';
import { requireRoles } from '../src/middleware/auth.middleware.js';

describe('RBAC middleware', () => {
  it('rejects a student when an admin role is required', () => {
    const next = vi.fn();
    requireRoles('ADMIN')({ auth: { userId: 'student-id', role: 'STUDENT' } } as never, {} as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('permits an administrator', () => {
    const next = vi.fn();
    requireRoles('ADMIN')({ auth: { userId: 'admin-id', role: 'ADMIN' } } as never, {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });
});

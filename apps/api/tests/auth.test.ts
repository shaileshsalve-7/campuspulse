import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/services/auth.service.js';

describe('credential security', () => {
  it('hashes passwords and verifies the correct password only', async () => {
    const hash = await hashPassword('CampusPulse2026');
    expect(hash).not.toContain('CampusPulse2026');
    await expect(verifyPassword('CampusPulse2026', hash)).resolves.toBe(true);
    await expect(verifyPassword('incorrect-password', hash)).resolves.toBe(false);
  });
});

import { createHash, randomBytes } from 'node:crypto';

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

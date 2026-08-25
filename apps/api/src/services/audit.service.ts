import { AuditLog } from '../models/audit-log.model.js';

export async function recordAudit(input: { actorId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }): Promise<void> {
  await AuditLog.create(input);
}

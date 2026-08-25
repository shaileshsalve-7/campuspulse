import { Schema, model, type Types } from 'mongoose';
export interface IAuditLog { actorId?: Types.ObjectId; action: string; entityType: string; entityId?: Types.ObjectId; metadata?: Record<string, unknown>; createdAt: Date; }
const schema = new Schema<IAuditLog>({ actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, action: { type: String, required: true, trim: true, maxlength: 100, index: true }, entityType: { type: String, required: true, trim: true, maxlength: 100, index: true }, entityId: Schema.Types.ObjectId, metadata: Schema.Types.Mixed }, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
schema.index({ createdAt: -1 });
export const AuditLog = model<IAuditLog>('AuditLog', schema);

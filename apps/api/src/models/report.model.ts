import { Schema, model, type Types } from 'mongoose';
export const REPORT_TARGETS = ['ISSUE', 'FEEDBACK', 'EVENT', 'CLUB', 'ANNOUNCEMENT'] as const;
export const REPORT_STATUSES = ['PENDING', 'APPROVED', 'REMOVED', 'REJECTED'] as const;
export interface IReport { targetType: (typeof REPORT_TARGETS)[number]; targetId: Types.ObjectId; reporterId: Types.ObjectId; reason: string; details?: string; status: (typeof REPORT_STATUSES)[number]; reviewedById?: Types.ObjectId; reviewNote?: string; createdAt: Date; updatedAt: Date; }
const schema = new Schema<IReport>({ targetType: { type: String, enum: REPORT_TARGETS, required: true, index: true }, targetId: { type: Schema.Types.ObjectId, required: true, index: true }, reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, reason: { type: String, required: true, trim: true, maxlength: 150 }, details: { type: String, trim: true, maxlength: 1000 }, status: { type: String, enum: REPORT_STATUSES, default: 'PENDING', index: true }, reviewedById: { type: Schema.Types.ObjectId, ref: 'User' }, reviewNote: { type: String, trim: true, maxlength: 1000 } }, { timestamps: true, versionKey: false });
schema.index({ status: 1, createdAt: -1 });
export const Report = model<IReport>('Report', schema);

import { Schema, model, type Types } from 'mongoose';
export const FEEDBACK_STATUSES = ['NEW', 'IN_REVIEW', 'RESPONDED', 'ARCHIVED'] as const;
export interface IFeedback { authorId: Types.ObjectId; subject: string; message: string; category?: string; isAnonymous: boolean; status: (typeof FEEDBACK_STATUSES)[number]; response?: string; respondedById?: Types.ObjectId; respondedAt?: Date; createdAt: Date; updatedAt: Date; }
const schema = new Schema<IFeedback>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 150 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, trim: true, maxlength: 80 },
  isAnonymous: { type: Boolean, default: true },
  status: { type: String, enum: FEEDBACK_STATUSES, default: 'NEW', index: true },
  response: { type: String, trim: true, maxlength: 3000 },
  respondedById: { type: Schema.Types.ObjectId, ref: 'User' },
  respondedAt: Date,
}, { timestamps: true, versionKey: false });
schema.index({ status: 1, createdAt: -1 });
export const Feedback = model<IFeedback>('Feedback', schema);

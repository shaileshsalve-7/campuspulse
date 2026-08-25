import { Schema, model, type Types } from 'mongoose';
export const NOTIFICATION_TYPES = ['ISSUE_STATUS', 'ISSUE_ASSIGNMENT', 'EVENT_REGISTRATION', 'EVENT_REMINDER', 'ANNOUNCEMENT', 'CLUB_UPDATE', 'FEEDBACK_RESPONSE'] as const;
export interface INotification { recipientId: Types.ObjectId; type: (typeof NOTIFICATION_TYPES)[number]; title: string; body: string; link?: string; isRead: boolean; createdAt: Date; updatedAt: Date; }
const schema = new Schema<INotification>({ recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, type: { type: String, enum: NOTIFICATION_TYPES, required: true }, title: { type: String, required: true, trim: true, maxlength: 150 }, body: { type: String, required: true, trim: true, maxlength: 500 }, link: String, isRead: { type: Boolean, default: false, index: true } }, { timestamps: true, versionKey: false });
schema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
export const Notification = model<INotification>('Notification', schema);

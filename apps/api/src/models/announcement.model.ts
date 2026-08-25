import { Schema, model, type Types } from 'mongoose';
export const ANNOUNCEMENT_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export interface IAnnouncement { title: string; content: string; priority: (typeof ANNOUNCEMENT_PRIORITIES)[number]; attachmentUrl?: string; authorId: Types.ObjectId; publishDate: Date; expiryDate?: Date; isPublished: boolean; createdAt: Date; updatedAt: Date; }
const schema = new Schema<IAnnouncement>({ title: { type: String, required: true, trim: true, maxlength: 180 }, content: { type: String, required: true, trim: true, maxlength: 10000 }, priority: { type: String, enum: ANNOUNCEMENT_PRIORITIES, default: 'NORMAL', index: true }, attachmentUrl: String, authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, publishDate: { type: Date, default: Date.now, index: true }, expiryDate: Date, isPublished: { type: Boolean, default: true, index: true } }, { timestamps: true, versionKey: false });
schema.index({ isPublished: 1, publishDate: -1 });
schema.index({ title: 'text', content: 'text' });
export const Announcement = model<IAnnouncement>('Announcement', schema);

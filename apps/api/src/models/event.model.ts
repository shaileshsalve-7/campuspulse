import { Schema, model, type Types } from 'mongoose';
export const EVENT_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Hackathon', 'Seminar', 'Club Event', 'Other'] as const;
export interface IEvent { title: string; description: string; organizerId: Types.ObjectId; clubId?: Types.ObjectId; date: Date; startTime: string; endTime: string; location: string; imageUrl?: string; category: (typeof EVENT_CATEGORIES)[number]; registrationLimit: number; registrationCount: number; createdAt: Date; updatedAt: Date; }
const schema = new Schema<IEvent>({
  title: { type: String, required: true, trim: true, maxlength: 150 }, description: { type: String, required: true, trim: true, maxlength: 5000 }, organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, clubId: { type: Schema.Types.ObjectId, ref: 'Club', index: true }, date: { type: Date, required: true, index: true }, startTime: { type: String, required: true, maxlength: 10 }, endTime: { type: String, required: true, maxlength: 10 }, location: { type: String, required: true, trim: true, maxlength: 150 }, imageUrl: String, category: { type: String, enum: EVENT_CATEGORIES, required: true, index: true }, registrationLimit: { type: Number, required: true, min: 1, max: 100000 }, registrationCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true, versionKey: false });
schema.index({ date: 1, category: 1 });
schema.index({ title: 'text', description: 'text' });
export const Event = model<IEvent>('Event', schema);

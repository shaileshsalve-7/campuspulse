import { Schema, model, type Types } from 'mongoose';
interface IEventRegistration { eventId: Types.ObjectId; userId: Types.ObjectId; createdAt: Date; }
const schema = new Schema<IEventRegistration>({ eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true }, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
schema.index({ eventId: 1, userId: 1 }, { unique: true });
export const EventRegistration = model<IEventRegistration>('EventRegistration', schema);

import { Schema, model, type Types } from 'mongoose';
export interface IClub { name: string; slug: string; logoUrl?: string; description: string; category: string; socialLinks: { website?: string; instagram?: string; linkedin?: string }; coordinatorId: Types.ObjectId; followerCount: number; isActive: boolean; createdAt: Date; updatedAt: Date; }
const schema = new Schema<IClub>({
  name: { type: String, required: true, trim: true, maxlength: 100, unique: true }, slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true }, logoUrl: String, description: { type: String, required: true, trim: true, maxlength: 3000 }, category: { type: String, required: true, trim: true, maxlength: 80, index: true }, socialLinks: { website: String, instagram: String, linkedin: String }, coordinatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, followerCount: { type: Number, default: 0, min: 0 }, isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, versionKey: false });
schema.index({ name: 'text', description: 'text' });
export const Club = model<IClub>('Club', schema);

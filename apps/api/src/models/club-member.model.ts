import { Schema, model, type Types } from 'mongoose';
interface IClubMember { clubId: Types.ObjectId; userId: Types.ObjectId; createdAt: Date; }
const schema = new Schema<IClubMember>({ clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true }, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
schema.index({ clubId: 1, userId: 1 }, { unique: true });
export const ClubMember = model<IClubMember>('ClubMember', schema);

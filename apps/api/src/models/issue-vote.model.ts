import { Schema, model, type Types } from 'mongoose';
interface IIssueVote { issueId: Types.ObjectId; userId: Types.ObjectId; createdAt: Date; }
const schema = new Schema<IIssueVote>({ issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true }, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
schema.index({ issueId: 1, userId: 1 }, { unique: true });
export const IssueVote = model<IIssueVote>('IssueVote', schema);

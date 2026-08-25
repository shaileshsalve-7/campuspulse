import { Schema, model, type Types } from 'mongoose';
import { ISSUE_STATUSES, type IssueStatus } from './issue.model.js';

export interface IIssueStatusHistory { issueId: Types.ObjectId; fromStatus?: IssueStatus; toStatus: IssueStatus; changedById: Types.ObjectId; note?: string; createdAt: Date; }
const schema = new Schema<IIssueStatusHistory>({
  issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
  fromStatus: { type: String, enum: ISSUE_STATUSES },
  toStatus: { type: String, enum: ISSUE_STATUSES, required: true },
  changedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
schema.index({ issueId: 1, createdAt: 1 });
export const IssueStatusHistory = model<IIssueStatusHistory>('IssueStatusHistory', schema);

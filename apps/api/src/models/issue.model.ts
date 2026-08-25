import { Schema, model, type Types } from 'mongoose';

export const ISSUE_CATEGORIES = ['Infrastructure', 'Cleanliness', 'Electricity', 'Water', 'WiFi', 'Security', 'Transportation', 'Library', 'Hostel', 'Canteen', 'Academic', 'Other'] as const;
export const ISSUE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const ISSUE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface IIssue {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  reporterId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  assigneeId?: Types.ObjectId;
  location: { name: string; coordinates?: [number, number] };
  imageUrls: string[];
  isAnonymous: boolean;
  upvoteCount: number;
  statusUpdatedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  coordinates: { type: [Number], validate: { validator: (value?: number[]) => !value || value.length === 2, message: 'Coordinates require [longitude, latitude].' } },
}, { _id: false });

const issueSchema = new Schema<IIssue>({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, enum: ISSUE_CATEGORIES, required: true, index: true },
  priority: { type: String, enum: ISSUE_PRIORITIES, default: 'MEDIUM', index: true },
  status: { type: String, enum: ISSUE_STATUSES, default: 'SUBMITTED', index: true },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  location: { type: locationSchema, required: true },
  imageUrls: { type: [String], default: [], validate: [(value: string[]) => value.length <= 5, 'A report can have at most 5 images.'] },
  isAnonymous: { type: Boolean, default: false },
  upvoteCount: { type: Number, default: 0, min: 0, index: -1 },
  statusUpdatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
}, { timestamps: true, versionKey: false });

issueSchema.index({ category: 1, status: 1, priority: 1, createdAt: -1 });
issueSchema.index({ title: 'text', description: 'text' });
issueSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });
export const Issue = model<IIssue>('Issue', issueSchema);

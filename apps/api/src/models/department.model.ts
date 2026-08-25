import { Schema, model } from 'mongoose';

export interface IDepartment {
  name: string;
  code: string;
  description?: string;
  managerId?: Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 20 },
  description: { type: String, trim: true, maxlength: 500 },
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, versionKey: false });

export const Department = model<IDepartment>('Department', departmentSchema);

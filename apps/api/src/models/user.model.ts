import { Schema, model, type HydratedDocument } from 'mongoose';

export const USER_ROLES = ['STUDENT', 'FACULTY', 'CLUB_COORDINATOR', 'ADMIN', 'SUPER_ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'STUDENT', index: true },
    avatarUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index({ role: 1, isActive: 1 });

export const User = model<IUser>('User', userSchema);

export function publicUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

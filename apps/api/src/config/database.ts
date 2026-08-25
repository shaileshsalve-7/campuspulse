import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  console.info(`MongoDB connected: ${mongoose.connection.host}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

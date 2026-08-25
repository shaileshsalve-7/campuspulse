import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { hashPassword } from '../services/auth.service.js';
import { User } from '../models/user.model.js';

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running the admin seed.');
  }
  if (password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.');
  await connectDatabase();
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        firstName: process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Campus',
        lastName: process.env.SEED_ADMIN_LAST_NAME?.trim() || 'Administrator',
        passwordHash: await hashPassword(password),
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      $setOnInsert: { email },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.info(`Super admin ready: ${user.email}`);
  await disconnectDatabase();
}

seedAdmin().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await disconnectDatabase();
  process.exit(1);
});

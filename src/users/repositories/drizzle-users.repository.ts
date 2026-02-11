import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../infra/database/drizzle/drizzle.service';
import { users } from '../../infra/database/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import {
  IUsersRepository,
  CreateUserData,
  UpdateUserData,
  User,
} from './users.repository.interface';

@Injectable()
export class DrizzleUsersRepository implements IUsersRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(data: CreateUserData): Promise<Omit<User, 'hashedPassword'>> {
    const db = this.drizzleService.connection;

    const [newUser] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        hashedPassword: data.hashedPassword,
      })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    const { hashedPassword: _pw, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = this.drizzleService.connection;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const db = this.drizzleService.connection;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const db = this.drizzleService.connection;
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = lower(${username})`)
      .limit(1);

    return user || null;
  }

  async update(
    userId: string,
    data: UpdateUserData,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const db = this.drizzleService.connection;

    const setValues: {
      updatedAt: Date;
      username?: string;
      email?: string;
      hashedPassword?: string;
    } = { updatedAt: new Date() };
    if (data.username !== undefined) setValues.username = data.username;
    if (data.email !== undefined) setValues.email = data.email;
    if (data.hashedPassword !== undefined)
      setValues.hashedPassword = data.hashedPassword;

    const [updatedUser] = await db
      .update(users)
      .set(setValues)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    const { hashedPassword: _pw, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }

  async updateFeatures(userId: string, features: string[]): Promise<void> {
    const db = this.drizzleService.connection;
    await db
      .update(users)
      .set({ features, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

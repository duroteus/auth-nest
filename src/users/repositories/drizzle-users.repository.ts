import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../infra/database/drizzle/drizzle.service';
import { users } from '../../infra/database/drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  IUsersRepository,
  CreateUserData,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword: _, ...userWithoutPassword } = newUser;

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
      .where(eq(users.username, username))
      .limit(1);

    return user || null;
  }
}

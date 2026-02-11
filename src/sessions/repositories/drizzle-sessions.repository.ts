import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../infra/database/drizzle/drizzle.service';
import { sessions } from '../../infra/database/drizzle/schema';
import { eq, lt } from 'drizzle-orm';
import {
  ISessionsRepository,
  CreateSessionData,
  Session,
} from './sessions.repository.interface';

@Injectable()
export class DrizzleSessionsRepository implements ISessionsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(data: CreateSessionData): Promise<Session> {
    const db = this.drizzleService.connection;

    const [newSession] = await db
      .insert(sessions)
      .values({
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      })
      .returning();

    return newSession;
  }

  async findByToken(token: string): Promise<Session | null> {
    const db = this.drizzleService.connection;
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    return session || null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const db = this.drizzleService.connection;
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));

    return userSessions;
  }

  async deleteByToken(token: string): Promise<void> {
    const db = this.drizzleService.connection;
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteExpired(): Promise<void> {
    const db = this.drizzleService.connection;
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }
}

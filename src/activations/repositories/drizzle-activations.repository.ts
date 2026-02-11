import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../infra/database/drizzle/drizzle.service';
import { activationTokens } from '../../infra/database/drizzle/schema';
import { eq, lt } from 'drizzle-orm';
import {
  IActivationsRepository,
  CreateActivationTokenData,
  ActivationToken,
} from './activations.repository.interface';

@Injectable()
export class DrizzleActivationsRepository implements IActivationsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(data: CreateActivationTokenData): Promise<ActivationToken> {
    const db = this.drizzleService.connection;

    const [newToken] = await db
      .insert(activationTokens)
      .values({
        userId: data.userId,
        expiresAt: data.expiresAt,
      })
      .returning();

    if (!newToken) {
      throw new Error('Failed to create activation token');
    }

    return newToken;
  }

  async findById(id: string): Promise<ActivationToken | null> {
    const db = this.drizzleService.connection;
    const [token] = await db
      .select()
      .from(activationTokens)
      .where(eq(activationTokens.id, id))
      .limit(1);

    return token || null;
  }

  async markAsUsed(id: string): Promise<void> {
    const db = this.drizzleService.connection;
    await db
      .update(activationTokens)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(eq(activationTokens.id, id));
  }

  async deleteExpired(): Promise<void> {
    const db = this.drizzleService.connection;
    await db
      .delete(activationTokens)
      .where(lt(activationTokens.expiresAt, new Date()));
  }
}

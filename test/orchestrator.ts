import type { INestApplication } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import retry from 'async-retry';
import { DrizzleService } from '../src/infra/database/drizzle/drizzle.service';
import { UsersService } from '../src/users/users.service';
import { ActivationsService } from '../src/activations/activations.service';
import { SessionsService } from '../src/sessions/sessions.service';
import type { IUsersRepository } from '../src/users/repositories/users.repository.interface';

function randomStr(length: number): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const EMAIL_HTTP_HOST = process.env.EMAIL_HTTP_HOST || 'localhost';
const EMAIL_HTTP_PORT = process.env.EMAIL_HTTP_PORT || '1080';
const emailHttpUrl = `http://${EMAIL_HTTP_HOST}:${EMAIL_HTTP_PORT}`;

export async function waitForAllServices(
  _app: INestApplication,
): Promise<void> {
  await waitForWebServer();
  await waitForEmailServer();
}

async function waitForWebServer(): Promise<void> {
  await (retry as (fn: () => Promise<void>, opts: object) => Promise<void>)(
    async () => {
      const response = await fetch(`${BASE_URL}`);
      if (!response.ok) {
        throw new Error(`Web server responded with status: ${response.status}`);
      }
    },
    {
      retries: 100,
      maxTimeout: 1000,
      onRetry: (e: unknown, attempt: number) => {
        console.log({
          attempt,
          error: e instanceof Error ? e.message : String(e),
        });
      },
    },
  );
}

async function waitForEmailServer(): Promise<void> {
  await (retry as (fn: () => Promise<void>, opts: object) => Promise<void>)(
    async () => {
      const response = await fetch(emailHttpUrl);
      if (!response.ok) {
        throw new Error(
          `Email server responded with status: ${response.status}`,
        );
      }
    },
    {
      retries: 100,
      maxTimeout: 1000,
      onRetry: (e: unknown, attempt: number) => {
        console.log({
          attempt,
          error: e instanceof Error ? e.message : String(e),
        });
      },
    },
  );
}

export async function clearDatabase(app: INestApplication): Promise<void> {
  const drizzleService = app.get(DrizzleService);
  const db = drizzleService.connection;
  await db.execute(sql`TRUNCATE TABLE users CASCADE`);
}

export function createUser(
  app: INestApplication,
  userObject?: {
    username?: string;
    email?: string;
    password?: string;
  },
) {
  const usersService = app.get(UsersService);
  const username =
    userObject?.username ??
    `user_${randomStr(8)}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = userObject?.email ?? `user${randomStr(6)}@test.com`;
  const password = userObject?.password ?? 'validpassword';

  return usersService.create({
    username: username.slice(0, 30),
    email,
    password,
  });
}

export function activateUser(app: INestApplication, userId: string) {
  const activationsService = app.get(ActivationsService);
  return activationsService.activateByUserId(userId);
}

export async function createSession(
  app: INestApplication,
  userId: string,
): Promise<{ token: string; expiresAt: Date; userId: string }> {
  const sessionsService = app.get(SessionsService);
  return await sessionsService.createForUser(userId);
}

export async function deleteAllEmails(): Promise<void> {
  await fetch(`${emailHttpUrl}/messages`, { method: 'DELETE' });
}

export async function getLastEmail(): Promise<{
  sender: string;
  recipients: string[];
  subject: string;
  text: string;
  id: number;
} | null> {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = (await emailListResponse.json()) as Array<{
    id: number;
    sender: string;
    recipients: string[];
    subject: string;
  }>;
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();

  return {
    ...lastEmailItem,
    text: emailTextBody,
  };
}

export function extractUUID(text: string): string | null {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

export async function addFeaturesToUser(
  app: INestApplication,
  userId: string,
  features: string[],
): Promise<void> {
  const usersRepository = app.get<IUsersRepository>('IUsersRepository');
  const user = await usersRepository.findById(userId);
  if (!user) throw new Error('User not found');
  const currentFeatures = user.features ?? [];
  const newFeatures = [...new Set([...currentFeatures, ...features])];
  await usersRepository.updateFeatures(userId, newFeatures);
}

export const orchestrator = {
  waitForAllServices,
  clearDatabase,
  createUser,
  activateUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  extractUUID,
  addFeaturesToUser,
};
